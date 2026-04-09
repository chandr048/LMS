import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhook, stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import jwt from 'jsonwebtoken';

// Initialize express app
const app = express();

// Custom auth middleware to extract Bearer token
const customAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      // Decode the JWT token
      const decoded = jwt.decode(token, { complete: true });
      if (decoded && decoded.payload && decoded.payload.sub) {
        req.auth = { userId: decoded.payload.sub };
      }
    } catch (error) {
      console.error('Token decode failed:', error.message);
    }
  }
  next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(customAuthMiddleware);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.auth) {
    console.log('Auth UserId:', req.auth.userId);
  } else {
    console.log('Auth: No token provided (public route)');
  }
  next();
});

// Global error handler (add this!)
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Routes
app.get("/", (req, res) => res.send("API Working"));
app.post("/clerk", express.json(), clerkWebhook);
app.use('/api/educator', educatorRouter);
app.use('/api/course', courseRouter);
app.use('/api/user', userRouter);
app.post('/stripe', express.raw({type: 'application/json'}), stripeWebhooks);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await connectDB();
    await connectCloudinary();
    console.log(`Server running on port ${PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
});