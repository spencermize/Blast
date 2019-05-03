import Phaser from "phaser";
import dudeImg from "./assets/dude1.png";
import skyImg from "./assets/background.png";
import groundImg from "./assets/platform.png";
import starImg from "./assets/star.png";
import bombImg from "./assets/bomb.png";
import tridentImg from "./assets/trident.png";

var game;
var scene;
var player;
var stars;
var platforms;
var cursors;
var bombs;
var tridents;
var gameOver;
var score = 0;
var scoreText;
var maxTridents = 3;
var level = 1;
var levelText;
var highScoreText;
var localStore = 'blast';
var highScore = localStorage.getItem(localStore) == null ? 0 : localStorage.getItem(localStore);
const spriteWidth = 13;
const spriteHeight = 21;

var build = function(){
    var config = {
        type: Phaser.AUTO,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 400 },
                debug: false
            }
        },
        scene: {
            preload: preload,
            create: create,
            update: update
        },
        scale: {
            mode: Phaser.Scale.FIT,
            width: 800,
            height: 600
        }
    };

    game = new Phaser.Game(config);

    game.pause = function(){
        scene.physics.pause(); 
    }

    game.levelUp = function() {
        level++;
        levelText.setText(`Level: ${level}`);
        game.addScore(100);
    
        scene.time.delayedCall(1000, function () { game.dropBombs(level * 10); }, [], scene);
     }

    game.shoot = function(vel, angle) {
        if (tridents.children.entries.length < maxTridents) {
            var trident = tridents.create(player.x, player.y, 'trident');
            trident.setCollideWorldBounds(true);
            trident.setDrag(600, 0);
            scene.time.delayedCall(500, function () {
                trident.isCollectible = true;
            })
            trident.setVelocityX(vel);
            trident.angle = angle;
        }
    }
     
    game.dropBombs = function(qty) {
        for (var i = 1; i < qty; i++) {
            var bomb = bombs.create(Phaser.Math.Between(0, 800), 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        }
    }    
    game.addScore = function(num) {
        score += num;
        scoreText.setText(`Score: ${score}`);
    }

    game.collectStar = function(player, star) {
        star.disableBody(true, true);
        game.addScore(10);
    
        if (stars.countActive(true) === 0) {
            //  A new batch of stars to collect
            game.levelUp();
            stars.children.iterate(function (child) {
                child.enableBody(true, child.x, 0, true, true);
            });
        }
    }
    
    game.collectAllStars = function(player) {
        stars.children.iterate(function (child) {
            collectStar(player, child);
        });
    }
    
    game.collectTrident = function(player, trident) {
        if (!trident.body.isMoving && trident.isCollectible) {
            trident.destroy();
        }
    }

    game.hitBomb = function(player, bomb) {
        game.pause();
        player.anims.play('dead');
        gameOver = true;
    }
    
    game.destroyBomb = function(trident, bomb) {
        bomb.destroy();
        trident.destroy();
        game.addScore(2);
    }
    
    game.updateHighScore = function() {
        highScore = Math.max(score, highScore);
        localStorage.setItem(localStore, highScore);
        highScoreText.setText(`High: ${highScore}`);
    }     
    function preload() {
        this.load.image('sky', skyImg);
        this.load.image('ground', groundImg);
        this.load.image('star', starImg);
        this.load.image('bomb', bombImg);
        this.load.image('trident', tridentImg);
        this.load.spritesheet('dude', dudeImg, { frameWidth: 64, frameHeight: 64 });

        cursors = this.input.keyboard.createCursorKeys();
    }

    function create() {
        scene = this;
        this.add.image(400, 300, 'sky');

        platforms = this.physics.add.staticGroup();
        platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        for (var i = 0; i < 3; i++) {

            platforms.create(Phaser.Math.Between(400, 550), 400, 'ground');
            platforms.create(Phaser.Math.Between(0, 200), 250, 'ground');
            platforms.create(Phaser.Math.Between(650, 800), 220, 'ground');
        }

        player = this.physics.add.sprite(100, 450, 'dude');
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 9 * spriteWidth, end: 9 * spriteWidth + 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: this.anims.generateFrameNumbers('dude', { start: 13 * spriteWidth, end: 13 * spriteWidth + 5 }),
            yoyo: true,
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 11 * spriteWidth, end: 11 * spriteWidth + 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'dead',
            frames: this.anims.generateFrameNumbers('dude', { start: 20 * spriteWidth, end: 20 * spriteWidth + 5 }),
            frameRate: 10,
            repeat: -1
        });

        player.setBounce(0.2);
        player.setCollideWorldBounds(true);

        stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });

        stars.children.iterate(function (child) {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });

        bombs = this.physics.add.group();
        tridents = this.physics.add.group();

        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
        highScoreText = this.add.text(325, 16, `High: ${highScore}`, { fontSize: '32px', fill: '#000' });
        levelText = this.add.text(600, 16, 'Level: 1', { fontSize: '32px', fill: '#000' });

        this.physics.add.collider(player, platforms);
        this.physics.add.collider(stars, platforms);
        this.physics.add.collider(bombs, platforms);
        this.physics.add.collider(tridents, platforms);
        this.physics.add.collider(tridents, bombs, game.destroyBomb, null, this);
        this.physics.add.collider(player, bombs, game.hitBomb, null, this);

        this.physics.add.overlap(player, tridents, game.collectTrident, null, this);
        this.physics.add.overlap(player, stars, game.collectStar, null, this);

        this.qKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);

        document.dispatchEvent(new Event('gamestart'));

        game.dropBombs(5);
    }
    function update() {
        if (gameOver) {
            game.updateHighScore();
            var rand = Phaser.Display.Color.RandomRGB();
            player.setTint(rgbToHex([rand.r, rand.g, rand.b]));

            scene.time.delayedCall(1000, function () {
                gameOver = false;
                this.scene.restart();
            },[],this);
        } else {
            if (cursors.down.isDown && this.input.keyboard.checkDown(this.qKey, 250)) {
                game.dropBombs(20);
            }
            if (cursors.left.isDown) {
                Blast.goLeft();
            }
            else if (cursors.right.isDown) {
                Blast.goRight();
            }
            else {
                Blast.chill();
            }

            if (this.input.keyboard.checkDown(cursors.space, 250)) {
                if (cursors.right.isDown) {
                    Blast.shootRight();
                } else {
                    Blast.shootLeft();
                }
            }

            if (cursors.up.isDown && player.body.touching.down) {
                Blast.jump();
            }
        }
    }
}
function rgbToHex(rgb) {
    var str = "0x";
    for (var i = 0; i < rgb.length; i++) {
        var hex = Number(rgb[i]).toString(16);
        if (hex.length < 2) {
            hex = "0" + hex;
        }
        str += hex;
    }

    return str;
}

var Blast = {
    build,
    shootRight: function() {
        game.shoot(800, 180);
    },    
    shootLeft: function() {
        game.shoot(-800, 0);
    },
    goRight: function() {
        player.setVelocityX(220);
        player.anims.play('right', true);
    },
    goLeft: function() {
        player.setVelocityX(-220);
        player.anims.play('left', true);
    },    
    jump: function() {
        player.setVelocityY(-400);
    },
    chill: function() {
        player.setVelocityX(0);
        if (player.anims.getCurrentKey() !== 'turn') {
            player.anims.play('turn');
        }
    }   
}

Blast.build();
export { Blast };