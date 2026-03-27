const friendService = require('./friend.service');

class FriendController {
  async sendRequest(req, res, next) {
    try {
      const { friendId } = req.body;
      const result = await friendService.sendRequest(req.user.id, parseInt(friendId));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async acceptRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await friendService.acceptRequest(parseInt(id), req.user.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async rejectRequest(req, res, next) {
    try {
      const { id } = req.params;
      const result = await friendService.rejectRequest(parseInt(id), req.user.id);
      res.json({ message: 'Rejected' });
    } catch (error) {
      next(error);
    }
  }

  async getFriends(req, res, next) {
    try {
      const friends = await friendService.getFriends(req.user.id);
      res.json(friends);
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const requests = await friendService.getPendingRequests(req.user.id);
      res.json(requests);
    } catch (error) {
      next(error);
    }
  }

  async searchUsers(req, res, next) {
    try {
      const { q } = req.query;
      if (!q) return res.json([]);
      const users = await friendService.searchUsers(q, req.user.id);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async blockUser(req, res, next) {
    try {
      const { id } = req.params;
      await friendService.blockUser(req.user.id, parseInt(id));
      res.json({ success: true, message: 'User blocked' });
    } catch (error) {
      next(error);
    }
  }

  async unblockUser(req, res, next) {
    try {
      const { id } = req.params;
      await friendService.unblockUser(req.user.id, parseInt(id));
      res.json({ success: true, message: 'User unblocked' });
    } catch (error) {
      next(error);
    }
  }

  async getBlockedUsers(req, res, next) {
    try {
      const users = await friendService.getBlockedUsers(req.user.id);
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async updateFriendInfo(req, res, next) {
    try {
      const { friendId } = req.params;
      const { nickname, groupName } = req.body;
      await friendService.updateFriendInfo(req.user.id, parseInt(friendId), { nickname, groupName });
      res.json({ success: true, message: 'Friend info updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async getFriendGroups(req, res, next) {
    try {
      const groups = await friendService.getFriendGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();
