-- BetterMao IM MySQL Database Schema (Dual Naming Support)
-- 创建数据库
CREATE DATABASE IF NOT EXISTS bettermao CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bettermao;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(500),
    status VARCHAR(20) DEFAULT 'online',
    bio TEXT,
    signature TEXT,
    gender VARCHAR(10),
    birthday DATE,
    location VARCHAR(100),
    tags JSON,
    points INT DEFAULT 0,
    role VARCHAR(20) DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 好友关系表
CREATE TABLE IF NOT EXISTS friends (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    friendId VARCHAR(36) NOT NULL,
    friend_id VARCHAR(36) GENERATED ALWAYS AS (friendId) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    UNIQUE KEY uk_user_friend (userId, friendId),
    INDEX idx_userId (userId),
    INDEX idx_friendId (friendId),
    INDEX idx_user_id (user_id),
    INDEX idx_friend_id (friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 好友请求表
CREATE TABLE IF NOT EXISTS friendRequests (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    fromUserId VARCHAR(36) NOT NULL,
    from_user_id VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
    senderId VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
    sender_id VARCHAR(36) GENERATED ALWAYS AS (fromUserId) STORED,
    toUserId VARCHAR(36) NOT NULL,
    to_user_id VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
    receiverId VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
    receiver_id VARCHAR(36) GENERATED ALWAYS AS (toUserId) STORED,
    status VARCHAR(20) DEFAULT 'pending',
    message TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
    UNIQUE KEY uk_from_to (fromUserId, toUserId),
    INDEX idx_fromUserId (fromUserId),
    INDEX idx_toUserId (toUserId),
    INDEX idx_from_user_id (from_user_id),
    INDEX idx_to_user_id (to_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天会话表
CREATE TABLE IF NOT EXISTS chats (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    sessionId VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    type VARCHAR(20) NOT NULL DEFAULT 'private',
    name VARCHAR(100),
    avatar VARCHAR(500),
    creatorId VARCHAR(36),
    creator_id VARCHAR(36) GENERATED ALWAYS AS (creatorId) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 聊天成员表
CREATE TABLE IF NOT EXISTS chatMembers (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    chatId VARCHAR(36) NOT NULL,
    chat_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    sessionId VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    session_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    role VARCHAR(20) DEFAULT 'member',
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    joined_at DATETIME GENERATED ALWAYS AS (joinedAt) STORED,
    UNIQUE KEY uk_chat_user (chatId, userId),
    INDEX idx_chatId (chatId),
    INDEX idx_userId (userId),
    INDEX idx_chat_id (chat_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    chatId VARCHAR(36) NOT NULL,
    chat_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    sessionId VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    session_id VARCHAR(36) GENERATED ALWAYS AS (chatId) STORED,
    senderId VARCHAR(36) NOT NULL,
    sender_id VARCHAR(36) GENERATED ALWAYS AS (senderId) STORED,
    userId VARCHAR(36) GENERATED ALWAYS AS (senderId) STORED,
    type VARCHAR(20) DEFAULT 'text',
    content TEXT,
    attachments JSON,
    readBy JSON,
    status VARCHAR(20) DEFAULT 'sent',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    INDEX idx_chatId (chatId),
    INDEX idx_senderId (senderId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_chat_id (chat_id),
    INDEX idx_sender_id (sender_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 积分表
CREATE TABLE IF NOT EXISTS points (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    amount INT DEFAULT 0,
    type VARCHAR(50),
    description TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    INDEX idx_userId (userId),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 朋友圈动态表
CREATE TABLE IF NOT EXISTS moments (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    content TEXT,
    images JSON,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    INDEX idx_userId (userId),
    INDEX idx_createdAt (createdAt),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 朋友圈点赞表
CREATE TABLE IF NOT EXISTS momentLikes (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    momentId VARCHAR(36) NOT NULL,
    moment_id VARCHAR(36) GENERATED ALWAYS AS (momentId) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    UNIQUE KEY uk_moment_user (momentId, userId),
    INDEX idx_momentId (momentId),
    INDEX idx_userId (userId),
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 朋友圈评论表
CREATE TABLE IF NOT EXISTS momentComments (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    momentId VARCHAR(36) NOT NULL,
    moment_id VARCHAR(36) GENERATED ALWAYS AS (momentId) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    content TEXT,
    replyTo VARCHAR(36),
    reply_to VARCHAR(36) GENERATED ALWAYS AS (replyTo) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    INDEX idx_momentId (momentId),
    INDEX idx_userId (userId),
    INDEX idx_moment_id (moment_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 社区帖子表
CREATE TABLE IF NOT EXISTS communityPosts (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    title VARCHAR(200),
    content TEXT,
    images JSON,
    category VARCHAR(50),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
    INDEX idx_userId (userId),
    INDEX idx_category (category),
    INDEX idx_createdAt (createdAt),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 社区评论表
CREATE TABLE IF NOT EXISTS communityComments (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    postId VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) GENERATED ALWAYS AS (postId) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    content TEXT,
    replyTo VARCHAR(36),
    reply_to VARCHAR(36) GENERATED ALWAYS AS (replyTo) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    INDEX idx_postId (postId),
    INDEX idx_userId (userId),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 社区点赞表
CREATE TABLE IF NOT EXISTS communityLikes (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    postId VARCHAR(36) NOT NULL,
    post_id VARCHAR(36) GENERATED ALWAYS AS (postId) STORED,
    userId VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) GENERATED ALWAYS AS (userId) STORED,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    UNIQUE KEY uk_post_user (postId, userId),
    INDEX idx_postId (postId),
    INDEX idx_userId (userId),
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 管理员用户表
CREATE TABLE IF NOT EXISTS adminUsers (
    _id VARCHAR(36) PRIMARY KEY,
    id VARCHAR(36) GENERATED ALWAYS AS (_id) STORED,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'admin',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME GENERATED ALWAYS AS (createdAt) STORED,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at DATETIME GENERATED ALWAYS AS (updatedAt) STORED,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
