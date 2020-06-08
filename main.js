/* 
  ---------- Define some constants of component image ----------

  HRW here means the ratio of its height to its width
  This can help to keep the original shape of image
*/

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const BIRD_WIDTH = 50;
const BIRD_HEIGHT = 45;

const NUM_WIDTH = 24;
const NUM_HEIGHT = 36;

const PIPE_WIDTH = 80;
const PIPE_HRW = 320 / 52;

const BACKGROUND_WIDTH = CANVAS_WIDTH;
const BACKGROUND_HRW = 512 / 288;

const BASE_WIDTH = CANVAS_WIDTH;
const BASE_HRW = 112 / 336;
const BASE_SHOW_HEIGHT = 80;

const RESTART_WIDTH = 150;
const RESTART_HRW = 75 / 214;

var background_img = new Image();
var bird_down_img = new Image();
var bird_mid_img = new Image();
var bird_up_img = new Image();
var pipe_down_img = new Image();
var pipe_up_img = new Image();
var base_img = new Image();
var restart_img = new Image();

background_img.src = "./images/background.png";
bird_down_img.src = "./images/yellowbird-downflap.png";
bird_mid_img.src = "./images/yellowbird-midflap.png";
bird_up_img.src = "./images/yellowbird-upflap.png";
pipe_down_img.src = "./images/pipe-green-down.png";
pipe_up_img.src = "./images/pipe-green-up.png";
base_img.src = "./images/base.png";
restart_img.src = "./images/restart.png";

/* 
  ---------- Define component part ----------
  
  Component can be used as background / base / obstacles / cube(the bird) / score

  They have different refresh mode:
  1. looping:      base
  2. Non-looping:  background / obstacles / cube
  3. Specical:     score

  They have some methods:
  1. update:      draw it on the canvas
  2. moveLeft:    change its position to make it a bit left
  3. accelerate:  give it an upward speed, especically used for cube
  4. hitWith:     collision detection of cube and obstacles
  4. hitBottom:   check if the cube has got to the bottom
*/

function component(ctx, width, height, either, x, y, type) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.gravity = 0.3;    // This is used for imitating the gravity
  this.speedGravity = 0;
  this.direction = true; // This is used for making animation of the cube in the welcome page
  if (this.type == "score") {
    this.num = either;
  }
  if (this.type == "image" || this.type == "looping") {
    this.image = either;
  }

  this.update = function () {
    if (this.type == "score") {
      var numstr = "" + this.num;
      this.x = CANVAS_WIDTH / 2 - numstr.length * NUM_WIDTH / 2;
      for (var i = 0; i < numstr.length; i++) {
        var digit_img = new Image();
        digit_img.src = "./images/" + numstr[i] + ".png";
        ctx.drawImage(digit_img, this.x + i * this.width, this.y, this.width, this.height);
      }
    } else if (this.type == "image") {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else if (this.type == "looping") {
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
      ctx.drawImage(this.image, this.x + this.width, this.y, this.width, this.height);
    }
  };

  this.moveLeft = function () {
    this.x -= 3;
  };

  this.accelerate = function (n) {
    this.speedGravity = n;
  };

  this.hitWith = function (otherobj) {
    var myleft = this.x;
    var myright = this.x + this.width;
    var mytop = this.y;
    var mybottom = this.y + this.height;
    var otherleft = otherobj.x;
    var otherright = otherobj.x + otherobj.width;
    var othertop = otherobj.y;
    var otherbottom = otherobj.y + otherobj.height;
    if (mybottom < othertop || mytop > otherbottom || myleft > otherright || myright < otherleft) {
      // Check collision when the cube has got to a very top place(out of canvas)
      if (mybottom < 0 && myright >= otherleft && myright <= otherright) {
        return true;
      }
      return false;
    } else {
      return true;
    }
  };

  this.hitBottom = function (canvas) {
    if (this.y >= canvas.height - this.height - BASE_SHOW_HEIGHT) {
      this.y = canvas.height - this.height - BASE_SHOW_HEIGHT;
      return true;
    } else {
      return false;
    }
  };
}

/* 
  ---------- Define the game area ----------

  Include the methods of all needed component:
  1. Create components
  2. Update components
  3. Start and stop frame refreshing
*/

