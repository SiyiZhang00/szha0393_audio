// ======================================================
// Pacita Abad 'Wheels of Fortune' — AUDIO VERSION
// Based on the group static version: PaletteSystem / DotSystem / Wheel / BeadArc / LayoutSystem
// Audio: p5.Amplitude (Week 11) drives wheel rotation, bead scaling and background dot scaling.
// Controls / Interaction instructions:
//   - Click the "Play/Pause" button: start/stop music + animation
//   - Press R / r: regenerate the composition (new random seed, new layout)
//   - Press Shift + R: regenerate composition with the same seed (same layout)
//   - Press S / s: save current frame as PNG
//
// COURSE LINKS:
//   • Uses Week 10: static generative composition (layout + drawing).
//   • Uses Week 11: p5.sound, p5.Amplitude, mapping audio level to visual parameters.
//   • Everything else (arrays, loops, colour, etc.) is standard p5.js / JavaScript.
// ======================================================

// ------------------------
// Audio globals (Week 11 idea: Amplitude → visual parameters)
// ------------------------
let song;          // Audio track loaded with loadSound() in preload()
let analyser;      // p5.Amplitude analyser to measure RMS volume (Week 11 content)
let playButton;    // DOM button created with p5's createButton()

// Audio-driven state (values updated only while music is playing)
let audioLevel = 0;    // Current RMS audio level (0–~0.3), from analyser.getLevel()
let audioNorm = 0;     // Normalised audio level (0–1), mapped from audioLevel
let wheelRotation = 0; // Global rotation angle applied to all wheels
let beadScale = 1;     // Global scale factor for beads (outer rings + bead arcs)
let bgScale = 1;       // Global scale factor for background dots

let SEED = 0;
let wheels = [];
let beadArcs = [];
let backgroundDots = [];

// ======================================================
// preload – load audio before setup() (must match project path)
// This follows the pattern shown in the Week 11 p5.sound example.
// Reference for loadSound / p5.Amplitude (p5.js official docs):
//   https://p5js.org/reference/#/p5.Amplitude
// ======================================================
function preload() {
  // Week 11 pattern: loadSound() is placed inside preload() so the audio
  // is fully loaded before setup() runs.
  song = loadSound("assets/Cipher2.wav");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100); 
  noStroke();

  // Amplitude analyser (Week 11 content):
  //   • analyser = new p5.Amplitude()
  //   • analyser.setInput(song)
  // This lets us call analyser.getLevel() in draw().
  analyser = new p5.Amplitude();
  analyser.setInput(song); // Connect the audio track to the analyser

  // Play/Pause button
  // NOTE: createButton() and DOM positioning are covered in p5.js DOM examples.
  //       This is standard p5 DOM usage, similar to class examples.
  // Reference:
  //   https://p5js.org/reference/#/p5/createButton
  playButton = createButton("Play/Pause");
  playButton.position(
    (width - playButton.width) / 2,
    height - playButton.height - 4
  );
  playButton.mousePressed(togglePlay);

  regenerate(false);
  noLoop();
}

function draw() {
  background(200, 40, 20); 
  // --------------------------
  // 1. If music is playing, update audio-driven parameters
  // --------------------------
  let isPlaying = song && song.isPlaying();
  if (isPlaying) {
    // Get current RMS level (Week 11 technique):
    //   audioLevel ≈ 0–0.3 for this track (depends on actual audio).
    let lvl = analyser.getLevel();

    // Defensive check: if library returns NaN or non-number, treat as 0
    // (This is general defensive programming practice, not a specific course topic.)
    if (!isFinite(lvl)) {
      lvl = 0;
    }
    audioLevel = lvl;

    // Map RMS level (0–0.25) → 0–1 range (clamped)
    // This is exactly the Week 11 pattern: map() + constrain() for normalising audio.
    audioNorm = constrain(map(audioLevel, 0, 0.25, 0, 1), 0, 1);

    // Audio level → global rotation speed:
    //   • low volume → slight rotation
    //   • high volume → faster rotation
    const rotSpeed = 0.01 + audioNorm * 0.25;
    wheelRotation += rotSpeed;

    // Audio level → bead scaling (outer rings + bead arcs):
    //   • from 1.0 (no extra scale) up to 2.6
    beadScale = 1.0 + audioNorm * 1.6;

    // Audio level → background dot scaling:
    //   • from 1.0 (no extra scale) up to 2.2
    bgScale = 1.0 + audioNorm * 1.2;
  }

  // --------------------------
  // 2. Draw static structure + audio deformation
  // --------------------------

  DotSystem.drawBackgroundDots(backgroundDots);
  for (const arc of beadArcs) arc.display();
  for (const w of wheels) w.display();

  // Optional debug overlay (disabled by default):
  // fill(0, 0, 100);
  // textSize(14);
  // text("playing: " + isPlaying + "  level: " + audioLevel.toFixed(3), 10, 20);
}

