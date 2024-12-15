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
const globalOngoingCall = new Map();

io.on("connection", (socket) => {

  socket.emit("connection", socket.id);

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

  socket.on("get-user-active-status", (data) => {
    const recipientSocketId = globalOnlineUsers.get(data.id);
    if (recipientSocketId) {
      socket.emit("recieve-user-active-status", data.id);
    } else socket.emit("recieve-user-active-status", null);
  });

  socket.on("send-message", (data) => {
    const recipientSocketId = globalOnlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("recieve-message", data.data);
    }
  });

  socket.on("group-send-message", data => {
    socket.broadcast.to(data.groupId).emit("group-recieve-message", data.data);
  });

  socket.on("outgoing-voice-call", data => {
    globalOngoingCall.set(data.to, data);
    const recipientSocketId = globalOnlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incoming-voice-call", data);
    }
  });

  socket.on("outgoing-video-call", data => {
    globalOngoingCall.set(data.to, data);
    const recipientSocketId = globalOnlineUsers.get(data.to);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit("incoming-video-call", data);
    }
  });

  socket.on("group-outgoing-voice-call", data => {
    globalOngoingCall.set(data.to, data);
    socket.broadcast.to(data.to).emit("group-incoming-voice-call", data);
  });

  socket.on("group-outgoing-video-call", data => {
    globalOngoingCall.set(data.to, data);
    socket.broadcast.to(data.to).emit("group-incoming-video-call", data);
  });
  
  socket.on("ongoing-call-check", uid => {
    const ongoingCallData = globalOngoingCall.get(uid);
    if(ongoingCallData){
      socket.emit("ongoing-call-confirm", ongoingCallData);
    }
  });
  
  socket.on("call-ended", uid => {
    globalOngoingCall.delete(uid);
  });
});


httpServer.listen(PORT, () => {
  console.log("listening on Port: " + PORT);
});