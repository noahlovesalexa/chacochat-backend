const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let waiting = null;

io.on("connection", (socket) => {

  socket.on("find", () => {
    if (waiting && waiting !== socket.id) {
      const partner = io.sockets.sockets.get(waiting);

      socket.partner = waiting;
      partner.partner = socket.id;

      socket.emit("matched", { initiator: true });
      partner.emit("matched", { initiator: false });

      waiting = null;
    } else {
      waiting = socket.id;
    }
  });

  socket.on("offer", data => {
    io.to(socket.partner).emit("offer", data);
  });

  socket.on("answer", data => {
    io.to(socket.partner).emit("answer", data);
  });

  socket.on("ice", data => {
    io.to(socket.partner).emit("ice", data);
  });

  socket.on("skip", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("partner-left");
    }
  });

  socket.on("disconnect", () => {
    if (socket.partner) {
      io.to(socket.partner).emit("partner-left");
    }

    if (waiting === socket.id) waiting = null;
  });

});

server.listen(3000, () => console.log("Server running"));
