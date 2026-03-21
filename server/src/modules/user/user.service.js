const prisma = require('../../core/prisma');
const creditService = require('../credit/credit.service');

class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        gender: true,
        location: true,
        tags: true,
        createdAt: true
      }
    });
    return user;
  }

  async updateProfile(userId, data) {
    const { nickname, bio, avatar, gender, location, tags } = data;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
        bio,
        avatar,
        gender,
        location,
        tags
      },
      select: {
        id: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        bio: true,
        role: true,
        gender: true,
        location: true,
        tags: true,
        updatedAt: true
      }
    });

    // Check if profile is complete
    // We can do this asynchronously
    if (user.nickname && user.avatar && user.bio) {
      creditService.checkAndCompleteTask(userId, 'profile_complete').catch(console.error);
    }

    return user;
  }
}

module.exports = new UserService();