var myGameArea = {
  createCanvas: function () {
    this.canvas = document.getElementById("canvas");
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;
    this.context = this.canvas.getContext("2d");
  },

  createBackground: function () {
    this.background = new component(this.context, BACKGROUND_WIDTH, BACKGROUND_WIDTH * BACKGROUND_HRW, background_img, 0, -100, "image");
  },

  createCube: function () {
    this.cube = new component(this.context, BIRD_WIDTH, BIRD_HEIGHT, bird_mid_img, CANVAS_WIDTH / 2 - BIRD_WIDTH / 2, CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2, "image");
  },

  createObstacles: function () {
    this.obstacles = [];
  },

  createBase: function () {
    this.base = new component(this.context, BASE_WIDTH, BASE_WIDTH * BASE_HRW, base_img, 0, CANVAS_HEIGHT - BASE_SHOW_HEIGHT, "looping");
  },

  createScore: function () {
    this.count = 0;
    this.score = new component(this.context, NUM_WIDTH, NUM_HEIGHT, this.count, CANVAS_WIDTH / 2 - NUM_WIDTH / 2, 50, "score");
  },

  initTimer: function () {
    this.waitTimer = null;
    this.playTimer = null;
    this.flopTimer = null;
  },

  drawRestart: function () {
    // Draw the restart button on the canvas
    this.restart = new component(this.context, RESTART_WIDTH, RESTART_WIDTH * RESTART_HRW, restart_img, CANVAS_WIDTH / 2 - RESTART_WIDTH / 2, CANVAS_HEIGHT / 2 - RESTART_WIDTH * RESTART_HRW / 2, "image");
    this.restart.update();
    // When restart button is clicked, clear the canvas, init the components and then start the waiting page 
    document.removeEventListener(eventType, triggerWhenPlay);
    document.addEventListener(eventType, triggerWhenRestart);
  },

  clearCanvas: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  updateBackground: function () {
    // Directly redraw it
    this.background.update();
  },

  updateCube: function () {
    // First, redraw it
    this.cube.update();

    // Second, make some movements
    // Imitate the pull by the natural gravity, specific ammount is added to the y speed, y speed is added to the y coordinate
    this.cube.speedGravity += this.cube.gravity;
    this.cube.y += this.cube.speedGravity;
    // Imitate the flapping of bird, change different images in different clocks
    if ((this.frameno / 10) % 3 == 0) {
      this.cube.image = bird_down_img;
    } else if ((this.frameno / 10) % 3 == 1) {
      this.cube.image = bird_mid_img;
    } else if ((this.frameno / 10) % 3 == 2) {
      this.cube.image = bird_up_img;
    }
  },

  updateObstacles: function () {
    // First, append a new obstacle
    if (this.everyInterval(100)) {
      var x = this.canvas.width;
      // Height of the obstacle
      var minHeight = 180;
      var maxHeight = PIPE_WIDTH * PIPE_HRW - 220;
      var height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
      // Gap height of the obstacle
      var minGap = 150;
      var maxGap = 230;
      var gap = Math.floor(Math.random() * (maxGap - minGap + 1) + minGap);
      // Top part
      this.obstacles.push(new component(this.context, PIPE_WIDTH, PIPE_WIDTH * PIPE_HRW, pipe_up_img, x, height - PIPE_WIDTH * PIPE_HRW, "image"));
      // Bottom part
      this.obstacles.push(new component(this.context, PIPE_WIDTH, PIPE_WIDTH * PIPE_HRW, pipe_down_img, x, height + gap, "image"));
    }

    // Second, remove redundant obstacles as well as to count the goal ones
    var goalObstacles = this.obstacles.filter(item => {
      return item.x + item.width == this.cube.x;
    });
    var seenObstacles = this.obstacles.filter(item => {
      return item.x + item.width > 0;
    });
    this.count += goalObstacles.length / 2;
    this.obstacles = seenObstacles;

    // Third, redraw them
    this.obstacles.forEach(item => item.update());

    // Fourth, make some movements
    this.obstacles.forEach(item => item.moveLeft());
  },

  updateBase: function () {
    // First, redraw it
    this.base.update();
    // Second, make some movements
    this.base.moveLeft();
    if (this.base.x == -(this.base.width)) {
      this.base.x = 0;
    }
  },

  updateScore: function () {
    // Directly redraw it
    this.score.update();
    this.score.num = this.count;
  },

  // Waiting page, redraw background / base / cube, cube should move ups and downs
  updateWhenWait: function () {
    this.updateBackground();
    this.updateBase();
    this.cube.update();
    if (this.everyInterval(16)) {
      this.cube.direction = !this.cube.direction;
    }
    if (this.cube.direction) {
      this.cube.y++;
    } else {
      this.cube.y--;
    }
    myGameArea.frameno++;
  },

  // Flopping page, redraw beckground / obstacles / base / score / cube, cube should move down untill reaching the bottom
  updateWhenFlop: function () {
    this.background.update();
    this.obstacles.forEach(item => {
      item.update();
    });
    this.base.update();
    this.score.update();
    this.cube.update();
    this.cube.y += 10;
  },

  // Start refreshing of waiting
  startWaiting: function () {
    this.frameno = 0;
    if (!this.waitTimer) {
      this.waitTimer = setInterval(updateWait, 20);
    }
  },

  // Stop refreshing of waiting
  stopWaiting: function () {
    clearInterval(this.waitTimer);
  },

  // Start refreshing of playing
  startPlaying: function () {
    if (!this.playTimer) {
      this.playTimer = setInterval(updatePlay, 20);
    }
  },

  // Stop refreshing of playing
  stopPlaying: function () {
    clearInterval(this.playTimer);
  },

  // Start refreshing of flopping
  startFlopping: function () {
    if (!this.flopTimer) {
      this.flopTimer = setInterval(updateFlop, 20);
    }
  },

  // Stop refreshing of flopping
  stopFlopping: function () {
    clearInterval(this.flopTimer);
  },

  // Util to check every wanted interval
  everyInterval: function (n) {
    if ((this.frameno / n) % 1 == 0) {
      return true;
    }
    return false;
  }
};

