'use strict';

// Objects for holding the directions of movement and the sizes of sprites
var directions = {
    LEFT: 0,
    RIGHT: 1
};
var spriteSize = {
    WIDTH: 45,
    HEIGHT: 64
};
var kickSize = {
    WIDTH: 10,
    HEIGHT: 10
};

// Method for lerping movement
var lerp = function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
};

// Redraw Method
var redraw = function redraw(time) {
    // Update the positions of the characters
    updatePosition();
    // Clear the canvas for redrawing
    ctx.clearRect(0, 0, 1000, 580);

    // Get the hash codes for the characters
    var keys = Object.keys(characters);

    // Loop through all the current characters
    for (var i = 0; i < keys.length; i++) {
        var character = characters[keys[i]];

        // Set the alpha of the character
        if (character.alpha < 1) {
            character.alpha += 0.05;
        }

        // Get the lerped position of the character and apply it
        character.x = lerp(character.prevX, character.destX, character.alpha);
        character.y = lerp(character.prevY, character.destY, character.alpha);

        // Animate the Character sprite
        if (character.frame > 0 || character.moveLeft || character.moveRight) {
            character.frameCount++;

            if (character.frameCount % 3 === 0) {
                if (character.frame < 2) {
                    character.frame++;
                } else {
                    character.frame = 0;
                }
            }
        }

        // Check if the player has been kicked
        // If not kicked then draw as normal
        // If Kicked then display them as the kicked sprite
        if (!character.kicked) {
            ctx.drawImage(shinkicker, spriteSize.WIDTH * character.frame, spriteSize.HEIGHT * character.sprite, spriteSize.WIDTH, spriteSize.HEIGHT, character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);
        } else {
            ctx.drawImage(kicked, character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);

            // Display a message to notify the player that they have been kicked if it's the current user
            if (character.hash === hash) {
                ctx.fillStyle = 'black';
                ctx.font = '50px sans-serif';
                ctx.fillText('You have been kicked', canvas.width / 3, canvas.height / 2);
            }
        }
        // Outline the client's player so they know which one is them
        if (character.hash === hash) {
            ctx.strokeRect(character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);
        }
    }

    // Go through all the instances of a kick
    for (var _i = 0; _i < kicks.length; _i++) {
        var kick = kicks[_i];

        // Draw the kick based on what direction it's going
        if (kick.direction === directions.LEFT) {
            ctx.drawImage(kickImageLeft, kick.x, kick.y, kickSize.WIDTH, kickSize.HEIGHT);
        } else {
            ctx.drawImage(kickImageRight, kick.x, kick.y, kickSize.WIDTH, kickSize.HEIGHT);
        }

        // Increment the frame count
        kick.frames++;

        // If the frame count hits the max then stop the kick and stop the player's kick animation
        if (kick.frames > 8) {
            kicks.splice(_i);
            characters[kick.hash].sprite = 0;
            _i--;
        }
    }

    animationFrame = requestAnimationFrame(redraw);
};
'use strict';

// Variables
var canvas = void 0;
var ctx = void 0;
var shinkicker = void 0;
var kicked = void 0;
var kickImageLeft = void 0;
var kickImageRight = void 0;
var socket = void 0;
var hash = void 0;
var animationFrame = void 0;
// Objects
var characters = {};
var kicks = [];
var sprites = {
    MOVE: 0,
    KICKRIGHT: 1,
    KICKLEFT: 2
};

// Check for key down events
var keyDownHandler = function keyDownHandler(e) {
    var keyPressed = e.which;
    var character = characters[hash];
    e.preventDefault();

    // Set the direction of movement based on the key pressed
    if (keyPressed === 37 && !character.kicked) {
        character.moveLeft = true;
    } else if (keyPressed === 39 && !character.kicked) {
        character.moveRight = true;
    }
};
// Check for key up evenets
var keyUpHandler = function keyUpHandler(e) {
    var keyPressed = e.which;
    var character = characters[hash];

    // Stop movement
    if (keyPressed === 37 && !character.kicked) {
        character.moveLeft = false;
    } else if (keyPressed === 39 && !character.kicked) {
        character.moveRight = false;
    }

    // Set the character to jumping when space is pressed
    if (keyPressed === 32 && !character.kicked) {
        character.jump = true;
    }
    // Set the character to kicking when X is pressed
    if (keyPressed === 88 && !character.kicked) {
        // Set which direction the kick is in so the sprite kicks the right way
        if (character.direction === 0) {
            character.sprite = sprites.KICKLEFT;
        } else {
            character.sprite = sprites.KICKRIGHT;
        }
        sendKick();
    }
};

