const { points, users } = require('../db/crud');

class PointsController {
  async getPoints(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取用户积分记录
      const pointsList = await points.read({ userId }, { sort: { createTime: -1 } });
      
      // 获取用户当前积分
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      const currentPoints = user ? user.points || 0 : 0;
      
      res.status(200).json({ points: pointsList, currentPoints });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async sign(req, res) {
    try {
      const { userId } = req.user;
      
      // 检查今天是否已经签到
      const today = new Date().toISOString().split('T')[0];
      const todayStart = new Date(today).toISOString();
      const todayEnd = new Date(today + 'T23:59:59.999Z').toISOString();
      
      const signRecords = await points.read({ 
        userId, 
        type: 'sign',
        createTime: {
          $gte: todayStart,
          $lte: todayEnd
        }
      });
      
      if (signRecords.length > 0) {
        return res.status(400).json({ error: 'Already signed today' });
      }
      
      // 生成签到积分（随机1-10分）
      const signPoints = Math.floor(Math.random() * 10) + 1;
      
      // 添加积分记录
      await points.create({ 
        userId, 
        type: 'sign', 
        amount: signPoints, 
        description: '每日签到',
        createTime: new Date().toISOString()
      });
      
      // 更新用户积分
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      if (user) {
        const currentPoints = user.points || 0;
        await users.update({ _id: userId }, { points: currentPoints + signPoints });
      }
      
      res.status(200).json({ message: 'Sign successful', points: signPoints });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getRank(req, res) {
    try {
      // 获取积分排行榜
      const userList = await users.read({}, { points: -1 });
      
      // 过滤出有积分的用户并排序
      const rankedUsers = userList
        .filter(user => user.points > 0)
        .map(user => ({
          id: user._id,
          username: user.username,
          avatar: user.avatar,
          points: user.points
        }))
        .sort((a, b) => b.points - a.points);
      
      res.status(200).json({ rank: rankedUsers });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new PointsController();