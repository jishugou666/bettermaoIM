const { users } = require('../../db/crud');
const db = require('../../db');

class FriendService {
  async getFriends(userId) {
    try {
      // 获取好友列表
      const friends = await db.query(`
        SELECT u.* FROM users u
        INNER JOIN friends f ON (f.user_id = ? AND f.friend_id = u.id) OR (f.friend_id = ? AND f.user_id = u.id)
        WHERE u.id != ?
      `, [userId, userId, userId]);

      // 移除密码字段
      return friends.map(friend => {
        delete friend.password;
        return friend;
      });
    } catch (error) {
      throw new Error(`Get friends failed: ${error.message}`);
    }
  }

  async sendFriendRequest(userId, targetUserId) {
    try {
      // 验证目标用户是否存在
      const targetUser = await users.getById(targetUserId);
      if (!targetUser) {
        throw new Error('Target user not found');
      }

      // 验证是否已经是好友
      const existingFriendship = await db.query(`
        SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [userId, targetUserId, targetUserId, userId]);

      if (existingFriendship.length > 0) {
        throw new Error('Already friends');
      }

      // 验证是否已经发送过请求
      const existingRequest = await db.query(`
        SELECT * FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending'
      `, [userId, targetUserId]);

      if (existingRequest.length > 0) {
        throw new Error('Friend request already sent');
      }

      // 创建好友请求
      await db.execute(`
        INSERT INTO friend_requests (sender_id, receiver_id, status, created_at)
        VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
      `, [userId, targetUserId]);
    } catch (error) {
      throw new Error(`Send friend request failed: ${error.message}`);
    }
  }

  async acceptFriendRequest(requestId, userId) {
    try {
      // 验证请求是否存在且属于当前用户
      const request = await db.get(`
        SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'
      `, [requestId, userId]);

      if (!request) {
        throw new Error('Friend request not found');
      }

      // 开始事务
      await db.execute('BEGIN TRANSACTION');

      try {
        // 更新请求状态为已接受
        await db.execute(`
          UPDATE friend_requests SET status = 'accepted' WHERE id = ?
        `, [requestId]);

        // 创建好友关系
        await db.execute(`
          INSERT INTO friends (user_id, friend_id, created_at)
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `, [request.sender_id, userId]);

        await db.execute('COMMIT');
      } catch (error) {
        await db.execute('ROLLBACK');
        throw error;
      }
    } catch (error) {
      throw new Error(`Accept friend request failed: ${error.message}`);
    }
  }

  async rejectFriendRequest(requestId, userId) {
    try {
      // 验证请求是否存在且属于当前用户
      const request = await db.get(`
        SELECT * FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'
      `, [requestId, userId]);

      if (!request) {
        throw new Error('Friend request not found');
      }

      // 更新请求状态为已拒绝
      await db.execute(`
        UPDATE friend_requests SET status = 'rejected' WHERE id = ?
      `, [requestId]);
    } catch (error) {
      throw new Error(`Reject friend request failed: ${error.message}`);
    }
  }

  async removeFriend(userId, friendId) {
    try {
      // 验证好友关系是否存在
      const friendship = await db.query(`
        SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [userId, friendId, friendId, userId]);

      if (friendship.length === 0) {
        throw new Error('Friendship not found');
      }

      // 删除好友关系
      await db.execute(`
        DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
      `, [userId, friendId, friendId, userId]);
    } catch (error) {
      throw new Error(`Remove friend failed: ${error.message}`);
    }
  }

  async getFriendRequests(userId) {
    try {
      // 获取好友请求列表
      const requests = await db.query(`
        SELECT fr.*, u.username, u.nickname, u.avatar FROM friend_requests fr
        INNER JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = 'pending'
        ORDER BY fr.created_at DESC
      `, [userId]);

      return requests;
    } catch (error) {
      throw new Error(`Get friend requests failed: ${error.message}`);
    }
  }
}

module.exports = new FriendService();