// ======================================================
// Keyboard controls: R / Shift+R / S
//   • R / r: regenerate with new seed
//   • Shift+R: regenerate with same seed (layout stays similar)
//   • S / s: save PNG
// ======================================================
function keyPressed() {
  if (key === "R" || key === "r") {
    const same = keyIsDown(SHIFT);
    regenerate(same);
  }
    
    if (!song.isPlaying()) {
      noLoop();
      redraw();
    }

  if (key === "S" || key === "s") {
    saveCanvas("wheels_of_fortune_audio", "png");
  }
}

// ======================================================
// Play / Pause control (following the pattern from Week 11 audio example)
// ======================================================
function togglePlay() {
  if (!song) return;

  if (song.isPlaying()) {
    // If currently playing → stop audio + stop animation
    song.stop();

    // Reset all audio-driven parameters to return to the static image.
    // This ensures that when we stop, we go back to a calm, non-rotating composition.
    audioLevel = 0;
    wheelRotation = 0;
    beadScale = 1;
    bgScale = 1;

    noLoop();   // Stop calling draw() every frame
    redraw();   // Draw one static frame
  } else {
    // If not playing → start audio + start animation
    // song.loop() ensures the track repeats, similar to class examples.
    song.loop();
    loop();     // Resume continuous draw() calls
  }
}

// ======================================================
// Window resize: recompute layout and redraw
//   • This is standard p5.js behaviour: adapt layout to new window size.
// ======================================================
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  regenerate(true); 

  // Reposition Play/Pause button to stay centred at the bottom
  if (playButton) {
    playButton.position(
      (width - playButton.width) / 2,
      height - playButton.height - 4
    );
  }

  // If music is not playing, keep only one static frame
  if (!song.isPlaying()) {
    noLoop();
    redraw();
  }
}

// ======================================================
// Random seed & regeneration (same structure as static group version)
// NOTE: The seed generation here uses bitwise operations on Date.now()
//       and Math.random(). Bitwise operations (>>> and ^) were not
//       explicitly covered in class. This follows a common JavaScript
//       pattern described in general JS references (e.g. MDN bitwise operators).
//       MDN reference:
//         https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators
// ======================================================
function newSeed() {
  SEED = (Date.now() ^ Math.floor(performance.now() * 1000) ^ Math.floor(Math.random() * 1e9)) >>> 0;
}

function regenerate(keepSameSeed = false) {
  if (!keepSameSeed) newSeed();
  randomSeed(SEED);
  noiseSeed(SEED); 

  wheels = LayoutSystem.generateWheels();
  beadArcs = LayoutSystem.generateBeadArcs(wheels, 2);
  backgroundDots = LayoutSystem.generateBackgroundDots(wheels);
  redraw();
}

// ======================================================
// Part 1. PaletteSystem — colour system
// ======================================================

const PaletteSystem = {
  basePalette: [
    [340, 90, 100], // magenta
    [25,  95, 100], // orange
    [55,  90, 100], // yellow
    [200, 60,  90], // cyan-blue
    [120, 70,  90], // green
    [0,   0, 100],  // white
    [0,   0,  15]   // black
  ],

  pick() {
    const p = this.basePalette[int(random(this.basePalette.length))];
    let h = (p[0] + random(-8, 8) + 360) % 360;
    let s = constrain(p[1] + random(-6, 6), 50, 100);
    let b = constrain(p[2] + random(-6, 6), 40, 100);
    return color(h, s, b);
  }
};

