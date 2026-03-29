const { chats, chatMembers, messages, users } = require('../db/crud');
const { sendToSession } = require('../socket');

class ChatController {
  // --- 修改开始 ---
  async createChat(req, res) {
    try {
      const { userId } = req.user;
      const { type, name, avatar, memberIds, description } = req.body;
      
      console.log('[createChat] 开始创建聊天:', { userId, type, name, memberIds, description });
      
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
      
      // --- 关键修复：如果是私聊，先检查是否已存在相同两个用户的会话 ---
      if (type === 'private' && memberIds.length === 1) {
        const otherUserId = memberIds[0];
        console.log('[createChat] 检查是否已存在私聊会话:', userId, otherUserId);
        
        // 获取当前用户的所有私聊会话
        const userChatMembers = await chatMembers.read({ userId });
        const userChatIds = userChatMembers.map(m => m.chatId);
        
        // 遍历检查每个聊天会话
        for (const chatId of userChatIds) {
          const chatList = await chats.read({ _id: chatId, type: 'private' });
          if (chatList.length === 0) continue;
          
          // 检查这个私聊会话的另一个成员是不是目标用户
          const otherMembers = await chatMembers.read({ chatId, userId: { $ne: userId } });
          if (otherMembers.length === 1 && otherMembers[0].userId === otherUserId) {
            console.log('[createChat] 找到已存在的私聊会话:', chatId);
            return res.status(200).json({ chatId: chatId, existed: true });
          }
        }
        console.log('[createChat] 未找到已存在的私聊会话，创建新的');
      }
      
      // 创建聊天会话
      const chatData = { 
        type, 
        name: type === 'private' ? '' : name, 
        avatar: type === 'private' ? '' : avatar,
        description: type === 'group' ? (description || '') : '',
        creatorId: type === 'group' ? userId : null,
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
      
      for (let i = 0; i < members.length; i++) {
        const memberId = members[i];
        const memberData = { 
          chatId: chatId, 
          userId: memberId,
          role: type === 'group' && i === 0 ? 'ADMIN' : 'MEMBER',
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
            } else if (chat.type === 'group') {
              // 如果是群聊，获取群成员数量
              const membersList = await chatMembers.read({ chatId: chat._id });
              chatInfo = {
                ...chat,
                id: chat._id,
                memberCount: membersList.length
              };
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
      
      console.log('[getMessages] 获取消息记录, chatId:', id, 'userId:', userId);
      
      // 检查用户是否是聊天成员
      const memberList = await chatMembers.read({ chatId: id, userId });
      if (memberList.length === 0) {
        console.warn('[getMessages] 用户不是聊天成员:', userId, id);
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      // 获取消息记录 - 先查询再排序确保兼容性
      let messagesList = await messages.read({ chatId: id });
      
      console.log('[getMessages] 原始消息列表:', JSON.stringify(messagesList, null, 2));
      
      // 确保按时间升序排序（从旧到新）
      messagesList = messagesList.sort((a, b) => {
        const timeA = new Date(a.createTime || a.createdAt || a.created_at).getTime();
        const timeB = new Date(b.createTime || b.createdAt || b.created_at).getTime();
        return timeA - timeB;
      });
      
      console.log('[getMessages] 找到消息数量:', messagesList.length);
      
      // 获取消息发送者信息
      const messagesWithSender = await Promise.all(
        messagesList.map(async (message) => {
          try {
            const userList = await users.read({ _id: message.userId });
            const user = userList && userList.length > 0 ? userList[0] : null;
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
          } catch (err) {
            console.warn('[getMessages] 获取发送者信息失败:', message.userId, err);
            return {
              ...message,
              id: message._id
            };
          }
        })
      );
      
      res.status(200).json({ messages: messagesWithSender });
    } catch (error) {
      console.error('[getMessages] 获取消息失败:', error);
      console.error('[getMessages] 错误堆栈:', error.stack);
      res.status(500).json({ error: 'Internal server error', message: error.message });
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

  // 获取群聊详情
  async getGroupDetails(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      console.log('[getGroupDetails] 获取群聊详情, chatId:', id, 'userId:', userId);
      
      // 检查用户是否是聊天成员
      const memberList = await chatMembers.read({ chatId: id, userId });
      if (memberList.length === 0) {
        console.warn('[getGroupDetails] 用户不是聊天成员:', userId, id);
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      // 获取聊天信息
      const chatDocs = await chats.read({ _id: id });
      if (!chatDocs || chatDocs.length === 0) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      const chat = chatDocs[0];
      
      // 获取所有成员信息
      const allMembers = await chatMembers.read({ chatId: id });
      const memberDetails = await Promise.all(
        allMembers.map(async (member) => {
          const userList = await users.read({ _id: member.userId });
          const user = userList && userList.length > 0 ? userList[0] : null;
          if (user) {
            const { password, ...safeUser } = user;
            return {
              id: safeUser._id,
              username: safeUser.username || '',
              nickname: safeUser.nickname || safeUser.username || '',
              avatar: safeUser.avatar || '',
              role: member.role || 'MEMBER',
              joinTime: member.joinTime
            };
          }
          return null;
        })
      );
      
      // 过滤掉 null 成员
      const validMembers = memberDetails.filter(m => m !== null);
      
      // 确定群主（创建者）
      const creatorId = chat.creatorId || validMembers[0]?.id;
      
      res.status(200).json({
        group: {
          id: chat._id,
          name: chat.name,
          description: chat.description || '',
          avatar: chat.avatar || '',
          createTime: chat.createTime,
          creatorId: creatorId,
          members: validMembers
        }
      });
    } catch (error) {
      console.error('[getGroupDetails] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // 设置成员角色
  async setMemberRole(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { targetUserId, role } = req.body;
      
      console.log('[setMemberRole] 设置成员角色, chatId:', id, 'userId:', userId, 'targetUserId:', targetUserId, 'role:', role);
      
      // 验证 role 值
      if (!['MEMBER', 'ADMIN'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      
      // 获取聊天信息
      const chatDocs = await chats.read({ _id: id });
      if (!chatDocs || chatDocs.length === 0) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      const chat = chatDocs[0];
      
      // 获取当前用户的成员信息
      const currentMemberList = await chatMembers.read({ chatId: id, userId });
      if (currentMemberList.length === 0) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      const currentMember = currentMemberList[0];
      
      // 只有群主（creatorId）可以设置管理员
      if (chat.creatorId && chat.creatorId !== userId) {
        return res.status(403).json({ error: 'Only group creator can set admin' });
      }
      
      // 获取目标成员信息
      const targetMemberList = await chatMembers.read({ chatId: id, userId: targetUserId });
      if (targetMemberList.length === 0) {
        return res.status(404).json({ error: 'Target member not found' });
      }
      
      // 更新角色
      await chatMembers.update(
        { chatId: id, userId: targetUserId },
        { role }
      );
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[setMemberRole] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // 删除成员
  async removeMember(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { targetUserId } = req.body;
      
      console.log('[removeMember] 删除成员, chatId:', id, 'userId:', userId, 'targetUserId:', targetUserId);
      
      // 获取聊天信息
      const chatDocs = await chats.read({ _id: id });
      if (!chatDocs || chatDocs.length === 0) {
        return res.status(404).json({ error: 'Chat not found' });
      }
      
      const chat = chatDocs[0];
      
      // 获取当前用户的成员信息
      const currentMemberList = await chatMembers.read({ chatId: id, userId });
      if (currentMemberList.length === 0) {
        return res.status(403).json({ error: 'Not a member of this chat' });
      }
      
      const currentMember = currentMemberList[0];
      const currentRole = currentMember.role || 'MEMBER';
      
      // 获取目标成员信息
      const targetMemberList = await chatMembers.read({ chatId: id, userId: targetUserId });
      if (targetMemberList.length === 0) {
        return res.status(404).json({ error: 'Target member not found' });
      }
      
      const targetMember = targetMemberList[0];
      const targetRole = targetMember.role || 'MEMBER';
      
      // 权限检查
      const isCreator = chat.creatorId && chat.creatorId === userId;
      const isAdmin = currentRole === 'ADMIN';
      const isTargetAdmin = targetRole === 'ADMIN';
      const isTargetCreator = chat.creatorId && chat.creatorId === targetUserId;
      
      // 群主可以删除任何人
      // 管理员可以删除普通成员，但不能删除群主和其他管理员
      if (!isCreator) {
        if (!isAdmin) {
          return res.status(403).json({ error: 'Only admins can remove members' });
        }
        if (isTargetCreator || isTargetAdmin) {
          return res.status(403).json({ error: 'Cannot remove creator or other admins' });
        }
      }
      
      // 删除成员
      await chatMembers.delete({ chatId: id, userId: targetUserId });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[removeMember] Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  // --- 修改结束 ---
}

module.exports = new ChatController();