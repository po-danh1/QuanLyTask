require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Chia sẻ io cho các controller
app.set("io", io);

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/taskRoutes"));
app.use("/api", require("./routes/commentRoutes"));
app.use("/api", require("./routes/logRoutes"));
app.use("/api", require("./routes/teamRoutes"));
app.use("/api", require("./routes/projectRoutes"));

const startCronJobs = require("./scheduler");

const PORT = 3000;

startCronJobs();

server.listen(PORT, () => {
  console.log("Server running on port " + PORT + " with Socket.io");
});