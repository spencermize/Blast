import Phaser from "phaser";
import logoImg from "./assets/logo.png";
import dudeImg from "./assets/dude1.png";
import skyImg from "./assets/background.png";
import groundImg from "./assets/platform.png";
import starImg from "./assets/star.png";
import bombImg from "./assets/bomb.png";
import tridentImg from "./assets/trident.png";

var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var logo;
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
const spriteWidth = 13;
const spriteHeight = 21;

var game = new Phaser.Game(config);

function preload() {
    this.load.image('logo', logoImg);
    this.load.image('sky', skyImg);
    this.load.image('ground', groundImg);
    this.load.image('star', starImg);
    this.load.image('bomb', bombImg);
    this.load.image('trident', tridentImg);
    this.load.spritesheet('dude', dudeImg, { frameWidth: 64, frameHeight: 64 });
}

function create() {
    this.add.image(400, 300, 'sky');

    platforms = this.physics.add.staticGroup();

    platforms.create(400, 568, 'ground').setScale(2).refreshBody();

    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    player = this.physics.add.sprite(100, 450, 'dude');

    player.setBounce(0.2);
    player.setCollideWorldBounds(true);

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

    cursors = this.input.keyboard.createCursorKeys();

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

    this.physics.add.collider(player, platforms);
    this.physics.add.collider(stars, platforms);
    this.physics.add.collider(bombs, platforms);
    this.physics.add.collider(tridents, platforms);
    this.physics.add.collider(tridents, bombs, destroyBomb, null, this);
    this.physics.add.collider(player, bombs, hitBomb, null, this);
    
    this.physics.add.overlap(player, tridents, collectTrident, null, this);
    this.physics.add.overlap(player, stars, collectStar, null, this);
  
    // logo = this.add.image(400, 300, 'logo');
    // var tween = this.tweens.add({
    //     targets: logo,
    //     alpha: 0,
    //     ease: 'Power1',
    //     duration: 1000,
    //     delay: 1000
    // });
}
function update() {
    if (gameOver) {
        return;
    }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);

        player.anims.play('left', true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(160);

        player.anims.play('right', true);
    }
    else {
        player.setVelocityX(0);
        if(player.anims.getCurrentKey() !== 'turn'){
            player.anims.play('turn');
        }     
    }

    if(this.input.keyboard.checkDown(cursors.space, 250)){
        if(tridents.children.entries.length < maxTridents){
            var trident = tridents.create(player.x, player.y, 'trident');
            trident.setCollideWorldBounds(true);
            trident.setDrag(500, 0);
            setTimeout(function(){
                trident.isCollectible = true;
            },2000);
            if(cursors.right.isDown){
                trident.setVelocityX(800);
                trident.angle = 180;
            }else{
                trident.setVelocityX(-800);
            }

        }

    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectStar(player, star) {
    star.disableBody(true, true);

    //  Add and update the score
    score += 10;
    scoreText.setText('Score: ' + score);

    if (stars.countActive(true) === 0) {
        //  A new batch of stars to collect
        stars.children.iterate(function (child) {

            child.enableBody(true, child.x, 0, true, true);

        });

        var x = (player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

        var bomb = bombs.create(x, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);

    }
}

function collectTrident(player, trident) {
    if(!trident.body.isMoving && trident.isCollectible){
        trident.destroy();  
    }
     
 }
function hitBomb(player, bomb) {
    this.physics.pause();

    player.setTint(0xff0000);

    player.anims.play('turn');

    gameOver = true;
}

function destroyBomb(trident, bomb){
    bomb.destroy();
    trident.destroy();
}