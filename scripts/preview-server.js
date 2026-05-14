const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8082;
const filePath = path.join(__dirname, '..', 'preview', 'index.html');

const server = http.createServer((request, response) => {
  if (request.url !== '/' && request.url !== '/index.html') {
    response.writeHead(302, { Location: '/' });
    response.end();
    return;
  }

  fs.readFile(filePath, (error, html) => {
    if (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('No se pudo cargar la previsualizacion.');
      return;
    }

    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    response.end(html);
  });
});

server.listen(port, () => {
  console.log(`Palestra preview: http://localhost:${port}`);
});
