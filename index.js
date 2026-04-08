const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Cache static files at startup to avoid reading from disk on every request
let htmlContent = null;
let cssContent = null;

function loadStaticFiles() {
  htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'));
  cssContent = fs.readFileSync(path.join(__dirname, 'style.css'));
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Method Not Allowed');
    return;
  }

  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Content-Length': Buffer.byteLength(htmlContent),
      ...SECURITY_HEADERS,
    });
    res.end(htmlContent);
  } else if (req.url === '/style.css') {
    res.writeHead(200, {
      'Content-Type': 'text/css',
      'Content-Length': Buffer.byteLength(cssContent),
      ...SECURITY_HEADERS,
    });
    res.end(cssContent);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Not Found');
  }
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

loadStaticFiles();
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
