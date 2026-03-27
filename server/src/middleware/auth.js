const jwt = require('jsonwebtoken')
const config = require('../config')

// HTTP鉴权中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}

// WebSocket鉴权中间件
authMiddleware.socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token
  if (!token) {
    return next(new Error('No token provided'))
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    socket.user = decoded
    next()
  } catch (error) {
    return next(new Error('Invalid token'))
  }
}

module.exports = authMiddleware