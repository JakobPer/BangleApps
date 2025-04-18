// BreathTimer
//
// Bangle.js 2 breathing helper
// Forked by JakobPer
//
// Based on Henkinen by Jukio Kallio
// www.jukiokallio.com

require("FontHaxorNarrow7x17").add(Graphics);

// settings
const breath = {
  theme: "default",
  x: 0, y: 0, w: 0, h: 0,
  size: 60,
  thickness: 2,

  bgcolor: g.theme.bg,
  incolor: g.toColor(0, 1, 0),
  keepcolor: g.toColor(1, 1, 0),
  outcolor: g.toColor(0, 0, 1),
  keepoutcolor: g.toColor(1, 0, 0),

  font: "HaxorNarrow7x17", fontsize: 1,
  textcolor: g.theme.fg,
  texty: 18,
};

const modes = [
  {
    title: "Box",
    in: 4000,
    keepIn: 4000,
    out: 4000,
    keepOut: 4000
  },
  {
    title: "4-2-4",
    in: 4000,
    keepIn: 2000,
    out: 4000,
    keepOut: 0
  },
  {
    title: "4-7-8",
    in: 4000,
    keepIn: 7000,
    out: 8000,
    keepOut: 0
  }
];

const stages = {
  in: 0,
  keepIn: 1,
  out: 2,
  keepOut: 3,
};

// load settings
var settings = Object.assign({
  modeIndex: 0,
  buzzEnabled: false
}, require("Storage").readJSON("breathtimer.json", true) || {});


// set some additional settings
breath.w = g.getWidth(); // size of the background
breath.h = g.getHeight();
breath.x = breath.w * 0.5; // position of the circles
breath.y = breath.h * 0.45;
breath.texty = breath.y + breath.size + breath.texty; // text position

var wait = 100; // wait time, normally a minute
var time = 0; // for time keeping
var mode = modes[settings.modeIndex]; // current mode
var stage = undefined;


// timeout used to update every minute
var drawTimeout;

function saveSettings() {
  require("Storage").writeJSON("breathtimer.json", settings);
}

// schedule a draw for the next minute
function queueDraw() {
  if (drawTimeout) clearTimeout(drawTimeout);
  drawTimeout = setTimeout(function () {
    drawTimeout = undefined;
    draw();
  }, wait - (Date.now() % wait));
}

function buzz() {
  if (settings.buzzEnabled) {
    Bangle.buzz(100, 0.5);
  }
}

function buzzLong() {
  if (settings.buzzEnabled) {
    Bangle.buzz(300, 0.5);
  }
}

function buzzDouble() {
  if (settings.buzzEnabled) {
    Bangle.buzz(100, 0.5)
      .then(result => {
        setTimeout(() => {
          Bangle.buzz(50, 1);
        }, 50);
      })
  }
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
  let fillColor;
  var circle = 0;
  if (time < mode.in) {
    // breath in
    if (stage != stages.in) {
      buzzLong();
    }
    stage = stages.in;
    circle = time / mode.in;
    fillColor = breath.incolor;

  } else if (time < mode.in + mode.keepIn) {
    // keep breath
    if (stage != stages.keepIn) {
      buzzDouble();
    }
    stage = stages.keepIn;
    circle = 1;
    fillColor = breath.keepcolor;

  } else if (time < mode.in + mode.keepIn + mode.out) {
    // breath out
    if (stage != stages.out) {
      buzz();
    }
    stage = stages.out;
    circle = ((mode.in + mode.keepIn + mode.out) - time) / mode.out;
    fillColor = breath.outcolor;
  } else if (time < mode.in + mode.keepIn + mode.out + mode.keepOut) {
    // keep breath
    if (stage != stages.keepOut) {
      buzzDouble();
    }
    stage = stages.keepOut;
    circle = 0;
    fillColor = breath.keepcolor;
    circleColor = breath.keepoutcolor;
  }


  // breath area
  g.setColor(circleColor);
  g.fillCircle(breath.x, breath.y, breath.size + breath.thickness);
  g.setColor(breath.bgcolor);
  g.fillCircle(breath.x, breath.y, breath.size);

  if (stage == stages.keepOut) {
    g.setColor(circleColor);
    g.fillCircle(breath.x, breath.y, breath.size * 0.5 + breath.thickness);
    g.setColor(breath.bgcolor);
    g.fillCircle(breath.x, breath.y, breath.size * 0.5);
  }

  // draw breath circle
  g.setColor(fillColor);
  g.fillCircle(breath.x, breath.y, breath.size * circle);

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
  const padding = 6;
  g.setFontAlign(-1, -1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(mode.title, padding, padding);
  g.setFontAlign(1, -1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(settings.buzzEnabled ? "[~]" : "[  ]", 176 - padding, padding);

  // queue draw
  queueDraw();
}


const width = g.getWidth();
const height = g.getHeight();
Bangle.on('touch', (button, info) => {
  // top right
  if (info.x > width * 0.75 && info.y < height * 0.25) {
    settings.buzzEnabled = !settings.buzzEnabled;
    saveSettings();
  }
});

Bangle.on('swipe', (dirLR, dirUD) => {
  if (dirUD != 0) {
    settings.modeIndex = (settings.modeIndex - dirUD) % modes.length;
    if (settings.modeIndex < 0) {
      settings.modeIndex += modes.length;
    }
    mode = modes[settings.modeIndex];
    time = 0;
    stage = undefined;
    saveSettings();
  }
});

// Clear the screen once, at startup
g.clear();
// draw immediately at first
draw();

// turning timeout off seems to prevent swipe/touch events???
//Bangle.setLCDTimeout(0);
// keep LCD on
Bangle.setLCDPower(1);

// Show launcher when middle button pressed
Bangle.setUI();

