// BreathTimer
//
// Bangle.js 2 breathing helper
// Forked by JakobPer
// Based on Henkinen by Jukio Kallio
// www.jukiokallio.com

require("FontHaxorNarrow7x17").add(Graphics);

// settings
const breath = {
  theme: "default",
  x: 0, y: 0, w: 0, h: 0,
  size: 60,

  bgcolor: g.theme.bg,
  incolor: g.toColor(0, 1, 0),
  keepcolor: g.toColor(1, 1, 0),
  outcolor: g.toColor(0, 0, 1),
  keepoutcolor: g.toColor(1, 0, 0),

  font: "HaxorNarrow7x17", fontsize: 1,
  textcolor: g.theme.fg,
  texty: 18,
};

const modes = {
  box: {
    title: "Box",
    in: 4000,
    keepIn: 4000,
    out: 4000,
    keepOut: 4000
  },
  fourTwoFour: {
    title: "4-2-4",
    in: 4000,
    keepIn: 2000,
    out: 4000,
    keepOut: 0
  },
  fourSevenEight: {
    title: "4-7-8",
    in: 4000,
    keepIn: 7000,
    out: 8000,
    keepOut: 0
  }
};

const stages = {
  in: 0,
  keepIn: 1,
  out: 2,
  keepOut: 3,
};


// set some additional settings
breath.w = g.getWidth(); // size of the background
breath.h = g.getHeight();
breath.x = breath.w * 0.5; // position of the circles
breath.y = breath.h * 0.45;
breath.texty = breath.y + breath.size + breath.texty; // text position

var wait = 100; // wait time, normally a minute
var time = 0; // for time keeping
var mode = modes.box; // current mode
var buzz = true; // if buzzing is enabled
var stage = undefined;


// timeout used to update every minute
var drawTimeout;

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function () {
    drawTimeout = undefined;
    draw();
  }, wait - (Date.now() % wait));
}

function buzz() {
  Bangle.buzz(100, 0.5);
}

function buzzLong() {
  Bangle.buzz(300, 0.5);
}

function buzzDouble() {
  Bangle.buzz(100, 0.5)
    .then(result => {
      setTimeout(() => {
        Bangle.buzz(50, 1);
      }, 50);
    })
}


// main function
function draw() {

  // update current time
  time += wait - (Date.now() % wait);
  if (time > mode.in + mode.keepIn + mode.out + mode.keepOut) time = 0; // reset time

  // Reset the state of the graphics library
  g.reset();

  // Clear the area where we want to draw the time
  g.setColor(breath.bgcolor);
  g.fillRect(0, 0, breath.w, breath.h);

  // calculate circle size
  let circleColor = breath.textcolor;
  var circle = 0;
  if (time < mode.in) {
    // breath in
    if (stage != stages.in) {
      buzzLong();
    }
    stage = stages.in;
    circle = time / mode.in;
    g.setColor(breath.incolor);

  } else if (time < mode.in + mode.keepIn) {
    // keep breath
    if (stage != stages.keepIn) {
      buzzDouble();
    }
    stage = stages.keepIn;
    circle = 1;
    g.setColor(breath.keepcolor);

  } else if (time < mode.in + mode.keepIn + mode.out) {
    // breath out
    if (stage != stages.out) {
      buzz();
    }
    stage = stages.out;
    circle = ((mode.in + mode.keepIn + mode.out) - time) / mode.out;
    g.setColor(breath.outcolor);
  } else if (time < mode.in + mode.keepIn + mode.out + mode.keepOut) {
    // keep breath
    if (stage != stages.keepOut) {
      buzzDouble();
    }
    stage = stages.keepOut;
    circle = 0;
    g.setColor(breath.keepcolor);
    circleColor = breath.keepoutcolor;
  }

  // draw breath circle
  g.fillCircle(breath.x, breath.y, breath.size * circle);

  // breath area
  g.setColor(circleColor);
  g.drawCircle(breath.x, breath.y, breath.size);

  // draw text
  g.setFontAlign(0, 0).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);

  if (stage == stages.in) {
    // breath in
    g.drawString("Breath in", breath.x, breath.texty);

  } else if (stage == stages.keepIn) {
    // keep breath
    g.drawString("Keep it in", breath.x, breath.texty);

  } else if (stage == stages.out) {
    // breath out
    g.drawString("Breath out", breath.x, breath.texty);
  } else if (stage == stages.keepOut) {
    // breath out
    g.drawString("Keep it out", breath.x, breath.texty);
  }

  // draw mode
  g.setFontAlign(-1, -1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(mode.title, 0, 0);

  // queue draw
  queueDraw();
}


// Clear the screen once, at startup
g.clear();
// draw immediately at first
draw();


// keep LCD on
Bangle.setLCDPower(1);

// Show launcher when middle button pressed
Bangle.setUI("clock");

