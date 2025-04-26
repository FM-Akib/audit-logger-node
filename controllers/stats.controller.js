import fs from 'fs';
import moment from 'moment'; // install this: npm install moment
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const logDir = path.join(__dirname, '../middleware/logs');
const logDir2 = path.join(__dirname, '../utils/auditlogs');
const requestsPath = path.join(logDir, 'requests.json');
const normalReqPath = path.join(logDir2, 'normalreq.json');
const blockedReqPath = path.join(logDir2, 'blockedreq.json');

const readJSON = filePath => {
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    if (data) {
      return JSON.parse(data);
    }
  }
  return [];
};

export const getAllStats = (req, res) => {
  try {
    const { date } = req.query; // Example: 2025-04-26
    const allRequests = readJSON(requestsPath);
    const normalRequests = readJSON(normalReqPath);
    const blockedRequests = readJSON(blockedReqPath);

    let filteredRequests = allRequests;
    if (date) {
      filteredRequests = allRequests.filter(req =>
        req.timestamp.startsWith(date),
      );
    }

    const totalRequests = filteredRequests.length;
    const totalNormal = normalRequests.filter(req =>
      req.timestamp.startsWith(date),
    ).length;
    const totalBlocked = blockedRequests.filter(req =>
      req.timestamp.startsWith(date),
    ).length;

    const methodCounts = {
      GET: 0,
      POST: 0,
      PUT: 0,
      DELETE: 0,
      PATCH: 0,
      OTHER: 0,
    };

    const userAgentCounts = {};

    const dayWiseCounts = {};

    filteredRequests.forEach(req => {
      // Method count
      const method = req.method.toUpperCase();
      if (methodCounts.hasOwnProperty(method)) {
        methodCounts[method]++;
      } else {
        methodCounts.OTHER++;
      }

      // User agent count
      const userAgent = req.headers?.['user-agent'] || 'Unknown';
      userAgentCounts[userAgent] = (userAgentCounts[userAgent] || 0) + 1;

      // Day-wise count
      const day = moment(req.timestamp).format('YYYY-MM-DD');
      dayWiseCounts[day] = (dayWiseCounts[day] || 0) + 1;
    });

    // Top 5 user agents
    const topUserAgents = Object.entries(userAgentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agent, count]) => ({ agent, count }));

    res.json({
      totalRequests,
      totalNormal,
      totalBlocked,
      methodCounts,
      topUserAgents,
      dayWiseCounts,
      last10Requests: filteredRequests.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
