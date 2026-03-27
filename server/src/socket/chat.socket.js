const chatService = require('../modules/chat/chat.service');
const groupService = require('../modules/chat/group.service');

// Batching logic
const groupMessageBuffer = {}; // { groupId: [messages] }
let ioInstance = null;

const flushGroupMessages = () => {
  if (!ioInstance) return;
  
  Object.keys(groupMessageBuffer).forEach(groupId => {
    const messages = groupMessageBuffer[groupId];
    if (messages && messages.length > 0) {
      // Send as a batch event
      ioInstance.to(`group:${groupId}`).emit('batch_messages', messages);
      // Clear buffer for this group
      delete groupMessageBuffer[groupId];
    }
  });
};

// Start flush loop (1 second interval)
setInterval(flushGroupMessages, 1000);

module.exports = (io, socket) => {
  if (!ioInstance) ioInstance = io;

  // Join user's own room and group rooms
  socket.join(`user:${socket.user.id}`);
  
  // TODO: Ideally we should fetch user's groups and join them on connection
  // But for now we can rely on client to emit 'join_group' or handle it dynamically

  socket.on('join_group', async (groupId) => {
    try {
      const isMember = await groupService.isGroupMember(groupId, socket.user.id);
      if (isMember) {
        socket.join(`group:${groupId}`);
      } else {
        socket.emit('error', { message: 'Not authorized to join this group' });
      }
    } catch (err) {
      console.error('Join group error:', err);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Handle message (private or group)
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, groupId, content, type, messageId } = data;
      const senderId = socket.user.id;

      if (!receiverId && !groupId) {
        throw new Error('Receiver or Group ID required');
      }

      // 1. Authorization Check
      if (groupId) {
        const isMember = await groupService.isGroupMember(groupId, senderId);
        if (!isMember) {
          throw new Error('Not authorized to send message to this group');
        }
      }

      // 2. Save to DB
      const message = await chatService.saveMessage({
        senderId,
        receiverId: receiverId ? parseInt(receiverId) : null,
        groupId: groupId ? parseInt(groupId) : null,
        content,
        type,
        messageId: messageId ? parseInt(messageId) : null
      });

      // 3. Emit to recipient(s)
      if (groupId) {
        // Buffer group messages for batch sending
        if (!groupMessageBuffer[groupId]) {
          groupMessageBuffer[groupId] = [];
        }
        groupMessageBuffer[groupId].push(message);
      } else {
        // Private message: Instant delivery
        io.to(`user:${receiverId}`).emit('new_message', message);
      }

      // 3. Emit back to sender (confirm sent)
      socket.emit('message_sent', message);
      
    } catch (err) {
      console.error('Send message error:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { receiverId } = data;
    io.to(`user:${receiverId}`).emit('user_typing', { userId: socket.user.id });
  });

  socket.on('stop_typing', (data) => {
    const { receiverId } = data;
    io.to(`user:${receiverId}`).emit('user_stop_typing', { userId: socket.user.id });
  });

  // Handle message recall
  socket.on('recall_message', async (data) => {
    try {
      const { messageId } = data;
      const message = await chatService.recallMessage(socket.user.id, parseInt(messageId));
      
      const payload = { 
        messageId: message.id, 
        isRecalled: true, 
        content: message.content,
        groupId: message.groupId,
        senderId: message.senderId,
        receiverId: message.receiverId
      };

      if (message.groupId) {
        io.to(`group:${message.groupId}`).emit('message_recalled', payload);
      } else {
        io.to(`user:${message.receiverId}`).emit('message_recalled', payload);
        // Also emit to sender (for other devices)
        io.to(`user:${message.senderId}`).emit('message_recalled', payload);
      }
    } catch (err) {
      console.error('Recall message error:', err);
      socket.emit('error', { message: err.message || 'Failed to recall message' });
    }
  });

  // Handle message edit
  socket.on('edit_message', async (data) => {
    try {
      const { messageId, newContent } = data;
      const message = await chatService.editMessage(socket.user.id, parseInt(messageId), newContent);
      
      const payload = { 
        messageId: message.id, 
        isEdited: true, 
        content: message.content,
        groupId: message.groupId,
        senderId: message.senderId,
        receiverId: message.receiverId
      };

      if (message.groupId) {
        io.to(`group:${message.groupId}`).emit('message_edited', payload);
      } else {
        io.to(`user:${message.receiverId}`).emit('message_edited', payload);
        io.to(`user:${message.senderId}`).emit('message_edited', payload);
      }
    } catch (err) {
      console.error('Edit message error:', err);
      socket.emit('error', { message: err.message || 'Failed to edit message' });
    }
  });
};
