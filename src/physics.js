const Message = require('./messages/Message.js');

let charList = {};
const kicks = [];

const checkCollisions = (rect1, rect2) => {
  if (rect1.x < rect2.x + 34
      && rect1.x + 34 > rect2.x
      && rect1.y < rect2.y + 64
      && 64 + rect1.y > rect2.y) {
    return true;
  }
  return false;
};

const checkKicks = () => {
  if (kicks.length > 0) {
    // characters in the room
    const keys = Object.keys(charList);
    const characters = charList;

    for (let i = 0; i < kicks.length; i++) {
      for (let k = 0; k < keys.length; k++) {
        const char1 = characters[keys[k]];

        const hit = checkCollisions(char1, kicks[i]);

        if (hit) {
          process.send(new Message('kickHit', char1.hash));

          charList[char1.hash].kicked = true;
        }
      }
      kicks.splice(i);
      i--;
    }
  }
};

setInterval(() => {
  checkKicks();
}, 20);

process.on('message', (msg) => {
  switch (msg.type) {
    case 'charList': {
      charList = msg.data;
      break;
    }
    case 'char': {
      const character = msg.data;
      charList[character.hash] = character;
      break;
    }
    case 'kick': {
      kicks.push(msg.data);
      break;
    }
    default: {
      console.log('Invalid MSG');
    }
  }
});
