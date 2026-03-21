const momentService = require('./moment.service');
const creditService = require('../credit/credit.service');

class MomentController {
  async createMoment(req, res, next) {
    try {
      const { content, images } = req.body;
      if (!content && (!images || images.length === 0)) return res.status(400).json({ message: 'Content or images required' });
      
      const moment = await momentService.createMoment(req.user.id, { content, images });
      
      // Award credit for first post
      await creditService.checkAndCompleteTask(req.user.id, 'first_moment');
      
      res.status(201).json(moment);
    } catch (error) {
      next(error);
    }
  }

  async getFeed(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const feed = await momentService.getFeed(
        req.user.id,
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );
      res.json(feed);
    } catch (error) {
      next(error);
    }
  }

  async toggleLike(req, res, next) {
    try {
      const { id } = req.params;
      const isLiked = await momentService.toggleLike(req.user.id, parseInt(id));
      
      if (isLiked) {
        // Award credit for first like
        await creditService.checkAndCompleteTask(req.user.id, 'first_like');
      }

      res.json({ isLiked });
    } catch (error) {
      next(error);
    }
  }

  async createComment(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: 'Content required' });

      const comment = await momentService.createComment(req.user.id, parseInt(id), content);
      
      // Award credit for first comment
      await creditService.checkAndCompleteTask(req.user.id, 'first_comment');

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  async getComments(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, offset } = req.query;
      const comments = await momentService.getComments(
        parseInt(id),
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MomentController();
