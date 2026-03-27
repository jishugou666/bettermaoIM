const prisma = require('../../core/prisma');
const creditService = require('../credit/credit.service');

class GroupService {
  async isGroupMember(groupId, userId) {
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: parseInt(groupId),
          userId: parseInt(userId)
        }
      }
    });
    return !!member;
  }

  async createGroup(userId, { name, description, avatar, memberIds }) {
    // 1. Create Group
    const group = await prisma.group.create({
      data: {
        name,
        description,
        avatar,
        creatorId: userId
      }
    });

    // 2. Add Creator as Admin
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: userId,
        role: 'ADMIN'
      }
    });

    // 3. Add initial members
    if (memberIds && memberIds.length > 0) {
      // Filter out creator if accidentally included
      const membersToAdd = memberIds.filter(id => id !== userId);
      
      if (membersToAdd.length > 0) {
        await prisma.groupMember.createMany({
          data: membersToAdd.map(id => ({
            groupId: group.id,
            userId: id,
            role: 'MEMBER'
          }))
        });
      }
    }

    // Check for first_group task
    creditService.checkAndCompleteTask(userId, 'first_group').catch(console.error);

    return group;
  }

  async getGroups(userId) {
    // Get groups where user is a member
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: {
              select: { members: true }
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const groups = memberships.map(m => ({
      ...m.group,
      role: m.role,
      memberCount: m.group._count.members,
      lastMessage: m.group.messages[0] || null
    }));

    return groups.sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }

  async getGroupDetails(groupId) {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        creator: {
          select: { id: true, username: true, avatar: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, username: true, avatar: true }
            }
          }
        }
      }
    });
    return group;
  }

  async addMembers(groupId, userIds) {
    // Filter existing members
    const existing = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { in: userIds }
      }
    });
    const existingIds = existing.map(m => m.userId);
    const newIds = userIds.filter(id => !existingIds.includes(id));

    if (newIds.length > 0) {
      await prisma.groupMember.createMany({
        data: newIds.map(id => ({
          groupId,
          userId: id,
          role: 'MEMBER'
        }))
      });
    }
    return newIds.length;
  }

  async removeMember(groupId, userId) {
    // 1. Check if user is the last admin/creator? 
    // If creator leaves, maybe transfer ownership or delete group?
    // For M5, just allow leaving/removing.
    
    await prisma.groupMember.deleteMany({
      where: {
        groupId,
        userId
      }
    });
  }

  async kickMember(initiatorId, groupId, targetUserId) {
    // 1. Verify initiator is admin/creator
    const initiator = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: initiatorId }
      }
    });

    if (!initiator || initiator.role !== 'ADMIN') {
      throw new Error('Only admins can kick members');
    }

    // 2. Cannot kick self (use leave instead)
    if (initiatorId === targetUserId) {
      throw new Error('Cannot kick yourself');
    }

    // 3. Perform removal
    return await this.removeMember(groupId, targetUserId);
  }

  async transferOwnership(initiatorId, groupId, newOwnerId) {
    // 1. Verify initiator is creator/admin
    const initiator = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: initiatorId }
      }
    });

    // Strictly speaking only creator should transfer? Or any admin?
    // Let's say only current creator can transfer? 
    // The schema has `creatorId` on Group, and `role` on GroupMember.
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group.creatorId !== initiatorId) {
      throw new Error('Only group creator can transfer ownership');
    }

    // 2. Verify new owner is a member
    const newOwner = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: newOwnerId }
      }
    });

    if (!newOwner) {
      throw new Error('New owner must be a group member');
    }

    return await prisma.$transaction([
      // Update Group creatorId
      prisma.group.update({
        where: { id: groupId },
        data: { creatorId: newOwnerId }
      }),
      // Update roles
      prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: newOwnerId } },
        data: { role: 'ADMIN' }
      }),
      // Optional: Downgrade old creator to MEMBER? Or keep as ADMIN?
      // Let's keep as ADMIN for now
      prisma.groupMember.update({
        where: { groupId_userId: { groupId, userId: initiatorId } },
        data: { role: 'ADMIN' }
      })
    ]);
  }

  async setAdmin(initiatorId, groupId, targetUserId) {
    // 1. Verify initiator is creator
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (group.creatorId !== initiatorId) {
      throw new Error('Only group creator can set admin');
    }

    // 2. Verify target is a member
    const target = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: targetUserId }
      }
    });

    if (!target) {
      throw new Error('Target user must be a group member');
    }

    // 3. Set target as admin
    return await prisma.groupMember.update({
      where: { groupId_userId: { groupId, userId: targetUserId } },
      data: { role: 'ADMIN' }
    });
  }

  async updateAnnouncement(initiatorId, groupId, announcement) {
    // 1. Verify initiator is admin or creator
    const initiator = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: { groupId, userId: initiatorId }
      }
    });

    if (!initiator || (initiator.role !== 'ADMIN' && initiator.role !== 'OWNER')) {
      throw new Error('Only admins can update announcement');
    }

    // 2. Update announcement
    return await prisma.group.update({
      where: { id: groupId },
      data: { announcement }
    });
  }
}

module.exports = new GroupService();
