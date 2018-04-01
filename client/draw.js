// Objects for holding the directions of movement and the sizes of sprites
const directions = {
    LEFT: 0,
    RIGHT: 1,
};
const spriteSize = {
    WIDTH: 45,
    HEIGHT: 64,
};
const kickSize = {
    WIDTH: 10,
    HEIGHT: 10,
};

// Method for lerping movement
const lerp = (v0, v1, alpha) => {
    return (1 - alpha) * v0 + alpha * v1;
};

// Redraw Method
const redraw = (time) => {
    // Update the positions of the characters
    updatePosition();
    // Clear the canvas for redrawing
    ctx.clearRect(0, 0, 1000, 580);
    
    // Get the hash codes for the characters
    const keys = Object.keys(characters);
    
    // Loop through all the current characters
    for(let i = 0; i < keys.length; i++) {
        const character = characters[keys[i]];
        
        // Set the alpha of the character
        if(character.alpha < 1) {
            character.alpha += 0.05;
        }
        
        // Get the lerped position of the character and apply it
        character.x = lerp(character.prevX, character.destX, character.alpha);
        character.y = lerp(character.prevY, character.destY, character.alpha);
        
        // Animate the Character sprite
        if(character.frame > 0 || (character.moveLeft || character.moveRight)) {
            character.frameCount++;
            
            if(character.frameCount % 3 === 0) {
                if(character.frame < 2) {
                    character.frame++;
                }
                else {
                    character.frame = 0;
                }
            }
        }
        
        // Check if the player has been kicked
        // If not kicked then draw as normal
        // If Kicked then display them as the kicked sprite
        if(!character.kicked) {
            ctx.drawImage(
                shinkicker,
                spriteSize.WIDTH * character.frame,
                spriteSize.HEIGHT * character.sprite,
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
                character.x,
                character.y,
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
            );
        }
        else {
            ctx.drawImage(
                kicked,
                character.x,
                character.y,
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
            );
            
            // Display a message to notify the player that they have been kicked if it's the current user
            if(character.hash === hash) {
                ctx.fillStyle = 'black';
                ctx.font = '50px sans-serif';
                ctx.fillText('You have been kicked', canvas.width / 3, canvas.height / 2);
            }
        }
        // Outline the client's player so they know which one is them
        if(character.hash === hash) {
            ctx.strokeRect(character.x, character.y, spriteSize.WIDTH, spriteSize.HEIGHT);
        }
    }
    
    // Go through all the instances of a kick
    for(let i = 0; i < kicks.length; i++) {
        const kick = kicks[i];
        
        // Draw the kick based on what direction it's going
        if(kick.direction === directions.LEFT) {
            ctx.drawImage(
                kickImageLeft,
                kick.x,
                kick.y,
                kickSize.WIDTH,
                kickSize.HEIGHT,
            );
        } else {
            ctx.drawImage(
                kickImageRight,
                kick.x,
                kick.y,
                kickSize.WIDTH,
                kickSize.HEIGHT,
            );
        }
        
        // Increment the frame count
        kick.frames++;
        
        // If the frame count hits the max then stop the kick and stop the player's kick animation
        if(kick.frames > 8) {
            kicks.splice(i);
            characters[kick.hash].sprite = 0;
            i--;
        }
    }
    
    animationFrame = requestAnimationFrame(redraw);
};