// Initialize the client
var init = function init() {
    // Get and set the sprites
    shinkicker = document.querySelector('#shinkicker');
    kicked = document.querySelector('#kicked');
    kickImageRight = document.querySelector('#kickright');
    kickImageLeft = document.querySelector('#kickleft');

    // Initialize the canvas
    canvas = document.querySelector('#cav');
    ctx = canvas.getContext('2d');

    // Set socket events
    socket = io.connect();

    socket.on('joined', setUser);
    socket.on('updatedMovement', update);
    socket.on('kickHit', playerDeath);
    socket.on('updateKick', receiveKick);
    socket.on('left', removeUser);

    // Set keypress events
    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

// Update the character's data from the server
var update = function update(data) {
    // Check if the character exists and if not then add to the list
    if (!characters[data.hash]) {
        characters[data.hash] = data;
        return;
    }

    // Check if the data recieved is the user's data
    if (data.hash === hash) {
        return;
    }

    // Check if the current data is more recent than the incoming data
    if (characters[data.hash].lastUpdate >= data.lastUpdate) {
        return;
    }

    // Update the character's data
    var character = characters[data.hash];
    character.prevX = data.prevX;
    character.prevY = data.prevY;
    character.destX = data.destX;
    character.destY = data.destY;
    character.direction = data.direction;
    character.sprite = data.sprite;
    character.moveLeft = data.moveLeft;
    character.moveRight = data.moveRight;
    character.jump = data.jump;
    character.alpha = 0.05;
};

// Remove a user from the list
var removeUser = function removeUser(data) {
    if (characters[data.hash]) {
        delete characters[data.hash];
    }
};

// Set the character's initial data
var setUser = function setUser(data) {
    hash = data.hash;
    characters[hash] = data;
    requestAnimationFrame(redraw);
};

// Receive kick data and add it to the list of kicks
var receiveKick = function receiveKick(data) {
    kicks.push(data);
};

// Send a character's kick to the server
var sendKick = function sendKick() {
    var character = characters[hash];

    // Create the kick object
    var kick = {
        hash: hash,
        x: character.x,
        y: character.y + character.height - 10,
        direction: character.direction,
        frames: 0

        // Send it to the server
    };socket.emit('kick', kick);
};

// Handle a character getting their shins kicked
var playerDeath = function playerDeath(data) {
    console.log('Called');
    characters[data].kicked = true;

    // Notify the server that the character has been kicked
    socket.emit('kicked', characters[data]);
};

// Update a character's position
var updatePosition = function updatePosition() {
    var character = characters[hash];

    // Set the character's previous known position
    character.prevX = character.x;
    character.prevY = character.y;

    // Set the character's destination based on what direction they are going in
    if (character.moveLeft && character.destX > 0) {
        character.destX -= 4;
    }
    if (character.moveRight && character.destX < canvas.width) {
        character.destX += 4;
    }

    // Check if the character is on the ground and jumping
    if (character.jump && character.destY > 0 && character.destY >= 580 - character.height) {
        // If they are then have them jump
        character.destY -= 200;
        character.jump = false;
    }
    // Apply gravity to the character
    if (character.destY < 580 - character.height) {
        character.destY += 5;
    }

    // Set the sprite to animate and the direction of the character's movement
    if (character.moveLeft) {
        character.sprite = sprites.MOVE;
        character.direction = directions.LEFT;
    }
    if (character.moveRight) {
        character.sprite = sprites.MOVE;
        character.direction = directions.RIGHT;
    }

    character.alpha = 0.05;

    // Send the updated movement data to the server
    socket.emit('updateMovement', character);
};
