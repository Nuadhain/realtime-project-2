// Update the character's data from the server
const update = (data) => {
    // Check if the character exists and if not then add to the list
    if(!characters[data.hash]) {
        characters[data.hash] = data;
        return;
    }
    
    // Check if the data recieved is the user's data
    if(data.hash === hash) {
        return;
    }
    
    // Check if the current data is more recent than the incoming data
    if(characters[data.hash].lastUpdate >= data.lastUpdate) {
        return;
    }
    
    // Update the character's data
    const character = characters[data.hash];
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
const removeUser = (data) => {
    if(characters[data.hash]) {
        delete characters[data.hash];
    }
};

// Set the character's initial data
const setUser = (data) => {
    hash = data.hash;
    characters[hash] = data;
    requestAnimationFrame(redraw);
};

// Receive kick data and add it to the list of kicks
const receiveKick = (data) => {
    kicks.push(data);
};

// Send a character's kick to the server
const sendKick = () => {
    const character = characters[hash];
    
    // Create the kick object
    const kick = {
        hash: hash,
        x: character.x,
        y: (character.y + character.height - 10),
        direction: character.direction,
        frames: 0,
    }
    
    // Send it to the server
    socket.emit('kick', kick);
};

// Handle a character getting their shins kicked
const playerDeath = (data) => {
    console.log('Called');
    characters[data].kicked = true;
    
    // Notify the server that the character has been kicked
    socket.emit('kicked', characters[data]);
};

// Update a character's position
const updatePosition = () => {
    const character = characters[hash];
    
    // Set the character's previous known position
    character.prevX = character.x;
    character.prevY = character.y;
    
    // Set the character's destination based on what direction they are going in
    if(character.moveLeft && character.destX > 0) {
        character.destX -= 4;
    }
    if(character.moveRight && character.destX < canvas.width) {
        character.destX += 4;
    }
    
    // Check if the character is on the ground and jumping
    if(character.jump && character.destY > 0 && (character.destY >= 580 - character.height)) {
        // If they are then have them jump
        character.destY -= 200;
        character.jump = false;
    }
    // Apply gravity to the character
    if(character.destY < 580 - character.height) {
        character.destY += 5;
    }
    
    // Set the sprite to animate and the direction of the character's movement
    if(character.moveLeft) {
        character.sprite = sprites.MOVE;
        character.direction = directions.LEFT;
    }
    if(character.moveRight) {
        character.sprite = sprites.MOVE;
        character.direction = directions.RIGHT;
    }
    
    character.alpha = 0.05;
    
    // Send the updated movement data to the server
    socket.emit('updateMovement', character);
};