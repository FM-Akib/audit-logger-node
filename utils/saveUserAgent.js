import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, './auditlogs');
const normalLogPath = path.join(logDir, 'normalreq.json');
const blockedLogPath = path.join(logDir, 'blockedreq.json');

export const checkUserAgent = (req, res, next) => {
  const userAgent = req.headers['user-agent'];

  const blockedPatterns = [
    /curl/i,
    /wget/i,
    /python-requests/i,
    /Go-http-client/i,
    /Java/i,
    /sqlmap/i,
    /nmap/i,
    /Nikto/i,
    /HeadlessChrome/i,
    /PhantomJS/i,
    /BadBot/i,
    /EvilScraper/i,
    /MaliciousBot/i,
  ];
  const isBlocked = blockedPatterns.some(pattern => pattern.test(userAgent));
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    userAgent,
  };
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const targetLogPath = isBlocked ? blockedLogPath : normalLogPath;
  let data = [];
  if (fs.existsSync(targetLogPath)) {
    const fileData = fs.readFileSync(targetLogPath, 'utf8');
    if (fileData) {
      data = JSON.parse(fileData);
    }
  }

  data.push(logEntry);
  fs.writeFileSync(targetLogPath, JSON.stringify(data, null, 2));

  if (isBlocked) {
    return res.status(403).json({ message: 'User agent blocked' });
  } else {
    next();
  }
};
