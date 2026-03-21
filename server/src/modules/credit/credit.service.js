const prisma = require('../../core/prisma');
const redisClient = require('../../core/redis');

const TASKS = {
  DAILY_LOGIN: {
    key: 'daily_login',
    reward: 10,
    name: 'Daily Login'
  },
  PROFILE_COMPLETE: {
    key: 'profile_complete',
    reward: 50,
    name: 'Complete Profile'
  },
  FIRST_FRIEND: {
    key: 'first_friend',
    reward: 30,
    name: 'Add First Friend'
  },
  FIRST_GROUP: {
    key: 'first_group',
    reward: 40,
    name: 'Create First Group'
  },
  FIRST_MOMENT: {
    key: 'first_moment',
    reward: 20,
    name: 'Post First Moment'
  },
  FIRST_LIKE: {
    key: 'first_like',
    reward: 5,
    name: 'Like a Moment'
  },
  FIRST_COMMENT: {
    key: 'first_comment',
    reward: 10,
    name: 'Post a Comment'
  }
};

const VIP_COST = 5000; // Cost for VIP status
const DAILY_TIP_LIMIT = 1000; // Max credits one can tip to the same user per day

class CreditService {
  async purchaseVip(userId) {
    return await prisma.$transaction(async (tx) => {
      // 1. Check user status
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user.isVip) {
        throw new Error('User is already a VIP');
      }

      // 2. Check balance
      const userCredit = await tx.userCredit.findUnique({ where: { userId } });
      if (!userCredit || userCredit.balance < VIP_COST) {
        throw new Error(`Insufficient balance. Need ${VIP_COST} credits.`);
      }

      // 3. Deduct balance
      await tx.userCredit.update({
        where: { userId },
        data: { balance: { decrement: VIP_COST } }
      });

      // 4. Update user status
      await tx.user.update({
        where: { id: userId },
        data: { isVip: true }
      });

      // 5. Create transaction record
      await tx.creditTransaction.create({
        data: {
          userId,
          type: 'vip_purchase',
          amount: -VIP_COST,
          remark: 'Purchased VIP Status'
        }
      });

      return { success: true, message: 'VIP purchased successfully' };
    });
  }

  async getBalance(userId) {
    let credit = await prisma.userCredit.findUnique({
      where: { userId }
    });

    if (!credit) {
      credit = await prisma.userCredit.create({
        data: { userId }
      });
    }

    return credit;
  }

  async getTransactions(userId) {
    return await prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async checkAndCompleteTask(userId, taskKey) {
    const task = Object.values(TASKS).find(t => t.key === taskKey);
    if (!task) {
      console.warn(`Task key ${taskKey} not found`);
      return null;
    }

    // Verify condition for manual claims
    // We only need to check for non-login tasks if they are being claimed manually (which shouldn't happen with correct UI, but for safety)
    if (taskKey === 'profile_complete') {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user.nickname || !user.avatar || !user.bio) return null;
    } else if (taskKey === 'first_friend') {
      const count = await prisma.friendship.count({ where: { OR: [{ userId, status: 'ACCEPTED' }, { friendId: userId, status: 'ACCEPTED' }] } });
      if (count === 0) return null;
    } else if (taskKey === 'first_group') {
      const count = await prisma.group.count({ where: { creatorId: userId } });
      if (count === 0) return null;
    } else if (taskKey === 'first_moment') {
      const count = await prisma.moment.count({ where: { userId } });
      if (count === 0) return null;
    } else if (taskKey === 'first_like') {
      const count = await prisma.like.count({ where: { userId } });
      if (count === 0) return null;
    } else if (taskKey === 'first_comment') {
      const count = await prisma.comment.count({ where: { userId } });
      if (count === 0) return null;
    }

    // Check if task is already completed (for one-time tasks)
    // For daily tasks, check if completed TODAY
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (taskKey === 'daily_login') {
      const log = await prisma.taskLog.findFirst({
        where: {
          userId,
          taskKey,
          completedAt: { gte: startOfDay }
        }
      });
      if (log) return null; // Already done today
    } else {
      const log = await prisma.taskLog.findFirst({
        where: { userId, taskKey }
      });
      if (log) return null; // Already done once
    }

    // Execute transaction in a transaction to ensure consistency
    return await prisma.$transaction(async (tx) => {
      // 1. Log task
      await tx.taskLog.create({
        data: { userId, taskKey }
      });

      // 2. Add credit transaction
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type: taskKey,
          amount: task.reward,
          remark: task.name
        }
      });

      // 3. Update balance
      const credit = await tx.userCredit.upsert({
        where: { userId },
        update: {
          balance: { increment: task.reward },
          totalEarned: { increment: task.reward }
        },
        create: {
          userId,
          balance: task.reward,
          totalEarned: task.reward
        }
      });

      return { credit, transaction, task };
    });
  }

  async getTasksStatus(userId) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const logs = await prisma.taskLog.findMany({
      where: { userId }
    });

    return Object.values(TASKS).map(task => {
      let completed = false;
      if (task.key === 'daily_login') {
        completed = logs.some(l => l.taskKey === task.key && l.completedAt >= startOfDay);
      } else {
        completed = logs.some(l => l.taskKey === task.key);
      }
      return { ...task, completed };
    });
  }
  async transfer(fromUserId, toUserId, amount, type = 'tip', remark = 'Tip') {
    if (fromUserId === toUserId) throw new Error('Cannot transfer to yourself');
    if (amount <= 0) throw new Error('Amount must be positive');

    // Check Daily Limit in Redis
    const today = new Date().toISOString().split('T')[0];
    const limitKey = `limit:tip:u:${fromUserId}:to:${toUserId}:day:${today}`;
    
    const currentAmountStr = await redisClient.get(limitKey);
    const currentAmount = currentAmountStr ? parseInt(currentAmountStr) : 0;

    if (currentAmount + amount > DAILY_TIP_LIMIT) {
      throw new Error(`Daily tip limit of ${DAILY_TIP_LIMIT} exceeded for this user`);
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Check balance
      const senderCredit = await tx.userCredit.findUnique({ where: { userId: fromUserId } });
      if (!senderCredit || senderCredit.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // 2. Deduct from sender
      await tx.userCredit.update({
        where: { userId: fromUserId },
        data: { balance: { decrement: amount } }
      });

      // 3. Add to receiver
      await tx.userCredit.upsert({
        where: { userId: toUserId },
        update: {
          balance: { increment: amount },
          totalEarned: { increment: amount }
        },
        create: {
          userId: toUserId,
          balance: amount,
          totalEarned: amount
        }
      });

      // 4. Create transactions for both
      const txSender = await tx.creditTransaction.create({
        data: {
          userId: fromUserId,
          type: `${type}_sent`,
          amount: -amount,
          remark: `Sent ${remark}`
        }
      });

      const txReceiver = await tx.creditTransaction.create({
        data: {
          userId: toUserId,
          type: `${type}_received`,
          amount: amount,
          remark: `Received ${remark}`
        }
      });

      // 5. Update Redis limit
      // We do this inside transaction block logic, but Redis operations are not rolled back if Prisma tx fails.
      // However, it's safer to increment AFTER DB success or accept slight inaccuracy.
      // To be strictly correct, we should do it after transaction commits, but here we can just do it.
      // If DB fails, we might have incremented Redis limit falsely. 
      // A better way is to do it after await prisma.$transaction.
      
      return { txSender, txReceiver };
    }).then(async (result) => {
      // Update Redis after successful transaction
      await redisClient.incrBy(limitKey, amount);
      await redisClient.expire(limitKey, 86400); // 24h
      return result;
    });
  }
}

module.exports = new CreditService();
