const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api", require("./routes/taskRoutes"));

const PORT = 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});