import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhook, stripeWebhooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import jwt from "jsonwebtoken";

const app = express();

// ✅ Connect DB & Cloudinary ONCE
let isConnected = false;
const connectServices = async () => {
  if (!isConnected) {
    await connectDB();
    await connectCloudinary();
    isConnected = true;
    console.log("DB & Cloudinary Connected");
  }
};

// ✅ Custom Auth Middleware
const customAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded?.payload?.sub) {
        req.auth = { userId: decoded.payload.sub };
      }
    } catch (error) {
      console.error("Token decode failed:", error.message);
    }
  }
  next();
};

// ✅ Middlewares
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(express.json());
app.use(customAuthMiddleware);

// ✅ Logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ✅ Routes
app.get("/", async (req, res) => {
  await connectServices();
  res.send("API Working");
});

app.post("/clerk", express.json(), clerkWebhook);

app.use("/api/educator", async (req, res, next) => {
  await connectServices();
  next();
}, educatorRouter);

app.use("/api/course", async (req, res, next) => {
  await connectServices();
  next();
}, courseRouter);

app.use("/api/user", async (req, res, next) => {
  await connectServices();
  next();
}, userRouter);

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

// ✅ Export for Vercel (IMPORTANT)
export default app;