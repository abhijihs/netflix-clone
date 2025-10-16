// Game state
let canvas, ctx;
let player, coins = [], enemies = [];
let score = 0, health = 100, time = 0, coinsCollected = 0;
let gameActive = false;
let keys = {};
let gameStartTime;
let lastTime = 0;

// Game configuration
const GAME_CONFIG = {
    playerSpeed: 6,
    enemySpeed: 1.2,
    coinCount: 15,
    enemyCount: 3,
    enemyDamage: 5,
    enemyAttackCooldown: 2000,
    canvasWidth: 800,
    canvasHeight: 600,
    enemySpawnMinDistance: 200,
    enemySpawnMaxDistance: 300,
    enemySpawnPadding: 50
};

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const endScreen = document.getElementById('endScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const homeButton = document.getElementById('homeButton');
const scoreDisplay = document.getElementById('scoreDisplay');
const healthDisplay = document.getElementById('healthDisplay');
const timeDisplay = document.getElementById('timeDisplay');

// Event Listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
homeButton.addEventListener('click', showStartScreen);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Initialize canvas
function initCanvas() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    canvas.width = GAME_CONFIG.canvasWidth;
    canvas.height = GAME_CONFIG.canvasHeight;
}

// Player class
class Player {
    constructor() {
        this.x = GAME_CONFIG.canvasWidth / 2;
        this.y = GAME_CONFIG.canvasHeight / 2;
        this.width = 30;
        this.height = 40;
        this.color = '#16c172';
    }

    draw() {
        // Draw body
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height/2 - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.x - 5, this.y - this.height/2 - 10, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 5, this.y - this.height/2 - 10, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#0f8a5f';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height/2 - 10, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    update() {
        // Movement
        if (keys['w'] || keys['arrowup']) this.y -= GAME_CONFIG.playerSpeed;
        if (keys['s'] || keys['arrowdown']) this.y += GAME_CONFIG.playerSpeed;
        if (keys['a'] || keys['arrowleft']) this.x -= GAME_CONFIG.playerSpeed;
        if (keys['d'] || keys['arrowright']) this.x += GAME_CONFIG.playerSpeed;

        // Keep within bounds
        this.x = Math.max(this.width/2, Math.min(GAME_CONFIG.canvasWidth - this.width/2, this.x));
        this.y = Math.max(this.height/2 + 15, Math.min(GAME_CONFIG.canvasHeight - this.height/2, this.y));
    }
}

// Coin class
class Coin {
    constructor() {
        this.x = Math.random() * (GAME_CONFIG.canvasWidth - 60) + 30;
        this.y = Math.random() * (GAME_CONFIG.canvasHeight - 60) + 30;
        this.radius = 15;
        this.rotation = 0;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw coin
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw coin shine
        ctx.fillStyle = '#ffed4e';
        ctx.beginPath();
        ctx.ellipse(-5, -3, 5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.radius, this.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }

    update() {
        this.rotation += 0.05;
    }

    collidesWith(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + player.width/2;
    }
}

// Enemy class
class Enemy {
    constructor() {
        // Spawn enemies away from center
        const angle = Math.random() * Math.PI * 2;
        const distance = GAME_CONFIG.enemySpawnMinDistance + Math.random() * (GAME_CONFIG.enemySpawnMaxDistance - GAME_CONFIG.enemySpawnMinDistance);
        this.x = GAME_CONFIG.canvasWidth / 2 + Math.cos(angle) * distance;
        this.y = GAME_CONFIG.canvasHeight / 2 + Math.sin(angle) * distance;
        
        // Keep within bounds
        this.x = Math.max(GAME_CONFIG.enemySpawnPadding, Math.min(GAME_CONFIG.canvasWidth - GAME_CONFIG.enemySpawnPadding, this.x));
        this.y = Math.max(GAME_CONFIG.enemySpawnPadding, Math.min(GAME_CONFIG.canvasHeight - GAME_CONFIG.enemySpawnPadding, this.y));
        
        this.width = 30;
        this.height = 40;
        this.color = '#ff0000';
        this.lastAttackTime = 0;
        this.animOffset = Math.random() * Math.PI * 2;
    }

    draw() {
        // Draw body with animation
        const wobble = Math.sin(Date.now() * 0.005 + this.animOffset) * 2;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.width/2 + wobble, this.y - this.height/2, this.width, this.height);
        
