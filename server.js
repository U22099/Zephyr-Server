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

const globalOnlineUsers = new Map();

io.on("connection", (socket) => {
  
  socket.on("add-user", (userId) => {
    globalOnlineUsers.set(userId, socket.id);
  });
  
  socket.on("join-group", id => {
    socket.join(id);
  })

  socket.on("disconnect", () => {
    globalOnlineUsers.forEach((value, key) => {
      if (value === socket.id) {
        globalOnlineUsers.delete(key);
      }
    });
  });

  socket.on("send-message", (data) => {
    const recipientSocketId = globalOnlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("recieve-message", data.data);
    }
  });
  
  socket.on("group-send-message", data => {
    io.to(data.groupId).emit("group-recieve-message", data.data);
  })
});


httpServer.listen(PORT, () => {
  console.log("listening on Port: "+PORT);
});