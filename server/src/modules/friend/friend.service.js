const prisma = require('../../core/prisma');

class FriendService {
  async sendRequest(userId, friendId) {
    if (userId === friendId) {
      throw new Error('Cannot add yourself as friend');
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        throw new Error('Already friends');
      }
      if (existing.status === 'PENDING' && existing.userId === userId) {
        throw new Error('Request already sent');
      }
      if (existing.status === 'PENDING' && existing.userId === friendId) {
        // Auto accept if the other person already sent a request
        return await this.acceptRequest(existing.id, userId);
      }
    }

    return await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'PENDING'
      }
    });
  }

  async acceptRequest(friendshipId, userId) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) throw new Error('Request not found');
    if (friendship.friendId !== userId) throw new Error('Not authorized');

    return await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' }
    });
  }

  async rejectRequest(friendshipId, userId) {
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId }
    });

    if (!friendship) throw new Error('Request not found');
    if (friendship.friendId !== userId) throw new Error('Not authorized');

    return await prisma.friendship.delete({
      where: { id: friendshipId }
    });
  }

  async getFriends(userId) {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId, status: 'ACCEPTED' },
          { friendId: userId, status: 'ACCEPTED' }
        ]
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        friend: { select: { id: true, username: true, avatar: true } }
      }
    });

    return friendships.map(f => f.userId === userId ? f.friend : f.user);
  }

  async blockUser(userId, friendId) {
    if (userId === friendId) {
      throw new Error('Cannot block yourself');
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId }
        ]
      }
    });

    if (existing) {
      // If already blocked by current user
      if (existing.status === 'BLOCKED' && existing.userId === userId) {
        throw new Error('User already blocked');
      }
      
      // Update existing friendship to BLOCKED
      // Ensure current user becomes the "initiator" (userId) of the block
      // We might need to delete and recreate or just update if userId matches
      // To simplify, we delete and recreate or update carefully.
      // But BLOCKED status implies the "userId" is the blocker.
      
      if (existing.userId === userId) {
        return await prisma.friendship.update({
          where: { id: existing.id },
          data: { status: 'BLOCKED' }
        });
      } else {
        // Swap roles: delete old friendship (where friendId was initiator) and create new one
        await prisma.friendship.delete({ where: { id: existing.id } });
        return await prisma.friendship.create({
          data: {
            userId,
            friendId,
            status: 'BLOCKED'
          }
        });
      }
    }

    // Create new blocked relationship
    return await prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'BLOCKED'
      }
    });
  }

  async unblockUser(userId, friendId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        userId,
        friendId,
        status: 'BLOCKED'
      }
    });

    if (!friendship) throw new Error('Block record not found');

    return await prisma.friendship.delete({
      where: { id: friendship.id }
    });
  }

  async getBlockedUsers(userId) {
    const blocked = await prisma.friendship.findMany({
      where: {
        userId,
        status: 'BLOCKED'
      },
      include: {
        friend: { select: { id: true, username: true, avatar: true } }
      }
    });
    return blocked.map(f => f.friend);
  }

  async getPendingRequests(userId) {
    return await prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING'
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } }
      }
    });
  }
  
  async searchUsers(query, currentUserId) {
    return await prisma.user.findMany({
      where: {
        username: { contains: query },
        id: { not: currentUserId }
      },
      select: { id: true, username: true, avatar: true },
      take: 10
    });
  }
}

module.exports = new FriendService();
