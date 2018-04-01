// Get the xxhashjs library for creating hash codes
const xxh = require('xxhashjs');
const child = require('child_process');
// Get the character and message structures
const Character = require('./messages/Character.js');
const Message = require('./messages/Message.js');

// Create a list of characters and io
const charList = {};
let io;

// Object to hold directions
const directions = {
  LEFT: 0,
  RIGHT: 1,
};

// Get the physics handler
const physics = child.fork('./src/physics.js');

// Method to handle messages from physics
physics.on('message', (msg) => {
  switch (msg.type) {
    case 'kickHit': {
      // If the message is a succesful kick then send info to client
      io.sockets.in('room1').emit('kickHit', msg.data);
      break;
    }
    default: {
      // Otherwise the message is invalid
      console.log('Invalid Message from physics');
    }
  }
});

physics.on('error', (error) => {
  // Display any error received from physics
  console.dir(error);
});

// Close physics
physics.on('close', (code, signal) => {
  console.log(`child closed with ${code} ${signal}`);
});
// Exit physics
physics.on('exit', (code, signal) => {
  console.log(`child exited with ${code} ${signal}`);
});
// Send a message to physics with the character list
physics.send(new Message('charList', charList));

// Set up and handle the sockets of the server
const setupSockets = (ioServer) => {
  io = ioServer;

  // Handle a connection to the server
  io.on('connection', (sock) => {
    const socket = sock;

    // New user joins the room
    socket.join('room1');

    // Assign the new user a unique ID
    const hash = xxh.h32(`${socket.id}${new Date().getTime()}`, 0xDEADDEAD).toString(16);

    // Create a new character using the unique ID and add it to the list
    charList[hash] = new Character(hash);

    // Set the current socket's hash to the user's
    socket.hash = hash;

    // Send the information to the client
    socket.emit('joined', charList[hash]);

    // Handle movement of the character being updated
    socket.on('updateMovement', (data) => {
      // Set the character's data to the updated data from the client
      // and update their time code
      charList[socket.hash] = data;
      charList[socket.hash].lastUpdate = new Date().getTime();

      // Send the update character list to physics
      physics.send(new Message('charList', charList));

      // Send the character's updated information to the rest of the clients
      io.sockets.in('room1').emit('updatedMovement', charList[socket.hash]);
    });

    // Handle a character kicking
    socket.on('kick', (data) => {
      // Set the data of the kick from the client
      const kick = data;

      // Check the direction of the kick
      switch (kick.direction) {
        case directions.LEFT: {
          // Set the kick to be on the left side of the character
          kick.x -= 10;
          break;
        }
        case directions.RIGHT: {
          // Set the kick to be on the right side of the character
          kick.x += 45;
          break;
        }
        default: {
          // The kick is in an invalid direction
          console.log(`direction invalid ${kick.direction}`);
          break;
        }
      }

      // Update clients and physics with the new kick
      io.sockets.in('room1').emit('updateKick', kick);
      physics.send(new Message('kick', kick));
    });

    // Handle a character having been kicked
    socket.on('kicked', (data) => {
      charList[data.hash].kicked = data.kicked;
      physics.send(new Message('charList', charList));
    });

    // Handle a user disconnecting
    socket.on('disconnect', () => {
      // Send the info of the character leaving to the clients
      io.sockets.in('room1').emit('left', charList[socket.hash]);

      // Remove the character from the list
      delete charList[socket.hash];

      // Send the updated list to physics
      physics.send(new Message('charList', charList));

      // Remove the socket that disconnected
      socket.leave('room1');
    });
  });
};

module.exports.setupSockets = setupSockets;
