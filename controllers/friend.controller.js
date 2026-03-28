const { friends, friendRequests, users } = require('../db/crud');

class FriendController {
  async sendFriendRequest(req, res) {
    try {
      const { userId } = req.user;
      const { toUserId } = req.body;
      
      if (!toUserId) {
        return res.status(400).json({ error: 'Missing toUserId' });
      }
      
      // 检查是否已经是好友
      const existingFriendship = await friends.read({ 
        $or: [
          { userId, friendId: toUserId },
          { userId: toUserId, friendId: userId }
        ]
      });
      if (existingFriendship.length > 0) {
        return res.status(400).json({ error: 'Already friends' });
      }
      
      // 检查是否已经发送过好友请求
      const existingRequest = await friendRequests.read({ 
        fromUserId: userId, 
        toUserId 
      });
      if (existingRequest.length > 0) {
        return res.status(400).json({ error: 'Friend request already sent' });
      }
      
      // 创建好友请求
      await friendRequests.create({ 
        fromUserId, 
        toUserId, 
        status: 'pending',
        createTime: new Date().toISOString()
      });
      
      res.status(200).json({ message: 'Friend request sent' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async handleFriendRequest(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      // 获取好友请求
      const requestList = await friendRequests.read({ _id: id, toUserId: userId });
      const request = requestList[0];
      if (!request) {
        return res.status(404).json({ error: 'Friend request not found' });
      }
      
      // 更新好友请求状态
      await friendRequests.update({ _id: id }, { status });
      
      // 如果接受请求，创建好友关系
      if (status === 'accepted') {
        await friends.create({ 
          userId: request.fromUserId, 
          friendId: request.toUserId,
          status: 'active',
          createTime: new Date().toISOString()
        });
        await friends.create({ 
          userId: request.toUserId, 
          friendId: request.fromUserId,
          status: 'active',
          createTime: new Date().toISOString()
        });
      }
      
      res.status(200).json({ message: 'Friend request handled' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFriends(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取好友列表
      const friendList = await friends.read({ userId, status: 'active' });
      
      // 获取好友信息
      const friendsWithInfo = await Promise.all(
        friendList.map(async (friend) => {
          const userList = await users.read({ _id: friend.friendId });
          const user = userList[0];
          if (user) {
            delete user.password;
            return {
              ...friend,
              user
            };
          }
          return null;
        })
      );
      
      // 过滤掉null值
      const validFriends = friendsWithInfo.filter(friend => friend !== null);
      
      res.status(200).json({ friends: validFriends });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFriendRequests(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取好友请求列表
      const requestList = await friendRequests.read({ toUserId: userId, status: 'pending' });
      
      // 获取发送者信息
      const requestsWithInfo = await Promise.all(
        requestList.map(async (request) => {
          const userList = await users.read({ _id: request.fromUserId });
          const user = userList[0];
          if (user) {
            delete user.password;
            return {
              ...request,
              fromUser: user
            };
          }
          return null;
        })
      );
      
      // 过滤掉null值
      const validRequests = requestsWithInfo.filter(request => request !== null);
      
      res.status(200).json({ requests: validRequests });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteFriend(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      // 删除好友关系
      await friends.delete({ 
        $or: [
          { userId, friendId: id },
          { userId: id, friendId: userId }
        ]
      });
      
      res.status(200).json({ message: 'Friend deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateFriendInfo(req, res) {
    try {
      const { userId } = req.user;
      const { friendId } = req.params;
      const { nickname, groupName } = req.body;
      
      // 更新好友信息
      await friends.update(
        { userId, friendId },
        { nickname, groupName }
      );
      
      res.status(200).json({ message: 'Friend info updated' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getFriendGroups(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取用户的所有好友分组
      const friendList = await friends.read({ userId });
      const groups = new Set();
      
      friendList.forEach(friend => {
        if (friend.groupName) {
          groups.add(friend.groupName);
        }
      });
      
      // 添加默认分组
      groups.add('默认分组');
      
      res.status(200).json({ groups: Array.from(groups) });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new FriendController();