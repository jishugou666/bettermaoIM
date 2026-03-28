const { moments, momentLikes, momentComments, users, friends } = require('../db/crud');

class MomentsController {
  async createMoment(req, res) {
    try {
      const { userId } = req.user;
      const { content, images } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }
      
      // 创建朋友圈动态
      const moment = await moments.create({ 
        userId, 
        content, 
        images: images || [],
        createTime: new Date().toISOString()
      });
      
      // 获取用户信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      const momentWithUser = {
        ...moment,
        user: {
          id: user._id,
          username: user.username || user.nickname,
          avatar: user.avatar
        },
        _count: {
          likes: 0,
          comments: 0
        },
        isLiked: false
      };
      
      res.status(200).json({ moment: momentWithUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMoments(req, res) {
    try {
      const { userId } = req.user;
      
      // 获取用户的好友列表
      const friendList = await friends.read({ userId, status: 'active' });
      const friendIds = friendList.map(friend => friend.friendId);
      const allUserIds = [userId, ...friendIds];
      
      // 获取好友的朋友圈动态
      const momentsList = await moments.read({ userId: { $in: allUserIds } }, { sort: { createTime: -1 } });
      
      // 获取每个动态的用户信息、点赞数、评论数和当前用户是否点赞
      const momentsWithInfo = await Promise.all(
        momentsList.map(async (moment) => {
          // 获取用户信息
          const userList = await users.read({ _id: moment.userId });
          const user = userList[0];
          
          // 获取点赞数
          const likeList = await momentLikes.read({ momentId: moment._id });
          const likes = likeList.length;
          
          // 获取评论数
          const commentList = await momentComments.read({ momentId: moment._id });
          const comments = commentList.length;
          
          // 检查当前用户是否点赞
          const userLikeList = await momentLikes.read({ momentId: moment._id, userId });
          const liked = userLikeList.length > 0;
          
          return {
            ...moment,
            id: moment._id,
            user: {
              id: user._id,
              username: user.username || user.nickname,
              avatar: user.avatar
            },
            _count: {
              likes,
              comments
            },
            isLiked: liked,
            createdAt: moment.createTime
          };
        })
      );
      
      res.status(200).json({ moments: momentsWithInfo });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async likeMoment(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      // 检查动态是否存在
      const momentList = await moments.read({ _id: id });
      if (momentList.length === 0) {
        return res.status(404).json({ error: 'Moment not found' });
      }
      
      // 检查是否已经点赞
      const likeList = await momentLikes.read({ momentId: id, userId });
      if (likeList.length > 0) {
        return res.status(400).json({ error: 'Already liked' });
      }
      
      // 添加点赞
      await momentLikes.create({ 
        momentId: id, 
        userId,
        createTime: new Date().toISOString()
      });
      
      res.status(200).json({ message: 'Liked' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async unlikeMoment(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      // 检查动态是否存在
      const momentList = await moments.read({ _id: id });
      if (momentList.length === 0) {
        return res.status(404).json({ error: 'Moment not found' });
      }
      
      // 检查是否已经点赞
      const likeList = await momentLikes.read({ momentId: id, userId });
      if (likeList.length === 0) {
        return res.status(400).json({ error: 'Not liked yet' });
      }
      
      // 取消点赞
      await momentLikes.delete({ momentId: id, userId });
      
      res.status(200).json({ message: 'Unliked' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async commentMoment(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Comment content is required' });
      }
      
      // 检查动态是否存在
      const momentList = await moments.read({ _id: id });
      if (momentList.length === 0) {
        return res.status(404).json({ error: 'Moment not found' });
      }
      
      // 添加评论
      const comment = await momentComments.create({ 
        momentId: id, 
        userId, 
        content,
        createTime: new Date().toISOString()
      });
      
      // 获取用户信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      const commentWithUser = {
        ...comment,
        user: {
          id: user._id,
          nickname: user.nickname,
          avatar: user.avatar
        }
      };
      
      res.status(200).json({ comment: commentWithUser });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteComment(req, res) {
    try {
      const { userId } = req.user;
      const { id, commentId } = req.params;
      
      // 检查评论是否存在，并且是当前用户的评论
      const commentList = await momentComments.read({ _id: commentId, userId, momentId: id });
      if (commentList.length === 0) {
        return res.status(404).json({ error: 'Comment not found' });
      }
      
      // 删除评论
      await momentComments.delete({ _id: commentId });
      
      res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getMomentDetail(req, res) {
    try {
      const { userId } = req.user;
      const { id } = req.params;
      
      // 获取动态详情
      const momentList = await moments.read({ _id: id });
      if (momentList.length === 0) {
        return res.status(404).json({ error: 'Moment not found' });
      }
      
      const moment = momentList[0];
      
      // 获取用户信息
      const userList = await users.read({ _id: moment.userId });
      const user = userList[0];
      
      // 获取点赞数
      const likeList = await momentLikes.read({ momentId: id });
      const likes = likeList.length;
      
      // 获取评论列表
      const commentList = await momentComments.read({ momentId: id }, { sort: { createTime: -1 } });
      
      // 获取评论的用户信息
      const commentsWithUser = await Promise.all(
        commentList.map(async (comment) => {
          const commentUserList = await users.read({ _id: comment.userId });
          const commentUser = commentUserList[0];
          return {
            ...comment,
            user: {
              id: commentUser._id,
              nickname: commentUser.nickname,
              avatar: commentUser.avatar
            }
          };
        })
      );
      
      // 检查当前用户是否点赞
      const userLikeList = await momentLikes.read({ momentId: id, userId });
      const liked = userLikeList.length > 0;
      
      const momentWithDetail = {
        ...moment,
        id: moment._id,
        user: {
          id: user._id,
          username: user.username || user.nickname,
          avatar: user.avatar
        },
        _count: {
          likes,
          comments: commentsWithUser.length
        },
        comments: commentsWithUser,
        isLiked: liked,
        createdAt: moment.createTime
      };
      
      res.status(200).json({ moment: momentWithDetail });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new MomentsController();