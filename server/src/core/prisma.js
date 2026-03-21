const { query, get, run } = require('./database');

// 模拟Prisma客户端
const prisma = {
  // User方法
  user: {
    findFirst: async (params) => {
      const { where } = params;
      if (where.OR) {
        for (const condition of where.OR) {
          if (condition.email) {
            const user = await get('SELECT * FROM User WHERE email = ?', [condition.email]);
            if (user) return user;
          }
          if (condition.username) {
            const user = await get('SELECT * FROM User WHERE username = ?', [condition.username]);
            if (user) return user;
          }
        }
      }
      return null;
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.id) {
        const userId = typeof where.id === 'string' ? parseInt(where.id) : where.id;
        return await get('SELECT * FROM User WHERE id = ?', [userId]);
      }
      if (where.email) {
        return await get('SELECT * FROM User WHERE email = ?', [where.email]);
      }
      return null;
    },
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO User (email, username, password, nickname, avatar, bio, role, isVip, gender, location, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.email, data.username, data.password, data.nickname || data.username, data.avatar, data.bio, data.role || 'USER', data.isVip || 0, data.gender, data.location, data.tags]
      );
      return await get('SELECT * FROM User WHERE id = ?', [result.lastID]);
    },
    update: async (params) => {
      const { where, data, select } = params;
      const user = await get('SELECT * FROM User WHERE id = ?', [where.id]);
      if (user) {
        // 构建更新语句
        const fields = [];
        const values = [];
        
        if (data.nickname !== undefined) {
          fields.push('nickname = ?');
          values.push(data.nickname);
        }
        if (data.avatar !== undefined) {
          fields.push('avatar = ?');
          values.push(data.avatar);
        }
        if (data.bio !== undefined) {
          fields.push('bio = ?');
          values.push(data.bio);
        }
        if (data.gender !== undefined) {
          fields.push('gender = ?');
          values.push(data.gender);
        }
        if (data.location !== undefined) {
          fields.push('location = ?');
          values.push(data.location);
        }
        if (data.tags !== undefined) {
          fields.push('tags = ?');
          values.push(data.tags);
        }
        
        values.push(where.id);
        
        if (fields.length > 0) {
          await run(
            `UPDATE User SET ${fields.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        const updatedUser = await get('SELECT * FROM User WHERE id = ?', [where.id]);
        
        // 处理select选项
        if (select) {
          const selectedUser = {};
          for (const field of Object.keys(select)) {
            selectedUser[field] = updatedUser[field];
          }
          return selectedUser;
        }
        return updatedUser;
      }
      return null;
    },
    updateMany: async () => {
      return { count: 0 };
    },
    findMany: async (params) => {
      const { where, select, take } = params;
      let sql = 'SELECT * FROM User WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.username && where.username.contains) {
          sql += ' AND username LIKE ?';
          paramsArray.push('%' + where.username.contains + '%');
        }
        if (where.id && where.id.not) {
          sql += ' AND id != ?';
          paramsArray.push(where.id.not);
        }
      }
      
      if (take) {
        sql += ` LIMIT ${take}`;
      }
      
      let users = await query(sql, paramsArray);
      
      // 处理select选项
      if (select) {
        users = users.map(user => {
          const selectedUser = {};
          for (const field of Object.keys(select)) {
            selectedUser[field] = user[field];
          }
          return selectedUser;
        });
      }
      
      return users;
    }
  },

  // Message方法
  message: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO Message (content, type, senderId, receiverId, groupId, isRead, isRecalled, isEdited) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.content, data.type || 'text', data.senderId, data.receiverId, data.groupId, data.isRead || 0, data.isRecalled || 0, data.isEdited || 0]
      );
      return await get('SELECT * FROM Message WHERE id = ?', [result.lastID]);
    },
    findMany: async (params) => {
      const { where, orderBy, take, skip } = params;
      let sql = 'SELECT * FROM Message WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.OR) {
          sql += ' AND (';
          const orConditions = [];
          for (const condition of where.OR) {
            if (condition.senderId && condition.receiverId) {
              orConditions.push('(senderId = ? AND receiverId = ?)');
              paramsArray.push(condition.senderId, condition.receiverId);
            }
          }
          sql += orConditions.join(' OR ') + ')';
        }
        if (where.groupId) {
          sql += ' AND groupId = ?';
          paramsArray.push(where.groupId);
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'desc') {
          sql += ' ORDER BY createdAt DESC';
        } else {
          sql += ' ORDER BY createdAt ASC';
        }
      } else {
        sql += ' ORDER BY createdAt DESC';
      }
      
      if (skip) {
        sql += ' LIMIT -1 OFFSET ?';
        paramsArray.push(skip);
      }
      
      if (take) {
        if (skip) {
          sql = sql.replace('LIMIT -1', `LIMIT ${take}`);
        } else {
          sql += ` LIMIT ${take}`;
        }
      }
      
      return await query(sql, paramsArray);
    },
    findFirst: async (params) => {
      const { where, orderBy } = params;
      let sql = 'SELECT * FROM Message WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.OR) {
          sql += ' AND (';
          const orConditions = [];
          for (const condition of where.OR) {
            if (condition.senderId && condition.receiverId) {
              orConditions.push('(senderId = ? AND receiverId = ?)');
              paramsArray.push(condition.senderId, condition.receiverId);
            }
          }
          sql += orConditions.join(' OR ') + ')';
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'desc') {
          sql += ' ORDER BY createdAt DESC';
        } else {
          sql += ' ORDER BY createdAt ASC';
        }
      } else {
        sql += ' ORDER BY createdAt DESC';
      }
      
      sql += ' LIMIT 1';
      
      return await get(sql, paramsArray);
    },
    update: async (params) => {
      const { where, data } = params;
      const message = await get('SELECT * FROM Message WHERE id = ?', [where.id]);
      if (message) {
        // 构建更新语句
        const fields = [];
        const values = [];
        
        if (data.content !== undefined) {
          fields.push('content = ?');
          values.push(data.content);
        }
        if (data.isRead !== undefined) {
          fields.push('isRead = ?');
          values.push(data.isRead ? 1 : 0);
        }
        if (data.isRecalled !== undefined) {
          fields.push('isRecalled = ?');
          values.push(data.isRecalled ? 1 : 0);
        }
        if (data.isEdited !== undefined) {
          fields.push('isEdited = ?');
          values.push(data.isEdited ? 1 : 0);
        }
        
        values.push(where.id);
        
        if (fields.length > 0) {
          await run(
            `UPDATE Message SET ${fields.join(', ')} WHERE id = ?`,
            values
          );
        }
        
        return await get('SELECT * FROM Message WHERE id = ?', [where.id]);
      }
      return null;
    }
  },

  // Group方法
  group: {
    findMany: async () => {
      return await query('SELECT * FROM Groups');
    },
    findUnique: async (params) => {
      const { where, include } = params;
      if (where.id) {
        const group = await get('SELECT * FROM Groups WHERE id = ?', [where.id]);
        
        // 处理include选项
        if (group && include) {
          // 处理creator include
          if (include.creator) {
            const creator = await get('SELECT * FROM User WHERE id = ?', [group.creatorId]);
            if (creator) {
              group.creator = {};
              if (include.creator.select) {
                // 只包含指定的字段
                for (const field of Object.keys(include.creator.select)) {
                  group.creator[field] = creator[field];
                }
              } else {
                group.creator = creator;
              }
            }
          }
          
          // 处理members include
          if (include.members) {
            const members = await query('SELECT * FROM GroupMember WHERE groupId = ?', [group.id]);
            
            // 处理members的include选项
            if (include.members.include) {
              for (const member of members) {
                // 处理user include
                if (include.members.include.user) {
                  const user = await get('SELECT * FROM User WHERE id = ?', [member.userId]);
                  if (user) {
                    member.user = {};
                    if (include.members.include.user.select) {
                      // 只包含指定的字段
                      for (const field of Object.keys(include.members.include.user.select)) {
                        member.user[field] = user[field];
                      }
                    } else {
                      member.user = user;
                    }
                  }
                }
              }
            }
            
            group.members = members;
          }
        }
        
        return group;
      }
      return null;
    },
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO Groups (name, description, avatar, creatorId) 
         VALUES (?, ?, ?, ?)`,
        [data.name, data.description, data.avatar, data.creatorId]
      );
      return await get('SELECT * FROM Groups WHERE id = ?', [result.lastID]);
    }
  },

  // GroupMember方法
  groupMember: {
    findMany: async (params) => {
      const { where, include } = params;
      let sql = 'SELECT * FROM GroupMember WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.groupId) {
          sql += ' AND groupId = ?';
          paramsArray.push(where.groupId);
        }
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.userId && where.userId.not) {
          sql += ' AND userId != ?';
          paramsArray.push(where.userId.not);
        }
      }
      
      const members = await query(sql, paramsArray);
      
      // 处理include选项
      if (include && include.group) {
        for (const member of members) {
          // 查找对应的group
          const group = await get('SELECT * FROM Groups WHERE id = ?', [member.groupId]);
          if (group) {
            member.group = group;
            
            // 处理group的include选项
            if (include.group.include) {
              // 处理_count
              if (include.group.include._count) {
                member.group._count = {};
                if (include.group.include._count.select && include.group.include._count.select.members) {
                  // 计算该群组的成员数量
                  const memberCount = (await query('SELECT COUNT(*) as count FROM GroupMember WHERE groupId = ?', [group.id]))[0].count;
                  member.group._count.members = memberCount;
                }
              }
              
              // 处理messages
              if (include.group.include.messages) {
                // 查找该群组的最新消息
                let messageSql = 'SELECT * FROM Message WHERE groupId = ?';
                if (include.group.include.messages.orderBy) {
                  if (include.group.include.messages.orderBy.createdAt === 'desc') {
                    messageSql += ' ORDER BY createdAt DESC';
                  } else {
                    messageSql += ' ORDER BY createdAt ASC';
                  }
                } else {
                  messageSql += ' ORDER BY createdAt DESC';
                }
                if (include.group.include.messages.take) {
                  messageSql += ` LIMIT ${include.group.include.messages.take}`;
                }
                member.group.messages = await query(messageSql, [group.id]);
              }
            }
          }
        }
      }
      
      return members;
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.groupId_userId) {
        const { groupId, userId } = where.groupId_userId;
        return await get('SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?', [groupId, userId]);
      }
      return null;
    },
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO GroupMember (groupId, userId, role) 
         VALUES (?, ?, ?)`,
        [data.groupId, data.userId, data.role || 'MEMBER']
      );
      return await get('SELECT * FROM GroupMember WHERE id = ?', [result.lastID]);
    },
    createMany: async (params) => {
      const { data } = params;
      let count = 0;
      for (const memberData of data) {
        try {
          await run(
            `INSERT OR IGNORE INTO GroupMember (groupId, userId, role) 
             VALUES (?, ?, ?)`,
            [memberData.groupId, memberData.userId, memberData.role || 'MEMBER']
          );
          count++;
        }
        catch (error) {
          console.error('Error creating group member:', error);
        }
      }
      return { count };
    },
    update: async (params) => {
      const { where, data } = params;
      let fields = [];
      let values = [];
      
      if (data.role !== undefined) {
        fields.push('role = ?');
        values.push(data.role);
      }
      
      if (where.groupId_userId) {
        const { groupId, userId } = where.groupId_userId;
        values.push(groupId);
        values.push(userId);
        
        if (fields.length > 0) {
          await run(
            `UPDATE GroupMember SET ${fields.join(', ')} WHERE groupId = ? AND userId = ?`,
            values
          );
        }
        
        return await get('SELECT * FROM GroupMember WHERE groupId = ? AND userId = ?', [groupId, userId]);
      }
      return null;
    },
    delete: async () => {
      return { count: 0 };
    }
  },

  // UserCredit方法
  userCredit: {
    findUnique: async (params) => {
      const { where } = params;
      if (where.userId) {
        return await get('SELECT * FROM UserCredit WHERE userId = ?', [where.userId]);
      }
      return null;
    },
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO UserCredit (userId, balance, totalEarned) 
         VALUES (?, ?, ?)`,
        [data.userId, data.balance || 0, data.totalEarned || 0]
      );
      return await get('SELECT * FROM UserCredit WHERE id = ?', [result.lastID]);
    },
    update: async (params) => {
      const { where, data } = params;
      const credit = await get('SELECT * FROM UserCredit WHERE userId = ?', [where.userId]);
      if (credit) {
        // 构建更新语句
        const fields = [];
        const values = [];
        
        if (data.balance !== undefined) {
          if (typeof data.balance === 'object' && data.balance.increment) {
            fields.push('balance = balance + ?');
            values.push(data.balance.increment);
          } else {
            fields.push('balance = ?');
            values.push(data.balance);
          }
        }
        if (data.totalEarned !== undefined) {
          if (typeof data.totalEarned === 'object' && data.totalEarned.increment) {
            fields.push('totalEarned = totalEarned + ?');
            values.push(data.totalEarned.increment);
          } else {
            fields.push('totalEarned = ?');
            values.push(data.totalEarned);
          }
        }
        
        values.push(where.userId);
        
        if (fields.length > 0) {
          await run(
            `UPDATE UserCredit SET ${fields.join(', ')} WHERE userId = ?`,
            values
          );
        }
        
        return await get('SELECT * FROM UserCredit WHERE userId = ?', [where.userId]);
      }
      return null;
    },
    upsert: async (params) => {
      const { where, update, create } = params;
      let credit = await get('SELECT * FROM UserCredit WHERE userId = ?', [where.userId]);
      if (credit) {
        // Update existing credit
        const fields = [];
        const values = [];
        
        if (update.balance && update.balance.increment) {
          fields.push('balance = balance + ?');
          values.push(update.balance.increment);
        }
        if (update.totalEarned && update.totalEarned.increment) {
          fields.push('totalEarned = totalEarned + ?');
          values.push(update.totalEarned.increment);
        }
        
        values.push(where.userId);
        
        if (fields.length > 0) {
          await run(
            `UPDATE UserCredit SET ${fields.join(', ')} WHERE userId = ?`,
            values
          );
        }
        
        return await get('SELECT * FROM UserCredit WHERE userId = ?', [where.userId]);
      } else {
        // Create new credit
        const result = await run(
          `INSERT INTO UserCredit (userId, balance, totalEarned) 
           VALUES (?, ?, ?)`,
          [create.userId, create.balance || 0, create.totalEarned || 0]
        );
        return await get('SELECT * FROM UserCredit WHERE id = ?', [result.lastID]);
      }
    }
  },

  // CreditTransaction方法
  creditTransaction: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT INTO CreditTransaction (userId, type, amount, remark) 
         VALUES (?, ?, ?, ?)`,
        [data.userId, data.type, data.amount, data.remark]
      );
      return await get('SELECT * FROM CreditTransaction WHERE id = ?', [result.lastID]);
    }
  },

  // TaskLog方法
  taskLog: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT OR IGNORE INTO TaskLog (userId, taskKey) 
         VALUES (?, ?)`,
        [data.userId, data.taskKey]
      );
      return await get('SELECT * FROM TaskLog WHERE userId = ? AND taskKey = ?', [data.userId, data.taskKey]);
    },
    findFirst: async (params) => {
      const { where } = params;
      let sql = 'SELECT * FROM TaskLog WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.taskKey) {
          sql += ' AND taskKey = ?';
          paramsArray.push(where.taskKey);
        }
      }
      
      sql += ' LIMIT 1';
      
      return await get(sql, paramsArray);
    }
  },

  // Friendship方法
  friendship: {
    findMany: async (params) => {
      const { where, include } = params || {};
      let sql = 'SELECT * FROM Friendship WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.friendId) {
          sql += ' AND friendId = ?';
          paramsArray.push(where.friendId);
        }
        if (where.status) {
          sql += ' AND status = ?';
          paramsArray.push(where.status);
        }
        if (where.OR) {
          sql += ' AND (';
          const orConditions = [];
          for (const condition of where.OR) {
            if (condition.userId && condition.friendId) {
              orConditions.push('(userId = ? AND friendId = ?)');
              paramsArray.push(condition.userId, condition.friendId);
            }
          }
          sql += orConditions.join(' OR ') + ')';
        }
      }
      
      const friendships = await query(sql, paramsArray);
      
      // 处理include选项
      if (include) {
        for (const friendship of friendships) {
          if (include.user) {
            const user = await get('SELECT * FROM User WHERE id = ?', [friendship.userId]);
            if (user) {
              friendship.user = user;
            }
          }
          if (include.friend) {
            const friend = await get('SELECT * FROM User WHERE id = ?', [friendship.friendId]);
            if (friend) {
              friendship.friend = friend;
            }
          }
        }
      }
      
      return friendships;
    },
    findFirst: async (params) => {
      const { where, include } = params;
      let sql = 'SELECT * FROM Friendship WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.friendId) {
          sql += ' AND friendId = ?';
          paramsArray.push(where.friendId);
        }
        if (where.status) {
          sql += ' AND status = ?';
          paramsArray.push(where.status);
        }
        if (where.OR) {
          sql += ' AND (';
          const orConditions = [];
          for (const condition of where.OR) {
            if (condition.userId && condition.friendId) {
              orConditions.push('(userId = ? AND friendId = ?)');
              paramsArray.push(condition.userId, condition.friendId);
            }
          }
          sql += orConditions.join(' OR ') + ')';
        }
      }
      
      sql += ' LIMIT 1';
      
      const friendship = await get(sql, paramsArray);
      
      // 处理include选项
      if (friendship && include) {
        if (include.user) {
          const user = await get('SELECT * FROM User WHERE id = ?', [friendship.userId]);
          if (user) {
            friendship.user = user;
          }
        }
        if (include.friend) {
          const friend = await get('SELECT * FROM User WHERE id = ?', [friendship.friendId]);
          if (friend) {
            friendship.friend = friend;
          }
        }
      }
      
      return friendship;
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.id) {
        return await get('SELECT * FROM Friendship WHERE id = ?', [where.id]);
      }
      return null;
    },
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT OR IGNORE INTO Friendship (userId, friendId, status) 
         VALUES (?, ?, ?)`,
        [data.userId, data.friendId, data.status || 'PENDING']
      );
      return await get('SELECT * FROM Friendship WHERE userId = ? AND friendId = ?', [data.userId, data.friendId]);
    },
    update: async (params) => {
      const { where, data } = params;
      const friendship = await get('SELECT * FROM Friendship WHERE id = ?', [where.id]);
      if (friendship) {
        await run(
          `UPDATE Friendship SET status = ? WHERE id = ?`,
          [data.status, where.id]
        );
        return await get('SELECT * FROM Friendship WHERE id = ?', [where.id]);
      }
      return null;
    },
    delete: async (params) => {
      const { where } = params;
      if (where.id) {
        await run('DELETE FROM Friendship WHERE id = ?', [where.id]);
        return { count: 1 };
      }
      return { count: 0 };
    }
  },

  // Moment方法
  moment: {
    create: async (params) => {
      const { data, include } = params;
      const result = await run(
        `INSERT INTO Moment (userId, content, images) 
         VALUES (?, ?, ?)`,
        [data.userId, data.content, data.images]
      );
      
      let moment = await get('SELECT * FROM Moment WHERE id = ?', [result.lastID]);
      
      // 处理include选项
      if (include) {
        // 处理user include
        if (include.user) {
          const user = await get('SELECT * FROM User WHERE id = ?', [moment.userId]);
          if (user) {
            moment.user = {};
            if (include.user.select) {
              // 只包含指定的字段
              for (const field of Object.keys(include.user.select)) {
                moment.user[field] = user[field];
              }
            } else {
              moment.user = user;
            }
          }
        }
      }
      
      return moment;
    },
    findMany: async (params) => {
      const { where, orderBy, take, skip, include } = params;
      let sql = 'SELECT * FROM Moment WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'desc') {
          sql += ' ORDER BY createdAt DESC';
        } else {
          sql += ' ORDER BY createdAt ASC';
        }
      } else {
        sql += ' ORDER BY createdAt DESC';
      }
      
      if (skip) {
        sql += ' LIMIT -1 OFFSET ?';
        paramsArray.push(skip);
      }
      
      if (take) {
        if (skip) {
          sql = sql.replace('LIMIT -1', `LIMIT ${take}`);
        } else {
          sql += ` LIMIT ${take}`;
        }
      }
      
      let moments = await query(sql, paramsArray);
      
      // 处理include选项
      if (include) {
        for (const moment of moments) {
          // 处理user include
          if (include.user) {
            const user = await get('SELECT * FROM User WHERE id = ?', [moment.userId]);
            if (user) {
              moment.user = {};
              if (include.user.select) {
                // 只包含指定的字段
                for (const field of Object.keys(include.user.select)) {
                  moment.user[field] = user[field];
                }
              } else {
                moment.user = user;
              }
            }
          }
          
          // 处理_count include
          if (include._count) {
            moment._count = {};
            if (include._count.select) {
              if (include._count.select.likes) {
                // 计算点赞数
                const likeCount = (await query('SELECT COUNT(*) as count FROM Like WHERE momentId = ?', [moment.id]))[0].count;
                moment._count.likes = likeCount;
              }
              if (include._count.select.comments) {
                // 计算评论数
                const commentCount = (await query('SELECT COUNT(*) as count FROM Comment WHERE momentId = ?', [moment.id]))[0].count;
                moment._count.comments = commentCount;
              }
            }
          }
          
          // 处理likes include
          if (include.likes) {
            const { where: likesWhere } = include.likes;
            if (likesWhere && likesWhere.userId) {
              // 查找当前用户的点赞
              const likes = await query('SELECT * FROM Like WHERE momentId = ? AND userId = ?', [moment.id, likesWhere.userId]);
              moment.likes = likes;
            } else {
              moment.likes = [];
            }
          }
        }
      }
      
      return moments;
    },
    count: async (params) => {
      const { where } = params;
      let sql = 'SELECT COUNT(*) as count FROM Moment WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
      }
      
      const result = await query(sql, paramsArray);
      return { count: result[0].count };
    }
  },

  // Like方法
  like: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT OR IGNORE INTO Like (userId, momentId) 
         VALUES (?, ?)`,
        [data.userId, data.momentId]
      );
      return await get('SELECT * FROM Like WHERE userId = ? AND momentId = ?', [data.userId, data.momentId]);
    },
    delete: async (params) => {
      const { where } = params;
      if (where.id) {
        await run('DELETE FROM Like WHERE id = ?', [where.id]);
        return { count: 1 };
      }
      return { count: 0 };
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.userId && where.momentId) {
        return await get('SELECT * FROM Like WHERE userId = ? AND momentId = ?', [where.userId, where.momentId]);
      }
      return null;
    },
    count: async (params) => {
      const { where } = params;
      let sql = 'SELECT COUNT(*) as count FROM Like WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
      }
      
      const result = await query(sql, paramsArray);
      return { count: result[0].count };
    }
  },

  // Comment方法
  comment: {
    create: async (params) => {
      const { data, include } = params;
      const result = await run(
        `INSERT INTO Comment (userId, momentId, content) 
         VALUES (?, ?, ?)`,
        [data.userId, data.momentId, data.content]
      );
      
      let comment = await get('SELECT * FROM Comment WHERE id = ?', [result.lastID]);
      
      // 处理include选项
      if (include) {
        // 处理user include
        if (include.user) {
          const user = await get('SELECT * FROM User WHERE id = ?', [comment.userId]);
          if (user) {
            comment.user = {};
            if (include.user.select) {
              // 只包含指定的字段
              for (const field of Object.keys(include.user.select)) {
                comment.user[field] = user[field];
              }
            } else {
              comment.user = user;
            }
          }
        }
      }
      
      return comment;
    },
    findMany: async (params) => {
      const { where, orderBy, take, skip, include } = params;
      let sql = 'SELECT * FROM Comment WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.momentId) {
          sql += ' AND momentId = ?';
          paramsArray.push(where.momentId);
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'asc') {
          sql += ' ORDER BY createdAt ASC';
        } else {
          sql += ' ORDER BY createdAt DESC';
        }
      } else {
        sql += ' ORDER BY createdAt ASC';
      }
      
      if (skip) {
        sql += ' LIMIT -1 OFFSET ?';
        paramsArray.push(skip);
      }
      
      if (take) {
        if (skip) {
          sql = sql.replace('LIMIT -1', `LIMIT ${take}`);
        } else {
          sql += ` LIMIT ${take}`;
        }
      }
      
      let comments = await query(sql, paramsArray);
      
      // 处理include选项
      if (include) {
        for (const comment of comments) {
          // 处理user include
          if (include.user) {
            const user = await get('SELECT * FROM User WHERE id = ?', [comment.userId]);
            if (user) {
              comment.user = {};
              if (include.user.select) {
                // 只包含指定的字段
                for (const field of Object.keys(include.user.select)) {
                  comment.user[field] = user[field];
                }
              } else {
                comment.user = user;
              }
            }
          }
        }
      }
      
      return comments;
    },
    count: async (params) => {
      const { where } = params;
      let sql = 'SELECT COUNT(*) as count FROM Comment WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
      }
      
      const result = await query(sql, paramsArray);
      return { count: result[0].count };
    }
  },

  // Post方法
  post: {
    create: async (params) => {
      const { data, include } = params;
      const result = await run(
        `INSERT INTO Post (userId, title, content, category) 
         VALUES (?, ?, ?, ?)`,
        [data.userId, data.title, data.content, data.category || 'general']
      );
      
      let post = await get('SELECT * FROM Post WHERE id = ?', [result.lastID]);
      
      // 处理include选项
      if (include) {
        // 处理user include
        if (include.user) {
          const user = await get('SELECT * FROM User WHERE id = ?', [post.userId]);
          if (user) {
            post.user = {};
            if (include.user.select) {
              // 只包含指定的字段
              for (const field of Object.keys(include.user.select)) {
                post.user[field] = user[field];
              }
            } else {
              post.user = user;
            }
          }
        }
        
        // 处理_count include
        if (include._count) {
          post._count = {};
          if (include._count.select) {
            if (include._count.select.comments) {
              post._count.comments = 0; // 新创建的帖子没有评论
            }
            if (include._count.select.likes) {
              post._count.likes = 0; // 新创建的帖子没有点赞
            }
          }
        }
      }
      
      return post;
    },
    findMany: async (params) => {
      const { where, orderBy, take, skip, include } = params;
      let sql = 'SELECT * FROM Post WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.category) {
          sql += ' AND category = ?';
          paramsArray.push(where.category);
        }
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'desc') {
          sql += ' ORDER BY createdAt DESC';
        } else {
          sql += ' ORDER BY createdAt ASC';
        }
      } else {
        sql += ' ORDER BY createdAt DESC';
      }
      
      if (skip) {
        sql += ' LIMIT -1 OFFSET ?';
        paramsArray.push(skip);
      }
      
      if (take) {
        if (skip) {
          sql = sql.replace('LIMIT -1', `LIMIT ${take}`);
        } else {
          sql += ` LIMIT ${take}`;
        }
      }
      
      let posts = await query(sql, paramsArray);
      
      // 处理include选项
      if (include) {
        for (const post of posts) {
          // 处理user include
          if (include.user) {
            const user = await get('SELECT * FROM User WHERE id = ?', [post.userId]);
            if (user) {
              post.user = {};
              if (include.user.select) {
                // 只包含指定的字段
                for (const field of Object.keys(include.user.select)) {
                  post.user[field] = user[field];
                }
              } else {
                post.user = user;
              }
            }
          }
          
          // 处理_count include
          if (include._count) {
            post._count = {};
            if (include._count.select) {
              if (include._count.select.comments) {
                // 计算评论数
                const commentCount = (await query('SELECT COUNT(*) as count FROM PostComment WHERE postId = ?', [post.id]))[0].count;
                post._count.comments = commentCount;
              }
              if (include._count.select.likes) {
                // 计算点赞数
                const likeCount = (await query('SELECT COUNT(*) as count FROM PostLike WHERE postId = ?', [post.id]))[0].count;
                post._count.likes = likeCount;
              }
            }
          }
        }
      }
      
      return posts;
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.id) {
        return await get('SELECT * FROM Post WHERE id = ?', [where.id]);
      }
      return null;
    }
  },

  // PostComment方法
  postComment: {
    create: async (params) => {
      const { data, include } = params;
      const result = await run(
        `INSERT INTO PostComment (userId, postId, parentId, content) 
         VALUES (?, ?, ?, ?)`,
        [data.userId, data.postId, data.parentId, data.content]
      );
      
      let comment = await get('SELECT * FROM PostComment WHERE id = ?', [result.lastID]);
      
      // 处理include选项
      if (include) {
        // 处理user include
        if (include.user) {
          const user = await get('SELECT * FROM User WHERE id = ?', [comment.userId]);
          if (user) {
            comment.user = {};
            if (include.user.select) {
              // 只包含指定的字段
              for (const field of Object.keys(include.user.select)) {
                comment.user[field] = user[field];
              }
            } else {
              comment.user = user;
            }
          }
        }
      }
      
      return comment;
    },
    findMany: async (params) => {
      const { where, include, orderBy } = params;
      let sql = 'SELECT * FROM PostComment WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.postId) {
          sql += ' AND postId = ?';
          paramsArray.push(where.postId);
        }
        if (where.parentId) {
          sql += ' AND parentId = ?';
          paramsArray.push(where.parentId);
        }
      }
      
      if (orderBy) {
        if (orderBy.createdAt === 'asc') {
          sql += ' ORDER BY createdAt ASC';
        } else {
          sql += ' ORDER BY createdAt DESC';
        }
      } else {
        sql += ' ORDER BY createdAt ASC';
      }
      
      let comments = await query(sql, paramsArray);
      
      // 处理include选项
      if (include) {
        for (const comment of comments) {
          // 处理user include
          if (include.user) {
            const user = await get('SELECT * FROM User WHERE id = ?', [comment.userId]);
            if (user) {
              comment.user = {};
              if (include.user.select) {
                // 只包含指定的字段
                for (const field of Object.keys(include.user.select)) {
                  comment.user[field] = user[field];
                }
              } else {
                comment.user = user;
              }
            }
          }
        }
      }
      
      return comments;
    }
  },

  // PostLike方法
  postLike: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT OR IGNORE INTO PostLike (userId, postId) 
         VALUES (?, ?)`,
        [data.userId, data.postId]
      );
      return await get('SELECT * FROM PostLike WHERE userId = ? AND postId = ?', [data.userId, data.postId]);
    },
    delete: async (params) => {
      const { where } = params;
      if (where.id) {
        await run('DELETE FROM PostLike WHERE id = ?', [where.id]);
        return { count: 1 };
      }
      return { count: 0 };
    },
    findUnique: async (params) => {
      const { where } = params;
      if (where.userId_postId) {
        const { userId, postId } = where.userId_postId;
        return await get('SELECT * FROM PostLike WHERE userId = ? AND postId = ?', [userId, postId]);
      }
      return null;
    }
  },

  // TaskLog方法
  taskLog: {
    create: async (params) => {
      const { data } = params;
      const result = await run(
        `INSERT OR IGNORE INTO TaskLog (userId, taskKey) 
         VALUES (?, ?)`,
        [data.userId, data.taskKey]
      );
      return await get('SELECT * FROM TaskLog WHERE userId = ? AND taskKey = ?', [data.userId, data.taskKey]);
    },
    findMany: async (params) => {
      const { where } = params;
      let sql = 'SELECT * FROM TaskLog WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.taskKey) {
          sql += ' AND taskKey = ?';
          paramsArray.push(where.taskKey);
        }
        if (where.completedAt) {
          if (where.completedAt.gte) {
            sql += ' AND completedAt >= ?';
            paramsArray.push(where.completedAt.gte);
          }
        }
      }
      
      return await query(sql, paramsArray);
    },
    findFirst: async (params) => {
      const { where } = params;
      let sql = 'SELECT * FROM TaskLog WHERE 1=1';
      const paramsArray = [];
      
      if (where) {
        if (where.userId) {
          sql += ' AND userId = ?';
          paramsArray.push(where.userId);
        }
        if (where.taskKey) {
          sql += ' AND taskKey = ?';
          paramsArray.push(where.taskKey);
        }
        if (where.completedAt) {
          if (where.completedAt.gte) {
            sql += ' AND completedAt >= ?';
            paramsArray.push(where.completedAt.gte);
          }
        }
      }
      
      sql += ' LIMIT 1';
      
      return await get(sql, paramsArray);
    }
  },

  // 实现事务支持
  $transaction: async (callback) => {
    // 在SQLite中，事务就是直接执行回调函数
    return await callback(prisma);
  }
};

module.exports = prisma;