const notificationService = require('./notification.service');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const notifications = await notificationService.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(parseInt(id), req.user.id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      res.json({ success: true, count: result.count });
    } catch (error) {
      next(error);
    }
  }

  async getNotificationsByType(req, res, next) {
    try {
      const { type } = req.params;
      const notifications = await notificationService.getNotificationsByType(req.user.id, type);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