/* 
  ---------- Define combination of update ----------

  Each frame we should update several stuffs
  For Convenience, let's just make some combinations of those which should be updated in specific progress
  1. Waiting progress
  2. Playing progress
  3. Flopping progress
*/

function updateWait() {
  // Check if it's in waiting progress in every update
  if (!waiting) {
    myGameArea.stopWaiting();
    document.removeEventListener(eventType, triggerWhenWait);
    document.addEventListener(eventType, triggerWhenPlay);
    myGameArea.startPlaying();
  }

  myGameArea.clearCanvas();
  myGameArea.updateWhenWait();
}

function updatePlay() {
  // Check hit in every update
  var final = false;
  for (var i = 0; i < myGameArea.obstacles.length; i++) {
    if (myGameArea.cube.hitWith(myGameArea.obstacles[i])) {
      myGameArea.stopPlaying();
      myGameArea.startFlopping();
    }
  }

  if (myGameArea.cube.hitBottom(myGameArea.canvas)) {
    myGameArea.stopPlaying();
    final = true;
  }

  myGameArea.clearCanvas();
  myGameArea.updateBackground();
  myGameArea.updateCube();
  myGameArea.updateObstacles();
  myGameArea.updateBase();
  myGameArea.updateScore();
  myGameArea.frameno++;

  if (final) {
    myGameArea.drawRestart();
  }
}

function updateFlop() {
  // Check hit in every update
  var final = false;
  if (myGameArea.cube.hitBottom(myGameArea.canvas)) {
    myGameArea.stopFlopping();
    final = true;
  }

  myGameArea.clearCanvas();
  myGameArea.updateWhenFlop();

  if (final) {
    myGameArea.drawRestart();
  }
}

/* 
  ---------- Define event function of click / touch ----------

  1. Waiting: click / touch means stop waiting & start playing & jump a bit
  2. Playing: click / touch means jump a bit
  3. Restarting: click / touch means start waiting
*/

function triggerWhenWait(e) {
  if (e.target == myGameArea.canvas) {
    waiting = !waiting;
    myGameArea.cube.accelerate(-8);
  }
}

function triggerWhenPlay(e) {
  if (e.target == myGameArea.canvas) {
    myGameArea.cube.accelerate(-8);
  }
}

function triggerWhenRestart(e) {
  var clickedX, clickedY;
  if (e.type == "click") {
    clickedX = e.pageX - myGameArea.canvas.offsetLeft;
    clickedY = e.pageY - myGameArea.canvas.offsetTop;
  } else if (e.type == "touchstart") {
    var touch = e.touches[0] || e.changedTouches[0];
    clickedX = touch.pageX - myGameArea.canvas.offsetLeft;
    clickedY = touch.pageY - myGameArea.canvas.offsetTop;
  }

  if (clickedX >= myGameArea.restart.x && clickedX <= myGameArea.restart.x + myGameArea.restart.width && clickedY >= myGameArea.restart.y && clickedY <= myGameArea.restart.y + myGameArea.restart.height) {
    myGameArea.clearCanvas();
    waiting = true;
    init();
    wait();
  }
}

/* 
  ---------- Define the behavior when loaded ----------

  First, init all components and timers
  Second, bind "start playing" action with click event and just wait
*/

function init() {
  myGameArea.createCanvas();
  myGameArea.createBackground();
  myGameArea.createCube();
  myGameArea.createObstacles();
  myGameArea.createBase();
  myGameArea.createScore();
  myGameArea.initTimer();
}

function wait() {
  document.removeEventListener(eventType, triggerWhenRestart);
  document.addEventListener(eventType, triggerWhenWait);
  myGameArea.startWaiting();
}

var waiting = true;
var eventType = "click";

document.body.onload = function () {
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    eventType = "touchstart";
  }
  init();
  wait();
};