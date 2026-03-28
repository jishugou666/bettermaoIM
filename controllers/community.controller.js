const { communityPosts, communityComments, communityLikes, users, chats, chatMembers } = require('../db/crud');
const { v4: uuidv4 } = require('uuid');

class CommunityController {
  // 获取帖子列表
  async getPosts(req, res) {
    try {
      // 从数据库获取所有帖子
      const postsList = await communityPosts.read({}, { sort: { createdAt: -1 } });
      
      // 为每个帖子添加用户信息和统计信息
      const postsWithInfo = await Promise.all(
        postsList.map(async (post) => {
          // 获取用户信息
          const userList = await users.read({ _id: post.userId });
          const user = userList[0];
          
          // 获取点赞数
          const likeList = await communityLikes.read({ postId: post._id });
          const likes = likeList.length;
          
          // 获取评论数
          const commentList = await communityComments.read({ postId: post._id });
          const comments = commentList.length;
          
          // 检查当前用户是否点赞
          const userLikeList = await communityLikes.read({ postId: post._id, userId: req.user.userId });
          const isLiked = userLikeList.length > 0;
          
          return {
            id: post._id,
            title: post.title,
            content: post.content,
            category: post.category || 'general',
            user: {
              id: user?._id,
              username: user?.username || user?.nickname || 'Unknown',
              avatar: user?.avatar,
              isVip: user?.isVip || false
            },
            createdAt: post.createdAt,
            _count: {
              likes,
              comments
            },
            isLiked
          };
        })
      );
      
      res.json(postsWithInfo);
    } catch (error) {
      console.error('Error getting posts:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建帖子
  async createPost(req, res) {
    try {
      const { title, content, category } = req.body;
      const { userId } = req.user;
      
      if (!title || !content) {
        return res.status(400).json({ message: '标题和内容不能为空' });
      }
      
      // 获取用户信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      
      // 创建帖子
      const newPost = await communityPosts.create({
        userId,
        title,
        content,
        category: category || 'general',
        createdAt: new Date().toISOString()
      });
      
      const postWithInfo = {
        id: newPost._id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        user: {
          id: user._id,
          username: user.username || user.nickname,
          avatar: user.avatar,
          isVip: user.isVip || false
        },
        createdAt: newPost.createdAt,
        _count: {
          likes: 0,
          comments: 0
        },
        isLiked: false
      };
      
      res.status(201).json(postWithInfo);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 点赞/取消点赞
  async toggleLike(req, res) {
    try {
      const { postId } = req.params;
      const { userId } = req.user;
      
      // 检查帖子是否存在
      const postList = await communityPosts.read({ _id: postId });
      if (postList.length === 0) {
        return res.status(404).json({ message: '帖子不存在' });
      }
      
      // 检查是否已经点赞
      const likeList = await communityLikes.read({ postId, userId });
      
      if (likeList.length > 0) {
        // 取消点赞
        await communityLikes.delete({ postId, userId });
        res.json({ success: true, liked: false });
      } else {
        // 添加点赞
        await communityLikes.create({
          postId,
          userId,
          createdAt: new Date().toISOString()
        });
        res.json({ success: true, liked: true });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 获取帖子详情（包含评论）
  async getPostDetails(req, res) {
    try {
      const { postId } = req.params;
      
      // 获取帖子
      const postList = await communityPosts.read({ _id: postId });
      if (postList.length === 0) {
        return res.status(404).json({ message: '帖子不存在' });
      }
      
      const post = postList[0];
      
      // 获取用户信息
      const userList = await users.read({ _id: post.userId });
      const user = userList[0];
      
      // 获取点赞数
      const likeList = await communityLikes.read({ postId });
      const likes = likeList.length;
      
      // 获取评论列表
      const commentList = await communityComments.read({ postId }, { sort: { createdAt: -1 } });
      
      // 为每个评论添加用户信息
      const commentsWithUser = await Promise.all(
        commentList.map(async (comment) => {
          const commentUserList = await users.read({ _id: comment.userId });
          const commentUser = commentUserList[0];
          return {
            id: comment._id,
            content: comment.content,
            user: {
              id: commentUser?._id,
              username: commentUser?.username || commentUser?.nickname || 'Unknown',
              avatar: commentUser?.avatar,
              isVip: commentUser?.isVip || false
            },
            createdAt: comment.createdAt
          };
        })
      );
      
      // 检查当前用户是否点赞
      const userLikeList = await communityLikes.read({ postId, userId: req.user.userId });
      const isLiked = userLikeList.length > 0;
      
      const postWithDetails = {
        id: post._id,
        title: post.title,
        content: post.content,
        category: post.category,
        user: {
          id: user._id,
          username: user.username || user.nickname,
          avatar: user.avatar,
          isVip: user.isVip || false
        },
        createdAt: post.createdAt,
        _count: {
          likes,
          comments: commentsWithUser.length
        },
        isLiked,
        comments: commentsWithUser
      };
      
      res.json(postWithDetails);
    } catch (error) {
      console.error('Error getting post details:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建评论
  async createComment(req, res) {
    try {
      const { postId } = req.params;
      const { content } = req.body;
      const { userId } = req.user;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ message: '评论内容不能为空' });
      }
      
      // 检查帖子是否存在
      const postList = await communityPosts.read({ _id: postId });
      if (postList.length === 0) {
        return res.status(404).json({ message: '帖子不存在' });
      }
      
      // 获取用户信息
      const userList = await users.read({ _id: userId });
      const user = userList[0];
      
      // 创建评论
      const newComment = await communityComments.create({
        postId,
        userId,
        content: content.trim(),
        createdAt: new Date().toISOString()
      });
      
      const commentWithUser = {
        id: newComment._id,
        content: newComment.content,
        user: {
          id: user._id,
          username: user.username || user.nickname,
          avatar: user.avatar,
          isVip: user.isVip || false
        },
        createdAt: newComment.createdAt
      };
      
      res.status(201).json(commentWithUser);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建讨论组
  async createDiscussionGroup(req, res) {
    try {
      const { postId, memberIds } = req.body;
      const { userId } = req.user;
      
      // 获取帖子信息
      const postList = await communityPosts.read({ _id: postId });
      if (postList.length === 0) {
        return res.status(404).json({ message: '帖子不存在' });
      }
      
      const post = postList[0];
      
      // 创建群组
      const newGroup = await chats.create({
        name: `讨论: ${post.title}`,
        type: 'group',
        ownerId: userId,
        createdAt: new Date().toISOString()
      });
      
      // 添加创建者为群成员
      await chatMembers.create({
        chatId: newGroup._id,
        userId: userId,
        role: 'owner',
        joinedAt: new Date().toISOString()
      });
      
      // 添加其他成员
      if (memberIds && memberIds.length > 0) {
        for (const memberId of memberIds) {
          await chatMembers.create({
            chatId: newGroup._id,
            userId: memberId,
            role: 'member',
            joinedAt: new Date().toISOString()
          });
        }
      }
      
      res.status(201).json({
        id: newGroup._id,
        name: newGroup.name,
        description: '基于社区帖子的讨论组',
        memberCount: (memberIds?.length || 0) + 1,
        type: 'group'
      });
    } catch (error) {
      console.error('Error creating discussion group:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
}

module.exports = new CommunityController();
