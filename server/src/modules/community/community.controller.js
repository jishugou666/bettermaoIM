const communityService = require('./community.service');

class CommunityController {
  async getPosts(req, res, next) {
    try {
      const { category, limit, offset, userId } = req.query;
      const posts = await communityService.getPosts({
        category,
        limit: limit ? parseInt(limit) : 20,
        offset: offset ? parseInt(offset) : 0,
        userId: userId ? parseInt(userId) : undefined
      });
      res.json(posts);
    } catch (error) {
      next(error);
    }
  }

  async createPost(req, res, next) {
    try {
      const { title, content, category } = req.body;
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content required' });
      }
      const post = await communityService.createPost(req.user.id, { title, content, category });
      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  async getPostById(req, res, next) {
    try {
      const post = await communityService.getPostById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (error) {
      next(error);
    }
  }

  async createComment(req, res, next) {
    try {
      const { content, parentId } = req.body;
      const postId = req.params.id;
      if (!content) return res.status(400).json({ message: 'Content required' });
      
      const comment = await communityService.createComment(req.user.id, { postId, content, parentId });
      res.json(comment);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const isLiked = await communityService.toggleLike(req.user.id, req.params.id);
      res.json({ isLiked });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CommunityController();