require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const todoRouter = require("./routers/todoRouter");

const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGO_URL ||
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/doit";
const DB_RETRY_MS = 10000;

const app = express();
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({ ok: true, dbConnected });
});

app.use("/todos", todoRouter);

async function connectWithRetry() {
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGODB_URI);
    console.log("연결성공");
  } catch (err) {
    console.error("MongoDB connection failed. Retrying in 10s...", err.message);
    setTimeout(connectWithRetry, DB_RETRY_MS);
  }
}

function start() {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
  connectWithRetry();
}

async function shutdown(signal) {
  try {
    console.log(`\nReceived ${signal}. Shutting down...`);
    await mongoose.disconnect();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
