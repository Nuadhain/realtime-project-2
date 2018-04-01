const Message = require('./messages/Message.js');

// Lists of characters and kicks
let charList = {};
const kicks = [];

// Check to see if two objects are colliding with eachother
const checkCollisions = (rect1, rect2, width, height) => {
  if (rect1.x < rect2.x + width
      && rect1.x + width > rect2.x
      && rect1.y < rect2.y + height
      && height + rect1.y > rect2.y) {
    return true;
  }
  return false;
};

// Check to see if a kick is colliding with another character
const checkKickCollision = (character, kickObj) => {
  const kick = kickObj;

  // If the kick has the same has as the character then the collision is ignored
  if (character.hash === kick.hash) {
    return false;
  }

  // Send the kick and the character to the collision method to be checked
  return checkCollisions(character, kick, 45, 64);
};

// Run through all the kicks to see if they collide with any characters
const checkKicks = () => {
  if (kicks.length > 0) {
    // Characters in the room
    const keys = Object.keys(charList);
    const characters = charList;

    for (let i = 0; i < kicks.length; i++) {
      for (let k = 0; k < keys.length; k++) {
        const char1 = characters[keys[k]];

        // Check if the current kick is colliding with the current character
        const hit = checkKickCollision(char1, kicks[i]);

        // If they are then send a message saying so and set the character to kicked
        if (hit) {
          process.send(new Message('kickHit', char1.hash));
          charList[char1.hash].kicked = true;
        }
      }
      // Remove the kick once it has been resolved
      kicks.splice(i);
      i--;
    }
  }
};

// Set the check for kicks to be looped every 20ms
setInterval(() => {
  checkKicks();
}, 20);

// Process for handling incoming messages
process.on('message', (msg) => {
  switch (msg.type) {
    case 'charList': {
      // If the message is a character list populate the character list
      charList = msg.data;
      break;
    }
    case 'char': {
      // If the message is a single character add them to the list
      const character = msg.data;
      charList[character.hash] = character;
      break;
    }
    case 'kick': {
      // If the message is a kick then add it to the list of kicks
      kicks.push(msg.data);
      break;
    }
    default: {
      // Otherwise the message is not valid
      console.log('Invalid MSG');
      break;
    }
  }
});
