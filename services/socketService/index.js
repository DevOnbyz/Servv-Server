const express = require('express')
const app = express()
const Log = require('../../log')
const http = require('http').createServer(app)
// const io = require('socket.io')(http, { transports: ['websocket'] })
require('dotenv').config()
const CONSTANTS = require('../../lib/constants')

const io = require("socket.io")(http, {
  cors: {
    origin: process.env.ALLOWED_DOMAIN, // Frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket"],
});

io.on(CONSTANTS.SOCKET_EVENT_CONNECT, async (socket) => {
  try {
    Log.info(`Socket connected: ${socket.id}`)
    socket.on("test", (data) => {
      console.log("Ring event received:", data);
    });
  } catch (error) {
    Log.error(error)
  }
})

io.on(CONSTANTS.SOCKET_EVENT_DISCONNECT, async (socket) => {
  try {
    Log.info(`Socket disconnected: ${socket.id}`)
  } catch (error) {
    Log.error(error)
  }
})

http.listen(process.env.SOCKET_PORT, () => {
  Log.info(`Running Socket Server at ${process.env.SOCKET_PORT}`)
})