const { chats, chatMembers, messages, users } = require('../db/crud');

class ChatController {
  async createChat(req, res) {
    try {
      const { userId } = req.user;
      const { type, name, avatar, memberIds } = req.body;
      
      if (!type || !['private', 'group'].includes(type)) {
        return res.status(400).json({ error: 'Invalid chat type' });
      }
      
      if (type === 'group' && !name) {
        return res.status(400).json({ error: 'Group name is required' });
      }
      
      // 创建聊天会话
      const chat = await chats.create({ 
        type, 
        name: type === 'private' ? '' : name, 
        avatar: type === 'private' ? '' : avatar,
        createTime: new Date().toISOString()
      });
      
      // 添加成员
      const members = type === 'private' ? [userId, ...memberIds] : [userId, ...memberIds];
      for (const memberId of members) {
        await chatMembers.create({ 
          chatId: chat.lastID, 
          userId: memberId,
          joinTime: new Date().toISOString()
        });
      }
      
      res.status(200).json({ chatId: chat.lastID });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getChats(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取用户参与的聊天会话
      const chatMemberList = await chatMembers.read({ userId });
      const chatIds = chatMemberList.map(member => member.chatId);
      
      if (chatIds.length === 0) {
        return res.status(200).json({ chats: [] });
      }
      
      // 获取聊天会话信息
      const chatList = await chats.read({ _id: { $in: chatIds } });
      
      // 获取每个聊天的最后一条消息
      const chatsWithLastMessage = await Promise.all(
        chatList.map(async (chat) => {
          const messagesList = await messages.read({ chatId: chat._id }, { sort: { createTime: -1 }, limit: 1 });
          const lastMessage = messagesList[0];
          
          // 如果是私聊，获取对方用户信息
          let chatInfo = { ...chat };
          if (chat.type === 'private') {
            const membersList = await chatMembers.read({ chatId: chat._id });
            const otherMemberId = membersList.find(member => member.userId !== userId)?.userId;
            if (otherMemberId) {
              const userList = await users.read({ _id: otherMemberId });
              const otherUser = userList[0];
              if (otherUser) {
                delete otherUser.password;
                chatInfo = {
                  ...chat,
                  name: otherUser.nickname,
                  avatar: otherUser.avatar,
                  otherUser
                };
              }
            }
          }
          
          return {
            ...chatInfo,
            lastMessage
          };
        })
      );
      
      res.status(200).json({ chats: chatsWithLastMessage });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMessages(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      // 检查用户是否是聊天成员
      const memberList = await chatMembers.read({ chatId: id, userId });
      if (memberList.length === 0) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      // 获取消息记录
      const messagesList = await messages.read({ chatId: id }, { sort: { createTime: 1 } });
      
      // 获取消息发送者信息
      const messagesWithSender = await Promise.all(
        messagesList.map(async (message) => {
          const userList = await users.read({ _id: message.userId });
          const user = userList[0];
          if (user) {
            return {
              ...message,
              sender: {
                id: user._id,
                nickname: user.nickname,
                avatar: user.avatar
              }
            };
          }
          return message;
        })
      );
      
      res.status(200).json({ messages: messagesWithSender });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async sendMessage(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { content, type = 'text' } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }
      
      // 检查用户是否是聊天成员
      const memberList = await chatMembers.read({ chatId: id, userId });
      if (memberList.length === 0) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      // 创建消息
      const message = await messages.create({ 
        chatId: id, 
        userId, 
        content, 
        type,
        createTime: new Date().toISOString()
      });
      
      // 获取发送者信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      const messageWithSender = {
        ...message,
        sender: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar
        }
      };
      
      res.status(200).json({ message: messageWithSender });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new ChatController();