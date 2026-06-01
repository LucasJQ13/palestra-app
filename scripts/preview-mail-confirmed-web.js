const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const port = 8094;
const logoPath = path.join(__dirname, '..', 'assets', 'logo-palestra.png');

function html() {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Mail confirmado - Palestra</title>
  <style>
    :root {
      --primary: #2d8dc8;
      --soft: #e6f3f5;
      --ink: #123245;
      --muted: #5e8396;
      --green: #43b97a;
      --white: #ffffff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 20% 20%, rgba(93, 167, 219, 0.28), transparent 30%),
        radial-gradient(circle at 80% 10%, rgba(67, 185, 122, 0.16), transparent 26%),
        linear-gradient(145deg, #f6fdff 0%, var(--soft) 46%, #d7edf4 100%);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      padding: 28px;
    }
    .panel {
      width: min(92vw, 420px);
      border: 1px solid rgba(45, 141, 200, 0.18);
      border-radius: 32px;
      padding: 34px 26px 28px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 24px 70px rgba(18, 50, 69, 0.16);
      text-align: center;
    }
    .logo-ring {
      width: 104px;
      height: 104px;
      margin: 0 auto 22px;
      display: grid;
      place-items: center;
      border-radius: 34px;
      background: linear-gradient(150deg, rgba(45, 141, 200, 0.12), rgba(255, 255, 255, 0.9));
      border: 1px solid rgba(45, 141, 200, 0.16);
      box-shadow: 0 12px 32px rgba(45, 141, 200, 0.18);
    }
    img {
      width: 78px;
      height: 78px;
      object-fit: contain;
      border-radius: 50%;
    }
    h1 {
      margin: 0;
      font-size: 31px;
      line-height: 1.06;
      font-weight: 900;
      letter-spacing: 0;
    }
    p {
      margin: 16px auto 26px;
      max-width: 320px;
      color: var(--muted);
      font-size: 16px;
      line-height: 1.48;
      font-weight: 600;
    }
    button {
      width: 100%;
      min-height: 52px;
      border: 0;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--primary), #5da7db);
      color: var(--white);
      font-size: 16px;
      font-weight: 900;
      cursor: default;
      box-shadow: 0 14px 32px rgba(45, 141, 200, 0.22);
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: var(--green);
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main class="panel" aria-label="Preview visual de mail confirmado">
    <div class="logo-ring">
      <img src="/logo-palestra.png" alt="Logo Palestra" />
    </div>
    <div class="status">Correo verificado</div>
    <h1>Mail confirmado</h1>
    <p>Tu correo fue confirmado correctamente. Ya podés ingresar a Palestra APP.</p>
    <button type="button">Ingresar</button>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/logo-palestra.png') {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    fs.createReadStream(logoPath).pipe(res);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html());
});

server.listen(port, () => {
  const url = `http://localhost:${port}`;
  console.log(`Preview visual de MailConfirmedScreen: ${url}`);
  console.log('Esto no prueba deep links reales. Para deep link real se necesita APK instalada en Android.');
  if (process.platform === 'win32') {
    execFile('cmd.exe', ['/c', 'start', '', url]);
  }
});