        // Draw head
        ctx.beginPath();
        ctx.arc(this.x + wobble, this.y - this.height/2 - 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw glowing eyes
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x - 5 + wobble, this.y - this.height/2 - 10, 4, 0, Math.PI * 2);
        ctx.arc(this.x + 5 + wobble, this.y - this.height/2 - 10, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw outline
        ctx.strokeStyle = '#990000';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - this.width/2 + wobble, this.y - this.height/2, this.width, this.height);
        ctx.beginPath();
        ctx.arc(this.x + wobble, this.y - this.height/2 - 10, 15, 0, Math.PI * 2);
        ctx.stroke();
    }

    update(player) {
        // Move toward player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.x += (dx / distance) * GAME_CONFIG.enemySpeed;
            this.y += (dy / distance) * GAME_CONFIG.enemySpeed;
        }
    }

    collidesWith(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (this.width + player.width) / 2;
    }
}

// Create game objects
function createPlayer() {
    player = new Player();
}

function createCoins() {
    coins = [];
    for (let i = 0; i < GAME_CONFIG.coinCount; i++) {
        coins.push(new Coin());
    }
}

function createEnemies() {
    enemies = [];
    for (let i = 0; i < GAME_CONFIG.enemyCount; i++) {
        enemies.push(new Enemy());
    }
}

// Start game
function startGame() {
    // Reset game state
    score = 0;
    health = 100;
    time = 0;
    coinsCollected = 0;
    gameActive = true;
    gameStartTime = Date.now();
    lastTime = Date.now();

    // Create game objects
    createPlayer();
    createCoins();
    createEnemies();

    // Update UI
    updateHUD();
    showGameScreen();

    // Start game loop
    gameLoop();
}

// Show screens
function showStartScreen() {
    startScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'none';
    gameActive = false;
}

function showGameScreen() {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    endScreen.style.display = 'none';
}

function showEndScreen() {
    startScreen.style.display = 'none';
    gameScreen.style.display = 'none';
    endScreen.style.display = 'flex';
    gameActive = false;

    // Update final stats
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalCoins').textContent = coinsCollected;
    document.getElementById('finalTime').textContent = time + 's';
}

// Update HUD
function updateHUD() {
    scoreDisplay.textContent = score;
    healthDisplay.textContent = Math.max(0, health);
    timeDisplay.textContent = time;
}

// Draw background
function drawBackground() {
    // Dark background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid pattern
    ctx.strokeStyle = '#0f3460';
    ctx.lineWidth = 1;
    const gridSize = 40;
    
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Check collisions
function checkCollisions() {
    const currentTime = Date.now();

    // Check coin collisions
    for (let i = coins.length - 1; i >= 0; i--) {
        if (coins[i].collidesWith(player)) {
            coins.splice(i, 1);
            score += 10;
            coinsCollected++;
            updateHUD();

            // Check if all coins collected
            if (coins.length === 0) {
                setTimeout(() => {
                    if (gameActive) {
                        showEndScreen();
                    }
                }, 100);
            }
        }
    }

    // Check enemy collisions
    enemies.forEach(enemy => {
        if (enemy.collidesWith(player) && currentTime - enemy.lastAttackTime > GAME_CONFIG.enemyAttackCooldown) {
            health -= GAME_CONFIG.enemyDamage;
            enemy.lastAttackTime = currentTime;
            updateHUD();

            // Flash effect
            enemy.color = '#ffff00';
            setTimeout(() => {
                enemy.color = '#ff0000';
            }, 100);

            // Check game over
            if (health <= 0) {
                setTimeout(() => {
                    if (gameActive) {
                        showEndScreen();
                    }
                }, 100);
            }
        }
    });
}

// Update game time
function updateTime() {
    time = Math.floor((Date.now() - gameStartTime) / 1000);
}

// Game loop
function gameLoop() {
    if (!gameActive) return;

    // Clear canvas and draw background
    drawBackground();

    // Update game objects
    player.update();
    coins.forEach(coin => coin.update());
    enemies.forEach(enemy => enemy.update(player));

    // Check collisions
    checkCollisions();

    // Draw game objects
    coins.forEach(coin => coin.draw());
    enemies.forEach(enemy => enemy.draw());
    player.draw();

    // Update time
    updateTime();
    updateHUD();

    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Initialize game on page load
window.addEventListener('load', () => {
    initCanvas();
});

