"use strict";

var directions = {
    LEFT: 0,
    RIGHT: 0
};

var spriteSize = {
    WIDTH: 34,
    HEIGHT: 64
};

var lerp = function lerp(v0, v1, alpha) {
    return (1 - alpha) * v0 + alpha * v1;
};

var redraw = function redraw(time) {
    updatePosition();

    ctx.clearRect(0, 0, 1000, 580);

    var keys = Object.keys(characters);

    for (var i = 0; i < keys.length; i++) {
        var character = characters[keys[i]];

        if (character.alpha < 1) {
            character.alpha += 0.05;
        }

        if (character.hash === hash) {
            ctx.filter = "none";
        } else {
            ctx.filter = "hue-rotate(40deg)";
        }

        character.x = lerp(character.prevX, character.destX, character.alpha);
        character.y = lerp(character.prevY, character.destY, character.alpha);

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

        if (!character.kicked) {
            ctx.drawImage(shinkicker, spriteSize.WIDTH * character.frame, spriteSize.HEIGHT * character.direction, spriteSize.WIDTH, spriteSize.HEIGHT, character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);
        } else {
            ctx.drawImage(kicked, spriteSize.WIDTH, spriteSize.HEIGHT, spriteSize.WIDTH, spriteSize.HEIGHT, character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);
        }
    }

    for (var _i = 0; _i < kicks.length; _i++) {
        var kick = kicks[_i];

        ctx.fillStyle = "red";
        ctx.fillRect(kick.x, kick.y, kick.width, kick.height);

        kick.frames++;

        if (kick.frames > 8) {
            kicks.splice(_i);
            _i--;
        }
    }

    animationFrame = requestAnimationFrame(redraw);
};
'use strict';

var canvas = void 0;
var ctx = void 0;
var shinkicker = void 0;
var kicked = void 0;
var socket = void 0;
var hash = void 0;
var animationFrame = void 0;

var characters = {};
var kicks = [];

var keyDownHandler = function keyDownHandler(e) {
    var keyPressed = e.which;
    var character = characters[hash];

    if (keyPressed === 37 && !character.kicked) {
        character.moveLeft = true;
    } else if (keyPressed === 39 && !character.kicked) {
        character.moveRight = true;
    }
};

var keyUpHandler = function keyUpHandler(e) {
    var keyPressed = e.which;
    var character = characters[hash];

    if (keyPressed === 37 && !character.kicked) {
        character.moveLeft = false;
    } else if (keyPressed === 39 && !character.kicked) {
        character.moveRight = false;
    }

    if (keyPressed === 32 && !character.kicked) {
        character.jump = true;
    }

    if (keyPressed === 88 && !character.kicked) {
        sendKick();
    }
};

var isWorking = function isWorking(data) {
    console.log(data);
};

var init = function init() {
    shinkicker = document.querySelector('#shinkicker');
    kicked = document.querySelector('#kicked');

    canvas = document.querySelector('#cav');
    ctx = canvas.getContext('2d');

    socket = io.connect();

    socket.on('joined', setUser);
    socket.on('updatedMovement', update);
    socket.on('kickHit', playerDeath);
    socket.on('updateKick', receiveKick);
    socket.on('left', removeUser);
    socket.on('fuck', isWorking);

    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;
'use strict';

var update = function update(data) {
    if (!characters[data.hash]) {
        characters[data.hash] = data;
        return;
    }

    if (data.hash === hash) {
        return;
    }

    if (characters[data.hash].lastUpdate >= data.lastUpdate) {
        return;
    }

    var character = characters[data.hash];
    character.prevX = data.prevX;
    character.prevY = data.prevY;
    character.destX = data.destX;
    character.destY = data.destY;
    character.direction = data.direction;
    character.moveLeft = data.moveLeft;
    character.moveRight = data.moveRight;
    character.jump = data.jump;
    character.alpha = 0.05;
};

var removeUser = function removeUser(data) {
    if (characters[data.hash]) {
        delete characters[data.hash];
    }
};

var setUser = function setUser(data) {
    hash = data.hash;
    characters[hash] = data;
    console.log(characters[hash].hash + " has connected to " + characters[hash].room);
    requestAnimationFrame(redraw);
};

var receiveKick = function receiveKick(data) {
    kicks.push(data);
};

var sendKick = function sendKick() {
    var character = characters[hash];

    var kick = {
        hash: hash,
        x: character.x,
        y: character.y,
        direction: character.direction,
        frames: 0
    };

    socket.emit('kick', kick);
};

var playerDeath = function playerDeath(data) {
    characters[data].kicked = true;

    if (data === hash) {
        ctx.fillStyle = 'black';
        ctx.font = '50px sans-serif';
        ctx.fillText('You have been kicked', canvas.width / 2, canvas.height / 2);
    }
};

var updatePosition = function updatePosition() {
    var character = characters[hash];

    character.prevX = character.x;
    character.prevY = character.y;

    if (character.moveLeft && character.destX > 0) {
        character.destX -= 3;
    }
    if (character.moveRight && character.destX < canvas.width) {
        character.destX += 3;
    }
    if (character.jump && character.destY > 0 && character.destY >= 580 - character.height) {
        character.destY -= 200;
        character.jump = false;
    }
    if (character.destY < 580 - character.height) {
        character.destY += 5;
    }

    if (character.moveLeft) {
        character.direction = directions.LEFT;
    }
    if (character.moveRight) {
        character.direction = directions.RIGHT;
    }

    character.alpha = 0.05;

    socket.emit('movementUpdate', character);
};
