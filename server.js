const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;
const io = new Server(httpServer, {
  cors: {
    origin: "https://zephyr-ktqp.onrender.com", //Update to your frontend origin
  },
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg); //Broadcasts to all connected clients
  });
  socket.on("join", (room) => {
    socket.join(room);
    console.log("user joined room", room);
  });
});

httpServer.listen(PORT, () => {
  console.log("listening on Port: "+PORT);
});