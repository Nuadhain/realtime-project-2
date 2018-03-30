const xxh = require('xxhashjs');
const child = require('child_process');
const Character = require('./messages/Character.js');
const Message = require('./messages/Message.js');

const charList = {};
let io;

const directions = {
  LEFT: 0,
  RIGHT: 0,
};

const physics = child.fork('./src/physics.js');

physics.on('message', (msg) => {
  switch (msg.type) {
    case 'kickHit': {
      io.sockets.in('room1').emit('kickHit', msg.data);
      break;
    }
    default: {
      console.log('Invalid Message from physics');
    }
  }
});

physics.on('error', (error) => {
  console.dir(error);
});

physics.on('close', (code, signal) => {
  console.log(`child closed with ${code} ${signal}`);
});

physics.on('exit', (code, signal) => {
  console.log(`child exited with ${code} ${signal}`);
});

physics.send(new Message('charList', charList));

const setupSockets = (ioServer) => {
  io = ioServer;

  io.on('connection', (sock) => {
    const socket = sock;

    socket.join('room1');

    const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xDEADDEAD).toString(16);

    charList[hash] = new Character(hash);

    socket.hash = hash;

    socket.emit('joined', charList[hash]);

    socket.on('updateMove', (data) => {
      charList[socket.hash] = data;

      charList[socket.hash].lastUpdate = new Date().getTime();

      physics.send(new Message('charList', charList));

      io.sockets.in('room1').emit('updatedMovement', charList[socket.hash]);
      io.sockets.in('room1').emit('fuck', `${hash} is moving`);
    });

    socket.on('kick', (data) => {
      const kick = data;

      switch (kick.direction) {
        case directions.LEFT: {
          kick.x -= 16;
          break;
        }
        case directions.RIGHT: {
          kick.x += 34;
          break;
        }
        default: {
          console.log('direction invalid');
          break;
        }
      }

      io.sockets.in('room1').emit('updateKick', kick);
      physics.send(new Message('kick', kick));
    });

    socket.on('disconnect', () => {
      // const room = charList[socket.hash].room;

      io.sockets.in('room1').emit('left', charList[socket.hash]);

      delete charList[socket.hash];

      physics.send(new Message('charList', charList));

      socket.leave('room1');
    });
  });
};

module.exports.setupSockets = setupSockets;
