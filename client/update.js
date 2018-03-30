const update = (data) => {
    if(!characters[data.hash]) {
        characters[data.hash] = data;
        return;
    }
    
    if(data.hash === hash) {
        return;
    }
    
    if(characters[data.hash].lastUpdate >= data.lastUpdate) {
        return;
    }
    
    const character = characters[data.hash];
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

const removeUser = (data) => {
    if(characters[data.hash]) {
        delete characters[data.hash];
    }
};

const setUser = (data) => {
    hash = data.hash;
    characters[hash] = data;
    console.log(characters[hash].hash + " has connected to " + characters[hash].room);
    requestAnimationFrame(redraw);
};

const receiveKick = (data) => {
    kicks.push(data);
};

const sendKick = () => {
    const character = characters[hash];
    
    const kick = {
        hash: hash,
        x: character.x,
        y: character.y,
        direction: character.direction,
        frames: 0,
    }
    
    socket.emit('kick', kick);
};

const playerDeath = (data) => {
    characters[data].kicked = true;
    
    if(data === hash) {
        ctx.fillStyle = 'black';
        ctx.font = '50px sans-serif';
        ctx.fillText('You have been kicked', canvas.width / 2, canvas.height / 2);
    }
};

const updatePosition = () => {
    const character = characters[hash];
    
    character.prevX = character.x;
    character.prevY = character.y;
    
    if(character.moveLeft && character.destX > 0) {
        character.destX -= 3;
    }
    if(character.moveRight && character.destX < canvas.width) {
        character.destX += 3;
    }
    if(character.jump && character.destY > 0 && (character.destY >= 580 - character.height)) {
        character.destY -= 200;
        character.jump = false;
    }
    if(character.destY < 580 - character.height) {
        character.destY += 5;
    }
    
    if(character.moveLeft) {
        character.direction = directions.LEFT;
    }
    if(character.moveRight) {
        character.direction = directions.RIGHT;
    }
    
    character.alpha = 0.05;
    
    socket.emit('movementUpdate', character);
};