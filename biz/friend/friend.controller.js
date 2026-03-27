const friendService = require('./friend.service');

class FriendController {
  async getFriends(req, res, next) {
    try {
      const { userId } = req.user;
      const friends = await friendService.getFriends(userId);
      res.status(200).json({ friends });
    } catch (error) {
      next(error);
    }
  }

  async sendFriendRequest(req, res, next) {
    try {
      const { userId } = req.user;
      const { targetUserId } = req.body;
      
      if (!targetUserId) {
        return res.status(400).json({ error: 'Target user ID is required' });
      }

      await friendService.sendFriendRequest(userId, targetUserId);
      res.status(200).json({ message: 'Friend request sent successfully' });
    } catch (error) {
      next(error);
    }
  }

  async acceptFriendRequest(req, res, next) {
    try {
      const { userId } = req.user;
      const { requestId } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ error: 'Request ID is required' });
      }

      await friendService.acceptFriendRequest(requestId, userId);
      res.status(200).json({ message: 'Friend request accepted successfully' });
    } catch (error) {
      next(error);
    }
  }

  async rejectFriendRequest(req, res, next) {
    try {
      const { userId } = req.user;
      const { requestId } = req.body;
      
      if (!requestId) {
        return res.status(400).json({ error: 'Request ID is required' });
      }

      await friendService.rejectFriendRequest(requestId, userId);
      res.status(200).json({ message: 'Friend request rejected successfully' });
    } catch (error) {
      next(error);
    }
  }

  async removeFriend(req, res, next) {
    try {
      const { userId } = req.user;
      const { friendId } = req.params;
      
      await friendService.removeFriend(userId, friendId);
      res.status(200).json({ message: 'Friend removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getFriendRequests(req, res, next) {
    try {
      const { userId } = req.user;
      const requests = await friendService.getFriendRequests(userId);
      res.status(200).json({ requests });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();