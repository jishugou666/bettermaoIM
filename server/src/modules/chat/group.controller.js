const groupService = require('./group.service');

class GroupController {
  async createGroup(req, res, next) {
    try {
      const { name, description, avatar, memberIds } = req.body;
      if (!name) return res.status(400).json({ message: 'Group name required' });

      const group = await groupService.createGroup(req.user.id, { 
        name, 
        description, 
        avatar, 
        memberIds 
      });
      res.status(201).json(group);
    } catch (error) {
      next(error);
    }
  }

  async getGroups(req, res, next) {
    try {
      const groups = await groupService.getGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  }

  async getGroupDetails(req, res, next) {
    try {
      const { id } = req.params;
      const group = await groupService.getGroupDetails(parseInt(id));
      if (!group) return res.status(404).json({ message: 'Group not found' });
      res.json(group);
    } catch (error) {
      next(error);
    }
  }

  async addMembers(req, res, next) {
    try {
      const { id } = req.params;
      const { userIds } = req.body;
      if (!userIds || !Array.isArray(userIds)) {
        return res.status(400).json({ message: 'User IDs array required' });
      }

      await groupService.addMembers(parseInt(id), userIds);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async kickMember(req, res, next) {
    try {
      const { id, userId } = req.params;
      await groupService.kickMember(req.user.id, parseInt(id), parseInt(userId));
      res.json({ success: true, message: 'Member kicked' });
    } catch (error) {
      next(error);
    }
  }

  async transferOwnership(req, res, next) {
    try {
      const { id } = req.params;
      const { newOwnerId } = req.body;
      if (!newOwnerId) return res.status(400).json({ message: 'New owner ID required' });
      
      await groupService.transferOwnership(req.user.id, parseInt(id), parseInt(newOwnerId));
      res.json({ success: true, message: 'Ownership transferred' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GroupController();
