const prisma = require('../../core/prisma');

class CommunityService {
  async createPost(userId, { title, content, category }) {
    return await prisma.post.create({
      data: {
        userId,
        title,
        content,
        category
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true, isVip: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });
  }

  async getPosts({ category, limit = 20, offset = 0, userId }) {
    const where = {};
    if (category && category !== 'all') where.category = category;
    if (userId) where.userId = userId;

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, username: true, avatar: true, isVip: true }
        },
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    return posts;
  }

  async getPostById(postId) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(postId) }
      });
      
      if (!post) {
        return null;
      }
      
      // 单独获取评论
      const comments = await prisma.postComment.findMany({
        where: { postId: parseInt(postId) },
        include: {
          user: {
            select: { id: true, username: true, avatar: true, isVip: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      
      console.log('Comments found:', comments);
      
      // 构建完整的帖子对象
      const postWithComments = {
        ...post,
        user: await prisma.user.findUnique({
          where: { id: post.userId },
          select: { id: true, username: true, avatar: true, isVip: true }
        }),
        comments: comments || [],
        _count: {
          likes: 0,
          comments: comments.length
        }
      };
      
      console.log('Post with comments:', postWithComments);
      
      return postWithComments;
    } catch (error) {
      console.error('Error in getPostById:', error);
      throw error;
    }
  }

  async createComment(userId, { postId, content, parentId }) {
    // 先创建评论
    const comment = await prisma.postComment.create({
      data: {
        userId,
        postId: parseInt(postId),
        content,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        user: {
          select: { id: true, username: true, avatar: true, isVip: true }
        }
      }
    });
    
    // 然后获取帖子的评论列表，确保评论已经被正确添加
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) },
      include: {
        comments: {
          include: {
            user: { select: { id: true, username: true, avatar: true, isVip: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    
    console.log('Comments after creation:', post.comments);
    
    return comment;
  }

  async toggleLike(userId, postId) {
    const existing = await prisma.postLike.findUnique({
      where: {
        userId_postId: { userId, postId: parseInt(postId) }
      }
    });

    if (existing) {
      await prisma.postLike.delete({
        where: { id: existing.id }
      });
      return false; // unliked
    } else {
      await prisma.postLike.create({
        data: { userId, postId: parseInt(postId) }
      });
      return true; // liked
    }
  }
}

module.exports = new CommunityService();