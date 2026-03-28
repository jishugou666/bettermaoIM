const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

console.log('Testing Socket.IO...');

const SERVER_URL = 'http://localhost:3000';
const JWT_SECRET = 'your-secret-key';

const token = jwt.sign({ userId: 'test1', username: 'Test1' }, JWT_SECRET);

console.log('Token:', token.substring(0, 30) + '...');

const socket = io(SERVER_URL, {
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ CONNECTED!');
  console.log('Socket ID:', socket.id);
  
  setTimeout(() => {
    console.log('Disconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', (err) => {
  console.log('❌ CONNECT ERROR:', err.message);
  process.exit(1);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});

setTimeout(() => {
  console.log('⏱️ Timeout');
  process.exit(1);
}, 10000);
