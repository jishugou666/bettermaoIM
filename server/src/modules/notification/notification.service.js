const prisma = require('../../core/prisma');

class NotificationService {
  async createNotification(userId, { type, title, message, relatedId }) {
    return await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        relatedId
      }
    });
  }

  async getNotifications(userId) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: { userId, read: false }
    });
    return count;
  }

  async markAsRead(notificationId, userId) {
    return await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { read: true }
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }

  async getNotificationsByType(userId, type) {
    return await prisma.notification.findMany({
      where: { userId, type },
      orderBy: { createdAt: 'desc' }
    });
  }
}

module.exports = new NotificationService();
