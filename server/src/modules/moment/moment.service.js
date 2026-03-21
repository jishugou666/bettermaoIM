const prisma = require('../../core/prisma');
const { get, run } = require('../../core/database');

class MomentService {
  async createMoment(userId, { content, images }) {
    return await prisma.moment.create({
      data: {
        userId,
        content,
        images: images ? JSON.stringify(images) : null
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        }
      }
    });
  }

  async getFeed(userId, limit = 20, offset = 0) {
    const moments = await prisma.moment.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        },
        likes: {
          where: { userId },
          select: { id: true }
        }
      }
    });

    return moments.map(m => ({
      ...m,
      images: m.images ? JSON.parse(m.images) : [],
      isLiked: m.likes.length > 0
    }));
  }

  async getUserMoments(targetUserId, currentUserId, limit = 20, offset = 0) {
    const moments = await prisma.moment.findMany({
      where: { userId: targetUserId }, // 只返回目标用户的动态
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true }
        }
      }
    });

    return moments.map(m => ({
      ...m,
      images: m.images ? JSON.parse(m.images) : [],
      isLiked: m.likes.length > 0
    }));
  }

  async toggleLike(userId, momentId) {
    // 直接使用SQL查询查找点赞记录，确保返回id
    const existing = await get('SELECT * FROM Like WHERE userId = ? AND momentId = ?', [userId, momentId]);

    if (existing) {
      await run('DELETE FROM Like WHERE id = ?', [existing.id]);
      return false; // unliked
    } else {
      await run('INSERT OR IGNORE INTO Like (userId, momentId) VALUES (?, ?)', [userId, momentId]);
      return true; // liked
    }
  }

  async createComment(userId, momentId, content) {
    return await prisma.comment.create({
      data: {
        userId,
        momentId,
        content
      },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        }
      }
    });
  }

  async getComments(momentId, limit = 50, offset = 0) {
    return await prisma.comment.findMany({
      where: { momentId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        }
      }
    });
  }

  async getMomentById(momentId, currentUserId) {
    const moment = await prisma.moment.findUnique({
      where: { id: momentId },
      include: {
        user: {
          select: { id: true, username: true, nickname: true, avatar: true }
        },
        _count: {
          select: { likes: true, comments: true }
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true }
        }
      }
    });

    return {
      ...moment,
      images: moment.images ? JSON.parse(moment.images) : [],
      isLiked: moment.likes.length > 0
    };
  }
}

module.exports = new MomentService();
