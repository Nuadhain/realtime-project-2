const directions = {
    LEFT: 0,
    RIGHT: 0,
};

const spriteSize = {
    WIDTH: 34,
    HEIGHT: 64,
};

const lerp = (v0, v1, alpha) => {
    return (1 - alpha) * v0 + alpha * v1;
};

const redraw = (time) => {
    updatePosition();
    
    ctx.clearRect(0, 0, 750, 580);
    
    const keys = Object.keys(characters);
    
    for(let i = 0; i < keys.length; i++) {
        const character = characters[keys[i]];
        
        if(character.alpha < 1) {
            character.alpha += 0.05;
        }
        
        if(character.hash === hash) {
            ctx.filter = "none";
        }
        else {
            ctx.filter = "hue-rotate(40deg)";
        }
        
        character.x = lerp(character.prevX, character.destX, character.alpha);
        character.y = lerp(character.prevY, character.destY, character.alpha);
        
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
        
        if(!character.kicked) {
            ctx.drawImage(
                shinkicker,
                spriteSize.WIDTH * character.frame,
                spriteSize.HEIGHT * character.direction,
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
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
                character.x,
                character.y,
                spriteSize.WIDTH,
                spriteSize.HEIGHT,
            );
        }
    }
    
    for(let i = 0; i < kicks.length; i++) {
        const kick = kicks[i];
        
        ctx.fillStyle = "red";
        ctx.fillRect(kick.x, kick.y, kick.width, kick.height);
        
        kick.frames++;
        
        if(kick.frames > 8) {
            kicks.splice(i);
            i--;
        }
    }
    
    animationFrame = requestAnimationFrame(redraw);
};