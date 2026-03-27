const prisma = require('../../core/prisma');
const redisClient = require('../../core/redis');

class ChatService {
  async saveMessage({ senderId, receiverId, groupId, content, type = 'text', messageId }) {
    try {
      // 幂等处理：如果提供了messageId，检查是否已经存在
      if (messageId) {
        const existingMessage = await prisma.message.findFirst({
          where: {
            id: messageId
          }
        });
        if (existingMessage) {
          return existingMessage; // 返回已存在的消息，避免重复
        }
      }

      const message = await prisma.message.create({
        data: {
          id: messageId, // 使用前端提供的messageId
          senderId,
          receiverId, // Nullable
          groupId,    // Nullable
          content,
          type
        },
        include: {
          sender: {
            select: { id: true, username: true, avatar: true }
          }
        }
      });

      try {
        // Increment unread counts in Redis
        if (groupId) {
          // Get all group members except sender
          const members = await prisma.groupMember.findMany({
            where: {
              groupId,
              userId: { not: senderId }
            },
            select: { userId: true }
          });
          
          // Use pipeline for efficiency
          const pipeline = redisClient.multi();
          members.forEach(m => {
            pipeline.incr(`unread:u:${m.userId}:g:${groupId}`);
          });
          await pipeline.exec();

        } else if (receiverId) {
          await redisClient.incr(`unread:u:${receiverId}:s:${senderId}`);
        }
      } catch (err) {
        console.error('Redis error incrementing unread:', err);
      }

      return message;
    } catch (err) {
      console.error('Error saving message:', err);
      throw err;
    }
  }

  async markAsRead(userId, targetId, type) {
    if (type === 'group') {
      await redisClient.del(`unread:u:${userId}:g:${targetId}`);
      // Group messages read status not stored in DB for now (M2 scope)
    } else {
      await redisClient.del(`unread:u:${userId}:s:${targetId}`);
      // Update DB for P2P messages
      await prisma.message.updateMany({
        where: {
          receiverId: userId,
          senderId: targetId,
          isRead: false
        },
        data: { isRead: true }
      });
    }
    return true;
  }

  async getUnreadCounts(userId) {
    const unread = {
      user: {},
      group: {}
    };

    // Scan for P2P unread
    const p2pKeys = await redisClient.keys(`unread:u:${userId}:s:*`);
    for (const key of p2pKeys) {
      const parts = key.split(':');
      const senderId = parseInt(parts[4]); // unread:u:userId:s:senderId
      const count = await redisClient.get(key);
      if (count) unread.user[senderId] = parseInt(count);
    }

    // Scan for Group unread
    const groupKeys = await redisClient.keys(`unread:u:${userId}:g:*`);
    for (const key of groupKeys) {
      const parts = key.split(':');
      const groupId = parseInt(parts[4]); // unread:u:userId:g:groupId
      const count = await redisClient.get(key);
      if (count) unread.group[groupId] = parseInt(count);
    }

    return unread;
  }

  async getHistory(userId, otherUserId, limit = 50, offset = 0) {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });
  }
  
  async getConversations(userId) {
    // 1. Find all unique users interacted with
    const sentTo = await prisma.message.findMany({
      where: { senderId: userId, receiverId: { not: null } },
      distinct: ['receiverId'],
      select: { receiverId: true }
    });

    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: userId },
      distinct: ['senderId'],
      select: { senderId: true }
    });

    const contactIds = new Set([
      ...sentTo.map(m => m.receiverId),
      ...receivedFrom.map(m => m.senderId)
    ]);

    // 2. Fetch user details and last message for each contact
    const conversations = await Promise.all(Array.from(contactIds).map(async (contactId) => {
      const contact = await prisma.user.findUnique({
        where: { id: contactId },
        select: { id: true, username: true, avatar: true }
      });

      if (!contact) return null;

      const lastMsg = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: contactId },
            { senderId: contactId, receiverId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        ...contact,
        lastMessage: lastMsg
      };
    }));

    return conversations
      .filter(c => c !== null)
      .sort((a, b) => {
        const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }
  async getGroupHistory(groupId, limit = 50, offset = 0) {
    return await prisma.message.findMany({
      where: {
        groupId: groupId
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });
  }

  async recallMessage(userId, messageId) {
    // 1. Find message and verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: { select: { id: true } }
      }
    });

    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error('Not authorized to recall this message');

    // 2. Check time limit (e.g. 10 minutes)
    const now = new Date();
    const createdAt = new Date(message.createdAt);
    const diffMinutes = (now - createdAt) / 1000 / 60;
    if (diffMinutes > 10) throw new Error('Cannot recall message older than 10 minutes');

    // 3. Update message
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        isRecalled: true,
        content: 'This message has been recalled' // Optional: clear content
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      }
    });
  }

  async editMessage(userId, messageId, newContent) {
    // 1. Find message and verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) throw new Error('Not authorized to edit this message');
    if (message.isRecalled) throw new Error('Cannot edit recalled message');

    // 2. Check time limit (e.g. 5 minutes)
    const now = new Date();
    const createdAt = new Date(message.createdAt);
    const diffMinutes = (now - createdAt) / 1000 / 60;
    if (diffMinutes > 5) throw new Error('Cannot edit message older than 5 minutes');

    // 3. Update message
    return await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true
      },
      include: {
        sender: { select: { id: true, username: true, avatar: true } }
      }
    });
  }
}

module.exports = new ChatService();
