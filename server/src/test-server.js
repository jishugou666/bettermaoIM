const http = require('http');

const PORT = 3003;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', message: 'Server is running', timestamp: new Date() }));
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('Starting server...');