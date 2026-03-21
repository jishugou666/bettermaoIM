const chatService = require('./chat.service');

class ChatController {
  async getHistory(req, res, next) {
    try {
      const { otherUserId, groupId } = req.params; // We might need to change route param or use query
      // Route is /history/:otherUserId, so it assumes P2P.
      // We should add a new route for group history or handle logic here.
      // Let's add getGroupHistory method.
      
      const { limit, offset } = req.query;
      const history = await chatService.getHistory(
        req.user.id,
        parseInt(otherUserId),
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );
      res.json(history.reverse());
    } catch (error) {
      next(error);
    }
  }

  async getGroupHistory(req, res, next) {
    try {
      const { groupId } = req.params;
      const { limit, offset } = req.query;
      const history = await chatService.getGroupHistory(
        parseInt(groupId),
        limit ? parseInt(limit) : undefined,
        offset ? parseInt(offset) : undefined
      );
      res.json(history.reverse());
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req, res, next) {
    try {
      const conversations = await chatService.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const { targetId, type } = req.body;
      if (!targetId || !type) {
        return res.status(400).json({ message: 'Target ID and type required' });
      }
      await chatService.markAsRead(req.user.id, parseInt(targetId), type);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getUnread(req, res, next) {
    try {
      const counts = await chatService.getUnreadCounts(req.user.id);
      res.json(counts);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
