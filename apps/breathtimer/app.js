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
  size: 56,
  thickness: 2,

  shortBuzz: 100,
  longBuzz: 300,

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

const buzzSymbols = [' ', '-', '=', '~'];

// load settings
var settings = Object.assign({
  modeIndex: 0,
  buzzMode: 2
}, require("Storage").readJSON("breathtimer.json", true) || {});


// set some additional settings
breath.w = g.getWidth(); // size of the background
breath.h = g.getHeight();
breath.x = breath.w * 0.5; // position of the circles
breath.y = breath.h * 0.5;
breath.texty = breath.y + breath.size + breath.texty; // text position

var wait = 100; // wait time, normally a minute
var time = 0; // for time keeping
var startTime = 0;
var breathCount = 0;
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

function buzzStrength() {
  // 4 buzz modes, 0 off, 1 = 0.33, 2 = 0.66, 3 = 1
  return settings.buzzMode / 3.0;
}

function buzz() {
  if (settings.buzzMode > 0) {
    Bangle.buzz(breath.shortBuzz, buzzStrength());
  }
}

function buzzLong() {
  if (settings.buzzMode > 0) {
    Bangle.buzz(breath.longBuzz, buzzStrength());
  }
}

function buzzDouble() {
  if (settings.buzzMode > 0) {
    Bangle.buzz(breath.shortBuzz, buzzStrength())
      .then(result => {
        setTimeout(() => {
          Bangle.buzz(breath.shortBuzz, buzzStrength());
        }, 50);
      });
  }
}

function buzzDoubleLong() {
  if (settings.buzzMode > 0) {
    Bangle.buzz(breath.longBuzz, buzzStrength())
      .then(result => {
        setTimeout(() => {
          Bangle.buzz(breath.longBuzz, buzzStrength());
        }, 50);
      });
  }
}

function buzzDouble() {
  if (settings.buzzMode > 0) {
    Bangle.buzz(100, 0.1)
      .then(result => {
        setTimeout(() => {
          Bangle.buzz(50, 1);
        }, 50);
      });
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
      breathCount++;
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
      buzzDoubleLong();
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

  const padding = 6;
  // draw text
  g.setFontAlign(0, 1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);

  if (stage == stages.in) {
    // breath in
    g.drawString("Breath in", breath.x, breath.h - padding);

  } else if (stage == stages.keepIn) {
    // keep breath
    g.drawString("Keep it in", breath.x, breath.h - padding);

  } else if (stage == stages.out) {
    // breath out
    g.drawString("Breath out", breath.x, breath.h - padding);
  } else if (stage == stages.keepOut) {
    // breath out
    g.drawString("Keep it out", breath.x, breath.h - padding);
  }

  // draw mode
  g.setFontAlign(-1, -1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(mode.title, padding, padding);
  g.setFontAlign(1, -1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString("[" + buzzSymbols[settings.buzzMode] + "]", breath.w - padding, padding);
  g.setFontAlign(1, 1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(breathCount.toString(), breath.w - padding, breath.h - padding);
  const delta = Date.now() - startTime;
  let seconds = Math.floor(delta / 1000);
  const minutes = Math.floor(seconds / 60);
  seconds = seconds % 60;
  g.setFontAlign(-1, 1).setFont(breath.font, breath.fontsize).setColor(breath.textcolor);
  g.drawString(`${minutes.toString()}:${seconds.toString().padStart(2, "0")}`, padding, breath.h - padding);

  // queue draw
  queueDraw();
}


const width = g.getWidth();
const height = g.getHeight();
Bangle.on('touch', (button, info) => {
  // top right
  if (info.x > width * 0.75 && info.y < height * 0.25) {
    settings.buzzMode = (settings.buzzMode + 1) % 4;
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
    startTime = Date.now();
    breathCount = 0;
    saveSettings();
  }
});

startTime = Date.now();

// Clear the screen once, at startup
g.clear();
// draw immediately at first
draw();

// turning timeout off seems to prevent swipe/touch events???
Bangle.setLCDTimeout(0);
// keep LCD on
Bangle.setLCDPower(1);

// Show launcher when middle button pressed
Bangle.setUI({
  mode: "custom",
  btn: () => {
    if (!Bangle.isBacklightOn()) {
      Bangle.setBacklight(1);
    }
    else {
      Bangle.setBacklight(0);
    }
  }
});
Bangle.setLocked(false);

