let canvas;
let ctx;
let shinkicker;
let kicked;
let socket;
let hash;
let animationFrame;

let characters = {};
let kicks = [];

const keyDownHandler = (e) => {
    var keyPressed = e.which;
    const character = characters[hash];
    
    if(keyPressed === 37 && !character.kicked) {
        character.moveLeft = true;
    }
    else if(keyPressed === 39 && !character.kicked) {
        character.moveRight = true;
    }
    
    if(keyPressed === 32 && !character.kicked) {
        character.jump = true;
    }
};

const keyUpHandler = (e) => {
    var keyPressed = e.which;
    const character = characters[hash];
    
    if(keyPressed === 37 && !character.kicked) {
        character.moveLeft = false;
    }
    else if(keyPressed === 39 && !character.kicked) {
        character.moveRight = false;
    }
    
    if(keyPressed === 32 && !character.kicked) {
        character.jump = false;
    }
    
    if(keyPressed === 88 && !character.kicked) {
        sendKick();
    }
};

const init = () => {
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
    
    document.body.addEventListener('keydown', keyDownHandler);
    document.body.addEventListener('keyup', keyUpHandler);
};

window.onload = init;