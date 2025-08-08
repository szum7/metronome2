const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let currentTempo = 120; // BPM
let startTime = null;

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Send current state
  socket.emit("tempo", currentTempo);
  if (startTime) {
    socket.emit("start", { tempo: currentTempo, startTime });
  }

  socket.on("setTempo", (tempo) => {
    currentTempo = tempo;
    io.emit("tempo", tempo);
  });

  socket.on("start", () => {
    startTime = Date.now() + 1000; // start in 1 second
    io.emit("start", { tempo: currentTempo, startTime });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
