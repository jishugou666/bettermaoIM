const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../../core/prisma');
const creditService = require('../credit/credit.service');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'bettermao_super_secret_key_change_me_in_production';
const JWT_EXPIRES_IN = '7d';

class AuthService {
  async register({ email, username, password }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('Email or username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        nickname: username // Default nickname to username
      }
    });

    // Initialize credit account
    await creditService.getBalance(user.id);

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async login({ email, password }) {
    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username: email }
        ]
      }
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Trigger daily login task
    // We don't await this to avoid blocking login response, but we should handle errors if critical.
    // Since it's a background task, we can just fire and forget or log error.
    creditService.checkAndCompleteTask(user.id, 'daily_login').catch(err => {
      console.error('Failed to process daily_login task', err);
    });

    const token = this.generateToken(user);
    return { user: this.sanitizeUser(user), token };
  }

  async getMe(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return this.sanitizeUser(user);
  }

  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  sanitizeUser(user) {
    const { password, ...rest } = user;
    return rest;
  }
}

module.exports = new AuthService();
