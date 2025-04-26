import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// const logfilePath = path.join(__dirname, '../logs/requests.json');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, '../logs');
const logFilePath = path.join(logDir, 'requests.json');

export const auditLogger = (req, res, next) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    headers: {
      'user-agent': req.headers['user-agent'] || '',
      authorization: req.headers['authorization'] || '',
      referer: req.headers['referer'] || '',
      origin: req.headers['origin'] || '',
      'accept-language': req.headers['accept-language'] || '',
      'content-type': req.headers['content-type'] || '',
    },
  };

  let data = [];
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  if (fs.existsSync(logFilePath)) {
    const fileData = fs.readFileSync(logFilePath, 'utf8');
    if (fileData) {
      data = JSON.parse(fileData);
    }
  }

  data.push(logEntry);
  fs.writeFileSync(logFilePath, JSON.stringify(data, null, 2));
  next();
};