// ======================================================
// Part 2. DotSystem — background dots & ring dots
// ======================================================

const DotSystem = {
  makeRingDots(rad) {
    const count = int(map(rad, 20, 220, 16, 32)); // more dots for larger rings
    const dotR  = rad * 0.10;
    const dots = [];
    for (let k = 0; k < count; k++) {
      const a = (TWO_PI * k) / count;
      const rr = rad * random(0.8, 0.95);
      dots.push({ x: cos(a) * rr, y: sin(a) * rr, r: dotR });
    }
    return dots;
  },

  generateBackgroundDots(wheels) {
    const dots = [];
    const step = min(width, height) / 28;
    const paletteBG = [
      color(0, 0, 100),
      color(0, 0, 15),
      color(25, 95, 100),
      color(340, 90, 100)
    ];

    for (let y = step * 0.5; y < height; y += step) {
      for (let x = step * 0.5; x < width; x += step) {
        if (random() >= 0.6) continue;

        const px = x + random(-step * 0.3, step * 0.3);
        const py = y + random(-step * 0.3, step * 0.3);

        // Skip positions inside any wheel (so wheels remain visually clean)
        let insideWheel = false;
        for (const w of wheels) {
          if (dist(px, py, w.x, w.y) < w.baseR * 0.9) {
            insideWheel = true;
            break;
          }
        }
        if (insideWheel) continue;

        dots.push({
          x: px,
          y: py,
          r: random(step * 0.06, step * 0.12),
          c: random(paletteBG)
        });
      }
    }
    return dots;
  },

  drawBackgroundDots(dots) {
    for (const d of dots) {
      fill(d.c);
      ellipse(d.x, d.y, d.r * 2 * bgScale);
    }
  }
};

// ======================================================
// Part 3. WheelSystem & Wheel & BeadArc
// • This is the core of the Pacita-inspired visual system.
// • The structure (Wheel + layers + bead ring + bead arcs) is based on the group static code,
//   extended with audio-driven parameters (wheelRotation, beadScale).
// ======================================================

class Wheel {
  constructor(x, y, baseR) {
    this.x = x;
    this.y = y;
    this.baseR = baseR;

    this.coreCol   = PaletteSystem.pick();
    this.beadColor = PaletteSystem.pick();

    // Inner layered structure of the wheel (solid, dots, sunburst, stripes)
    this.layers = [];
    const nLayers = int(random(3, 5));

    for (let i = 0; i < nLayers; i++) {
      const ratio = map(i, 0, nLayers - 1, 0.25, 1.0);
      const style = random(["solid", "dots", "sunburst", "stripes"]);
      const col   = PaletteSystem.pick();

      const layer = { ratio, style, col };

      // For "dots" style, precompute dot positions with DotSystem.makeRingDots()
      if (style === "dots") {
        const rad = this.baseR * ratio * 0.9;
        layer.dots = DotSystem.makeRingDots(rad);
      }
      this.layers.push(layer);
    }

    // Outer bead ring
    const ringR = this.baseR * 0.88;
    const beadSize = this.baseR * 0.09;
    const circumference = TWO_PI * ringR;
    const count = max(10, int(circumference / (beadSize * 1.2)));

    this.beadRing = {
      r: ringR,
      size: beadSize,
      count: count
    };
  }

  getEffectiveR() {
    return this.baseR;
  }

