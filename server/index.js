const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("client"));

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Respond to ping for time sync
  socket.on("time:ping", (clientSentTime) => {
    const serverTime = Date.now();
    socket.emit("time:pong", {
      clientSentTime,
      serverTime,
    });
  });

  socket.on("metronome:start", (data) => {
    const startTime = Date.now() + data.delay;
    io.emit("metronome:begin", {
      bpm: data.bpm,
      startAt: startTime,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
