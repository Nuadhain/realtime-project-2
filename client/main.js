// Variables
let canvas;
let ctx;
let shinkicker;
let kicked;
let kickImageLeft;
let kickImageRight;
let socket;
let hash;
let animationFrame;
// Objects
let characters = {};
let kicks = [];
const sprites = {
    MOVE: 0,
    KICKRIGHT: 1,
    KICKLEFT: 2,
};

// Check for key down events
const keyDownHandler = (e) => {
    var keyPressed = e.which;
    const character = characters[hash];
    e.preventDefault();
    
    // Set the direction of movement based on the key pressed
    if(keyPressed === 37 && !character.kicked) {
        character.moveLeft = true;
    }
    else if(keyPressed === 39 && !character.kicked) {
        character.moveRight = true;
    }
};
// Check for key up evenets
const keyUpHandler = (e) => {
    var keyPressed = e.which;
    const character = characters[hash];
    
    // Stop movement
    if(keyPressed === 37 && !character.kicked) {
        character.moveLeft = false;
    }
    else if(keyPressed === 39 && !character.kicked) {
        character.moveRight = false;
    }
    
    // Set the character to jumping when space is pressed
    if(keyPressed === 32 && !character.kicked) {
        character.jump = true;
    }
    // Set the character to kicking when X is pressed
    if(keyPressed === 88 && !character.kicked) {
        // Set which direction the kick is in so the sprite kicks the right way
        if(character.direction === 0) {
            character.sprite = sprites.KICKLEFT;
        } else {
            character.sprite = sprites.KICKRIGHT;
        }
        sendKick();
    }
};

// Initialize the client
const init = () => {
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