  display() {
    push();
    translate(this.x, this.y);

    // Global audio-driven rotation applied to the whole wheel.
    // This is where the Week 11 amplitude mapping directly affects the composition.
    rotate(wheelRotation);

    const effectiveR = this.getEffectiveR();

    // Outer bead ring
    for (let i = 0; i < this.beadRing.count; i++) {
      const a  = (TWO_PI * i) / this.beadRing.count;
      const bx = cos(a) * (effectiveR * 0.88);
      const by = sin(a) * (effectiveR * 0.88);

      // Dark halo behind each bead
      fill(0, 0, 15);
      ellipse(bx, by, this.beadRing.size * 1.4 * beadScale);

      // Coloured bead (scaled by beadScale, driven by audio)
      fill(this.beadColor);
      ellipse(bx, by, this.beadRing.size * beadScale);
    }

    // Inner multi-layer structure
    for (const L of this.layers) {
      const rad = effectiveR * L.ratio * 0.9;

      switch (L.style) {
        case "solid":
          // Simple solid coloured disc
          fill(L.col);
          ellipse(0, 0, rad * 2);
          break;

        case "dots":
          // Ring of dots using precomputed positions
          fill(L.col);
          for (const d of L.dots) {
            ellipse(d.x, d.y, d.r * 2);
          }
          break;

        case "sunburst":
          // Radial wedges (sunburst pattern)
          WheelSystem.drawSunburst(rad, L.col);
          break;

        case "stripes":
          // Concentric striped arcs
          WheelSystem.drawStripes(rad, L.col);
          break;
      }
    }

    // Small central circle
    fill(this.coreCol);
    ellipse(0, 0, effectiveR * 0.18);

    pop();
  }
}

// Helper object for sunburst and stripe styles
const WheelSystem = {
  // Draw a radial sunburst pattern
  // (Basic polar coordinate geometry, consistent with course content.)
  drawSunburst(rad, col) {
    const rays = int(map(rad, 20, 220, 20, 40));

    for (let i = 0; i < rays; i++) {
      const a0 = (TWO_PI * i) / rays;
      const a1 = (TWO_PI * (i + 0.5)) / rays;
      fill(i % 2 === 0 ? col : color(0, 0, 15));
      beginShape();
      vertex(0, 0);
      vertex(cos(a0) * rad, sin(a0) * rad);
      vertex(cos(a1) * rad, sin(a1) * rad);
      endShape(CLOSE);
    }
  },

  // Draw striped concentric arcs
  // Uses arc(), hue(), saturation(), brightness() (all standard p5.js functions).
  drawStripes(rad, col) {
    const bands = int(random(4, 6));
    const thick = (rad * 0.9) / bands;

    for (let b = 0; b < bands; b++) {
      const rr = rad * 0.1 + b * thick;
      const segs = int(map(rad, 20, 220, 12, 24));

      for (let i = 0; i < segs; i++) {
        const a0 = (TWO_PI * i) / segs;
        const a1 = (TWO_PI * (i + 0.6)) / segs;

        // Slightly shift hue per band and segment for variety
        fill(
          (hue(col) + b * 8 + i * 3) % 360,
          saturation(col),
          brightness(col)
        );

        arc(0, 0, rr * 2, rr * 2, a0, a1, PIE);
      }
    }
  }
};

// Curved bead arcs connecting two wheels
// Uses p5.Vector for vector maths (add, sub, mult, normalize).
// Vector maths is standard p5.js functionality (vector examples on p5.js site).
class BeadArc {
  constructor(wA, wB) {
    const a = createVector(wA.x, wA.y);
    const b = createVector(wB.x, wB.y);

    // Direction from A to B
    const dir = p5.Vector.sub(b, a).normalize();

    // Start point A on the edge of wheel A
    const rA = wA.baseR * 0.95;
    this.A = p5.Vector.add(a, p5.Vector.mult(dir, rA));

    // End point B on the edge of wheel B
    const rB = wB.baseR * 0.95;
    this.B = p5.Vector.sub(b, p5.Vector.mult(dir, rB));

    // Chord from A to B
    const chord = p5.Vector.sub(this.B, this.A);
    const mid = p5.Vector.add(this.A, p5.Vector.mult(chord, 0.5));

    // Normal vector to the chord (perpendicular)
    const normal = createVector(-chord.y, chord.x).normalize();

    // Curvature controls how much the arc bends.
    // This uses simple scalar multiplication of the normal vector.
    const curvature = chord.mag() * (0.25 + random(-0.08, 0.08));
    this.C = p5.Vector.add(mid, p5.Vector.mult(normal, curvature));

    // Use bead colour from wheel A
    this.col = wA.beadColor;

    // Bead size and count along the arc
    const beadSize = min(wA.baseR, wB.baseR) * 0.06;
    const spacing = beadSize * 1.4;
    const approxLen = chord.mag() * 1.1;
    this.n = max(4, int(approxLen / spacing));
    this.beadSize = beadSize;
  }

