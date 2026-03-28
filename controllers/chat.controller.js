const { chats, chatMembers, messages, users } = require('../db/crud');
const { sendToSession } = require('../socket');

class ChatController {
  // --- 修改开始 ---
  async createChat(req, res) {
    try {
      const { userId } = req.user;
      const { type, name, avatar, memberIds } = req.body;
      
      console.log('[createChat] 开始创建聊天:', { userId, type, name, memberIds });
      
      // 参数验证
      if (!type || !['private', 'group'].includes(type)) {
        console.error('[createChat] 无效的聊天类型:', type);
        return res.status(400).json({ error: 'Invalid chat type' });
      }
      
      if (type === 'group' && !name) {
        console.error('[createChat] 群聊缺少名称');
        return res.status(400).json({ error: 'Group name is required' });
      }
      
      // 验证 memberIds
      if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
        console.error('[createChat] 无效的成员列表:', memberIds);
        return res.status(400).json({ error: 'At least one member is required' });
      }
      
      // 创建聊天会话
      const chatData = { 
        type, 
        name: type === 'private' ? '' : name, 
        avatar: type === 'private' ? '' : avatar,
        createTime: new Date().toISOString()
      };
      console.log('[createChat] 创建聊天数据:', chatData);
      
      const chat = await chats.create(chatData);
      console.log('[createChat] 聊天创建结果:', chat);
      
      // 获取聊天ID - NeDB返回的是完整文档对象
      const chatId = chat.lastID || chat._id;
      if (!chatId) {
        console.error('[createChat] 无法获取聊天ID');
        throw new Error('Failed to get chat ID');
      }
      
      // 添加成员
      const members = [userId, ...memberIds];
      console.log('[createChat] 添加成员:', members);
      
      for (const memberId of members) {
        const memberData = { 
          chatId: chatId, 
          userId: memberId,
          joinTime: new Date().toISOString()
        };
        console.log('[createChat] 添加成员数据:', memberData);
        await chatMembers.create(memberData);
      }
      
      console.log('[createChat] 聊天创建成功, chatId:', chatId);
      res.status(200).json({ chatId: chatId });
    } catch (error) {
      console.error('[createChat] 创建聊天失败:', error);
      console.error('[createChat] 错误堆栈:', error.stack);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
  // --- 修改结束 ---

  async getChats(req, res) {
    try {
      const { userId } = req.user;
      console.log('[getChats] 获取用户聊天列表, userId:', userId);
      
      // 获取用户参与的聊天会话
      const chatMemberList = await chatMembers.read({ userId });
      console.log('[getChats] 用户参与的聊天成员记录:', chatMemberList);
      
      const chatIds = chatMemberList.map(member => member.chatId);
      console.log('[getChats] 聊天ID列表:', chatIds);
      
      if (chatIds.length === 0) {
        console.log('[getChats] 用户没有聊天记录');
        return res.status(200).json({ chats: [] });
      }
      
      // 获取聊天会话信息 - NeDB不支持$in，需要逐个查询
      const chatList = [];
      for (const chatId of chatIds) {
        const chatDocs = await chats.read({ _id: chatId });
        if (chatDocs && chatDocs.length > 0) {
          chatList.push(chatDocs[0]);
        }
      }
      console.log('[getChats] 聊天列表:', chatList);
      
      // 获取每个聊天的最后一条消息
      const chatsWithLastMessage = await Promise.all(
        chatList.map(async (chat) => {
          try {
            const messagesList = await messages.read({ chatId: chat._id });
            const lastMessage = messagesList && messagesList.length > 0 
              ? messagesList.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))[0]
              : null;
            
            // 如果是私聊，获取对方用户信息
            let chatInfo = { ...chat, id: chat._id };
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
                    id: chat._id,
                    name: otherUser.nickname || otherUser.username,
                    avatar: otherUser.avatar,
                    otherUser: {
                      id: otherUser._id,
                      ...otherUser
                    }
                  };
                }
              }
            }
            
            return {
              ...chatInfo,
              lastMessage
            };
          } catch (error) {
            console.error('[getChats] 处理聊天失败:', chat._id, error);
            return {
              ...chat,
              id: chat._id,
              lastMessage: null
            };
          }
        })
      );
      
      console.log('[getChats] 返回聊天列表数量:', chatsWithLastMessage.length);
      res.status(200).json({ chats: chatsWithLastMessage });
    } catch (error) {
      console.error('[getChats] 获取聊天列表失败:', error);
      console.error('[getChats] 错误堆栈:', error.stack);
      res.status(500).json({ error: 'Internal server error', message: error.message });
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
          const msgWithId = {
            ...message,
            id: message._id
          };
          if (user) {
            return {
              ...msgWithId,
              sender: {
                id: user._id,
                nickname: user.nickname,
                username: user.username,
                avatar: user.avatar
              }
            };
          }
          return msgWithId;
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
      
      console.log('[sendMessage] 发送消息:', { chatId: id, userId, content });
      
      if (!content) {
        return res.status(400).json({ error: 'Message content is required' });
      }
      
      // 检查用户是否是聊天成员
      const memberList = await chatMembers.read({ chatId: id, userId });
      if (memberList.length === 0) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      // 创建消息
      const messageData = { 
        chatId: id, 
        userId, 
        content, 
        type,
        createTime: new Date().toISOString()
      };
      
      const message = await messages.create(messageData);
      console.log('[sendMessage] 消息创建成功:', message);
      
      // 获取完整的消息对象（NeDB返回的是插入后的文档）
      let completeMessage = message;
      // 如果返回的是lastID，需要重新查询
      if (message.lastID) {
        const messageList = await messages.read({ _id: message.lastID });
        completeMessage = messageList[0];
      }
      
      // 获取发送者信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      const messageWithSender = {
        ...completeMessage,
        id: completeMessage._id,
        sender: {
          id: user._id,
          nickname: user.nickname,
          username: user.username,
          avatar: user.avatar
        }
      };
      
      console.log('[sendMessage] 通过Socket推送消息:', messageWithSender);
      
      // 通过Socket.IO推送消息给会话中的所有成员
      try {
        sendToSession(id, 'newMessage', messageWithSender);
      } catch (socketErr) {
        console.warn('[sendMessage] Socket推送失败:', socketErr.message);
      }
      
      res.status(200).json({ message: messageWithSender });
    } catch (error) {
      console.error('[sendMessage] 错误:', error);
      console.error('[sendMessage] 错误堆栈:', error.stack);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  // --- 修改开始 ---
  // 获取所有已注册用户（开放性IM功能）
  async getAllUsers(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取所有用户
      const allUsers = await users.read({});
      
      // 确保返回数组
      const usersList = Array.isArray(allUsers) ? allUsers : [];
      
      // 过滤掉当前用户，并移除敏感字段
      const otherUsers = usersList
        .filter(user => user._id !== userId)
        .map(user => {
          const { password, ...safeUser } = user;
          return {
            id: safeUser._id,
            username: safeUser.username || '',
            nickname: safeUser.nickname || safeUser.username || '',
            email: safeUser.email || '',
            avatar: safeUser.avatar || '',
            signature: safeUser.signature || '',
            points: safeUser.points || 0
          };
        });
      
      res.status(200).json({ users: otherUsers });
    } catch (error) {
      console.error('[getAllUsers] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // --- 修改结束 ---
}

module.exports = new ChatController();