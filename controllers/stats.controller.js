import fs from 'fs';
import moment from 'moment';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const { date } = req.query;
    const allRequests = readJSON(requestsPath);
    const normalRequests = readJSON(normalReqPath);
    const blockedRequests = readJSON(blockedReqPath);

    let filteredRequests = allRequests;
    if (date) {
      filteredRequests = allRequests.filter(r => r.timestamp.startsWith(date));
    }

    const totalRequests = filteredRequests.length;

    // Fix normal and blocked count based on selected date
    const filteredNormal = date
      ? normalRequests.filter(r => r.timestamp.startsWith(date))
      : normalRequests;

    const filteredBlocked = date
      ? blockedRequests.filter(r => r.timestamp.startsWith(date))
      : blockedRequests;

    const totalNormal = filteredNormal.length;
    const totalBlocked = filteredBlocked.length;

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

    // User Stats Map
    const userStatsMap = {};

    filteredRequests.forEach(r => {
      // Method counts
      const method = r.method?.toUpperCase();
      if (methodCounts.hasOwnProperty(method)) {
        methodCounts[method]++;
      } else {
        methodCounts.OTHER++;
      }

      // User agent counts
      const userAgent = r.headers?.['user-agent'] || 'Unknown';
      userAgentCounts[userAgent] = (userAgentCounts[userAgent] || 0) + 1;

      // Day wise counts
      const day = moment(r.timestamp).format('YYYY-MM-DD');
      dayWiseCounts[day] = (dayWiseCounts[day] || 0) + 1;

      // User-wise stats
      const ip = r.ip || 'Unknown IP';
      const key = `${ip}_${userAgent}`;

      if (!userStatsMap[key]) {
        userStatsMap[key] = {
          ip,
          userAgent,
          count: 0,
          lastSeen: r.timestamp,
        };
      }
      userStatsMap[key].count += 1;

      if (new Date(r.timestamp) > new Date(userStatsMap[key].lastSeen)) {
        userStatsMap[key].lastSeen = r.timestamp;
      }
    });

    const userStats = Object.values(userStatsMap);

    // Top 5 User Agents
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
      userStats, // ✅ added
      last10Requests: filteredRequests.slice(-10).reverse(),
    });
  } catch (error) {
    console.error('Error generating stats:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
