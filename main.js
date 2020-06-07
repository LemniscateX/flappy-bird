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

function component(ctx, width, height, either, x, y, type) {
  this.type = type;
  this.width = width;
  this.height = height;
  this.x = x;
  this.y = y;
  this.gravity = 0.3;
  this.speedGravity = 0;
  this.direction = true;
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
    this.interval = null;
    this.flopTimer = null;
  },

  drawRestart: function () {
    this.restart = new component(this.context, RESTART_WIDTH, RESTART_WIDTH * RESTART_HRW, restart_img, CANVAS_WIDTH / 2 - RESTART_WIDTH / 2, CANVAS_HEIGHT / 2 - RESTART_WIDTH * RESTART_HRW / 2, "image");
    this.restart.update();
    var that = this;
    document.onclick = function (e) {
      var clickedX = e.pageX - that.canvas.offsetLeft;
      var clickedY = e.pageY - that.canvas.offsetTop;
      if (clickedX >= that.restart.x && clickedX <= that.restart.x + that.restart.width && clickedY >= that.restart.y && clickedY <= that.restart.y + that.restart.height) {
        that.clearCanvas();
        waiting = true;
        init();
        wait();
      }
    };
  },

  clearCanvas: function () {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  },

  updateBackground: function () {
    this.background.update();
  },

  updateCube: function () {
    this.cube.update();
    this.cube.speedGravity += this.cube.gravity;
    this.cube.y += this.cube.speedGravity;
    if ((this.frameno / 10) % 3 == 0) {
      this.cube.image = bird_down_img;
    } else if ((this.frameno / 10) % 3 == 1) {
      this.cube.image = bird_mid_img;
    } else if ((this.frameno / 10) % 3 == 2) {
      this.cube.image = bird_up_img;
    }
  },

  updateObstacles: function () {
    // First we should append an obstacle
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

    var goalObstacles = this.obstacles.filter(item => {
      return item.x + item.width == this.cube.x;
    });

    var seenObstacles = this.obstacles.filter(item => {
      return item.x + item.width > 0;
    });
    this.count += goalObstacles.length / 2;
    this.obstacles = seenObstacles;
    this.obstacles.forEach(item => item.update());
    this.obstacles.forEach(item => item.moveLeft());
  },

  updateBase: function () {
    this.base.update();
    this.base.moveLeft();
    if (this.base.x == -(this.base.width)) {
      this.base.x = 0;
    }
  },

  updateScore: function () {
    this.score.update();
    this.score.num = this.count;
  },

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

  bindKeys: function () {
    // Do this because inner function cannot get 'this' of outer scope
    var cube = this.cube;
    var canvas = this.canvas;
    document.onclick = function (e) {
      if (e.target == canvas) {
        cube.accelerate(-8);
      }
    };
  },

  startWaiting: function () {
    this.frameno = 0;
    if (!this.waitTimer) {
      this.waitTimer = setInterval(updateWait, 20);
    }
  },

  stopWaiting: function () {
    clearInterval(this.waitTimer);
  },

  startPlaying: function () {
    this.bindKeys();
    if (!this.interval) {
      this.interval = setInterval(update, 20);
    }
  },

  stopPlaying: function () {
    clearInterval(this.interval);
  },

  startFlopping: function () {
    if (!this.flopTimer) {
      this.flopTimer = setInterval(updateFlop, 20);
    }
  },

  stopFlopping: function () {
    clearInterval(this.flopTimer);
  },

  everyInterval: function (n) {
    if ((this.frameno / n) % 1 == 0) {
      return true;
    }
    return false;
  }
};

function updateWait() {
  if (!waiting) {
    myGameArea.stopWaiting();
    document.onclick = null;
    myGameArea.startPlaying();
  }
  myGameArea.clearCanvas();
  myGameArea.updateWhenWait();
}

function update() {
  // We have to put it here to check hit in every update
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
  document.onclick = function (e) {
    if (e.target == myGameArea.canvas) {
      waiting = !waiting;
      myGameArea.cube.accelerate(-8);
    }
  };
  myGameArea.startWaiting();
}

var waiting = true;
document.body.onload = function () {
  init();
  wait();
};