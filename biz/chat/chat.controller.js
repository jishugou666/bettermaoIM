const chatService = require('./chat.service');

class ChatController {
  async getSessions(req, res, next) {
    try {
      const { userId } = req.user;
      const sessions = await chatService.getSessions(userId);
      res.status(200).json({ sessions });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId, limit = 50, offset = 0 } = req.query;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const messages = await chatService.getMessages(sessionId, userId, parseInt(limit), parseInt(offset));
      res.status(200).json({ messages });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId, content, type = 'text' } = req.body;
      
      if (!sessionId || !content) {
        return res.status(400).json({ error: 'Session ID and content are required' });
      }

      const message = await chatService.sendMessage(sessionId, userId, content, type);
      res.status(201).json({ message });
    } catch (error) {
      next(error);
    }
  }

  async createSession(req, res, next) {
    try {
      const { userId } = req.user;
      const { type, name, memberIds } = req.body;
      
      if (!type || !memberIds || !Array.isArray(memberIds)) {
        return res.status(400).json({ error: 'Type and member IDs are required' });
      }

      const session = await chatService.createSession(type, name, [...memberIds, userId]);
      res.status(201).json({ session });
    } catch (error) {
      next(error);
    }
  }

  async updateSession(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const session = await chatService.updateSession(sessionId, userId, { name });
      res.status(200).json({ session });
    } catch (error) {
      next(error);
    }
  }

  async deleteSession(req, res, next) {
    try {
      const { userId } = req.user;
      const { sessionId } = req.params;
      
      await chatService.deleteSession(sessionId, userId);
      res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();