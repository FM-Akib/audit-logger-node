import express from 'express';
import { auditLogger } from './middleware/audit/auditLogger.js';
import statsRoute from './routes/statsRoute.js';
import userRoute from './routes/userRoute.js';
import { checkUserAgent } from './utils/saveUserAgent.js';
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(auditLogger);
app.use(checkUserAgent);

import rateLimit from 'express-rate-limit';
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

app.get('/', limiter, (req, res) => {
  res.send('Hello World!');
});

app.use('/api/users', limiter, userRoute);
app.use('/api/stats', limiter, statsRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