  // Quadratic Bézier interpolation along the arc:
  //   P(t) = (1 - t)^2 * A + 2(1 - t)t * C + t^2 * B
  //
  // NOTE: The explicit quadratic Bézier formula was not covered step–by–step in class.
  //       This follows the standard quadratic Bézier definition as explained in many
  //       graphics references. For example, the maths is consistent with:
  //       • Wikipedia: "Bézier curve"
  //       • p5.js bezierPoint() reference:
  //         https://p5js.org/reference/#/p5/bezierPoint
  _pointAt(t) {
    const mt = 1 - t;
    const x =
      mt * mt * this.A.x +
      2 * mt * t * this.C.x +
      t * t * this.B.x;
    const y =
      mt * mt * this.A.y +
      2 * mt * t * this.C.y +
      t * t * this.B.y;
    return createVector(x, y);
  }

  display() {
    for (let i = 0; i <= this.n; i++) {
      const t = i / this.n;
      const p = this._pointAt(t);

      // Dark halo behind each bead
      fill(0, 0, 15);
      ellipse(p.x, p.y, this.beadSize * 1.45 * beadScale);

      // Coloured bead, scaled by beadScale (audio-driven)
      fill(this.col);
      ellipse(p.x, p.y, this.beadSize * beadScale);
    }
  }
}

// ======================================================
// Part 4. LayoutSystem — layout of wheels, arcs, dots
// ======================================================

const LayoutSystem = {
  generateWheels() {
    const wheelsOut = [];
    const unit = min(width, height) / 9;
    const cols = int(width / unit) + 1;
    const rows = int(height / unit) + 1;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (random() < 0.8) {
          const cx =
            (i + 0.5) * unit + random(-unit * 0.25, unit * 0.25);
          const cy =
            (j + 0.5) * unit + random(-unit * 0.25, unit * 0.25);
          const r = unit * random(0.55, 1.05);

          // Avoid overlapping wheels
          let ok = true;
          for (const w of wheelsOut) {
            if (dist(cx, cy, w.x, w.y) < (r + w.baseR) * 0.85) {
              ok = false;
              break;
            }
          }
          if (ok) wheelsOut.push(new Wheel(cx, cy, r));
        }
      }
    }
    return wheelsOut;
  },

  generateBeadArcs(wheelsIn, neighborsPerWheel = 2) {
    const arcs = [];
    for (let i = 0; i < wheelsIn.length; i++) {
      const w1 = wheelsIn[i];
      const candidates = [];
      for (let j = 0; j < wheelsIn.length; j++) {
        if (i === j) continue;
        const d = dist(w1.x, w1.y, wheelsIn[j].x, wheelsIn[j].y);
        candidates.push({ j, d });
      }
      candidates.sort((a, b) => a.d - b.d);

      let added = 0;
      for (const c of candidates) {
        if (added >= neighborsPerWheel) break;
        const j = c.j;
        if (j < i) continue;
        const w2 = wheelsIn[j];
        const d = c.d;

        // Skip if wheels are too close or too far
        if (d < (w1.baseR + w2.baseR) * 0.95) continue;
        if (d > min(width, height) / 2) continue;

        const arc = new BeadArc(w1, w2);
        const mid = arc._pointAt(0.5);

        // Avoid arcs that pass through a third wheel
        let blocked = false;
        for (let k = 0; k < wheelsIn.length; k++) {
          if (k === i || k === j) continue;
          if (
            dist(mid.x, mid.y, wheelsIn[k].x, wheelsIn[k].y) <
            wheelsIn[k].baseR * 0.9
          ) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          arcs.push(arc);
          added++;
        }
      }
    }
    return arcs;
  },

  generateBackgroundDots(wheelsIn) {
    return DotSystem.generateBackgroundDots(wheelsIn);
  }
};
