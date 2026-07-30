import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./module/auth/auth.routes.js";
import assetRoutes from "./module/asset/asset.routes.js";
import homeRoutes from "./module/Home_page/home.routes.js";

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
return res.send("🚀🚀 Bunndle_rent server is up and running")
});

app.get("/health/db", (req, res) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const currentState = mongoose.connection.readyState;

  return res.status(currentState === 1 ? 200 : 503).json({
    success: currentState === 1,
    status: states[currentState] || "unknown",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/asset", assetRoutes);
app.use("/api/home", homeRoutes)

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((error, req, res, next) => {
  console.error("Global error:", error);

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

export default app;