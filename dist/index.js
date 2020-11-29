'use strict';


// move this to server module once it works
const express = require('express');
const app = express();
const WebSocket = require("ws");

app.use(express.static(__dirname + '/../public'));

app.get('/', (req, res) => {
  res.send('this shouldn\'t ever be sent');
});

const server = app.listen(80, () => console.log('Listening on port 80.'));

const wss = new WebSocket.Server({server});

wss.on('connection', (ws, req) => {
  console.log(
    "Client connected: " + JSON.stringify(req.connection.remoteAddress)
  );
})
