import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import serverless from 'serverless-http'; // নতুন লাইব্রেরি লাগবে!
import { auditLogger } from './middleware/audit/auditLogger.js';
import statsRoute from './routes/statsRoute.js';
import userRoute from './routes/userRoute.js';
import { checkUserAgent } from './utils/saveUserAgent.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(auditLogger);
app.use(checkUserAgent);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
});

// Routes
app.get('/', limiter, (req, res) => {
  res.send('Hello World!');
});
app.use('/api/users', limiter, userRoute);
app.use('/api/stats', limiter, statsRoute);

// Localhost এ listen করা (Vercel এ না)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

// ❌ সরাসরি app export করবে না
// ✅ serverless handler বানিয়ে export করতে হবে
export const handler = serverless(app);
