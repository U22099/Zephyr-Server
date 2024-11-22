const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
app.use((req, res, next) => {
  console.log(`${req.method}\t${req.url.split("?")[0]}`);
  next();
});
app.get('/ping', (req, res) => {
  const currentTime = new Date();
  res.json({ currentTime: currentTime.toISOString() });
});
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(httpServer, {
  cors: {
    origin: "https://zephyr-ktqp.onrender.com",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.broadcast.emit("connected", `user with id: ${socket.id} connected`);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat-message", (msg) => {
    console.log("message: " + msg);
    socket.broadcast.emit("chat-message", msg);
  });
  socket.on("join", (room) => {
    socket.join(room);
    console.log("user joined room", room);
  });
});

httpServer.listen(PORT, () => {
  console.log("listening on Port: "+PORT);
});