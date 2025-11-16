# szha0393_audio
This project is an individual animated extension of our group’s generative reconstruction of Pacita Abad’s Wheels of Fortune. The group produced a static procedural interpretation of the artwork using modular, class-based p5.js code.
My individual task was to animate the image using one of the four permitted methods:
1.Audio-based animation
2.Interaction-based animation
3.Perlin noise + randomness
4.Time-based animation

I chose the audio-based method, using the p5.sound p5.Amplitude analyser to make wheels, beads and background dots respond to the music.
This README describes how to interact with the work, the concepts behind my audio-driven animation, and a technical overview of how the code works.

Keyboard & Audio Controls
Keyboard Controls
R – Regenerate the scene with a new random seed
Shift + R – Regenerate using the same seed (reproducible layout)
S – Save a screenshot of the current frame
Audio / Playback Controls
Play/Pause button (on screen) – Start/stop the music and the animation loop
Initial state – When the page loads, the image is static. Animation starts only after pressing Play.
Stop behaviour – When you press Pause, the music stops and the image returns to a static still frame.

How to interact 
Open the page in a browser.
You will see a static composition of Pacita-style wheels and beads.
Click the Play/Pause button at the bottom to start the music.
Watch wheels spin, beads pulse, and background dots gently expand and contract with the sound.
Press R while the music is playing to regenerate a new arrangement that is still audio-reactive.

Audio-Based Animation
I chose audio-based animation because the sound track already has rhythm, dynamics and structure that can be translated visually. Instead of using randomness or time alone, the composition responds directly to volume changes in the music.

Mapped Components
I animate three main components using the audio level:
Wheel Rotation 
The global variable wheelRotation accumulates an angle over time.
When the audio is louder, the wheels rotate faster.
When the music is quiet, rotation slows and can almost stop.
Bead Ring & BeadArc Pulse

The outer bead rings around each wheel and the beads on the BeadArcs share a global beadScale.
High volume → beads grow larger and halos expand.
Low volume → beads shrink toward their original size.

Background Dot Scaling
Background dots in the negative space use bgScale.
They gently grow and shrink with the music, like fabric breathing with the rhythm.
This keeps the overall composition stable (no elements jump position), but gives it a living, sound-responsive surface.

Sound Visualisation & Conceptual References 
Sound-Responsive Textile Imagery 
Traditional audio visualisers often use bars, waveforms or particle systems. Here, I deliberately keep the Pacita-inspired textile composition and embed sound responsiveness inside that structure instead of replacing it with new shapes.

The wheels behave like stitched mandalas that spin with loud passages.
bead rings feel like beaded embroidery, swelling and relaxing with the track.
Background dots behave like fabric texture, shimmering slightly with the music.

Audio Visualisation References
The mapping of p5.Amplitude output to visual parameters is inspired by typical p5.js sound examples, where an RMS level is used to scale circles or bars. In my version, the same principle is applied to a more complex Pacita-style composition, controlling:
global rotation speed,
bead and halo radius,
and background dot size.

In the source code I note that the Amplitude pattern is adapted from the official p5.sound examples:
// Amplitude pattern following p5.js "Amplitude" example: https://p5js.org/examples/sound-amplitude-analysis.html

Technologies Outside (or Beyond) the Core Course
Most of the visual structure (class-based objects, HSB colours, modular functions) comes directly from the studio code. The following points go slightly beyond what was demonstrated step-by-step in class, so I document them clearly:
p5.sound p5.Amplitude (sound analysis)
The course introduced the idea of Amplitude analysis in Week 11; in my code I extend it to control multiple visual parameters at once (rotation, bead size, background scale).

// This technique follows the p5.js Amplitude example but applies it to multiple
// visual parameters (rotation, beadScale, bgScale).
// Reference: https://p5js.org/examples/sound-amplitude-analysis.html

Manual random seed generation with bitwise operations
I combine Date.now(), performance.now() and Math.random() and then apply the unsigned right-shift operator >>> 0 to create a 32-bit seed.

// This seed-generation pattern is based on combining multiple time sources and
// bitwise operators (inspired by general JavaScript examples on MDN):
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
SEED = (
  Date.now() ^
  Math.floor(performance.now() * 1000) ^
  Math.floor(Math.random() * 1e9)
) >>> 0;


p5 DOM button for audio control
I use createButton() from the p5.js DOM utilities to create an on-screen Play/Pause button.

// This uses the p5.js DOM utilities (not shown in detail in class) to make
// an HTML button inside the sketch:
// https://p5js.org/reference/#/p5/createButton
playButton = createButton("Play/Pause");

Key Code Snippets
1. Audio Amplitude Mapping 
// Inside draw()
let isPlaying = song && song.isPlaying();
if (isPlaying) {
  // Get current RMS level (0 ~ roughly 0.3)
  let lvl = analyser.getLevel();

  // Defensive check: treat any invalid value as 0
  if (!isFinite(lvl)) {
    lvl = 0;
  }
  audioLevel = lvl;

  // Map raw level to a normalised 0–1 range
  audioNorm = constrain(map(audioLevel, 0, 0.25, 0, 1), 0, 1);

  // Audio → global wheel rotation speed
  const rotSpeed = 0.01 + audioNorm * 0.25;
  wheelRotation += rotSpeed;

  // Audio → bead and halo scaling
  beadScale = 1.0 + audioNorm * 1.6;

  // Audio → background dot scaling
  bgScale = 1.0 + audioNorm * 1.2;
}


analyser.getLevel() reads the current RMS volume from the soundtrack.

audioNorm normalises that value to [0, 1].

wheelRotation, beadScale and bgScale are updated from this normalised level, which makes all moving elements synchronised with the sound dynamics.

analyser.getLevel() 

audioNorm 

wheelRotation、beadScale 和 bgScale

2. Play / Pause Logic and Static Fallback 
function togglePlay() {
  if (!song) return;

  if (song.isPlaying()) {
    // If currently playing → stop audio + stop animation
    song.stop();

    // Reset audio-driven parameters so the image returns to a static still frame
    audioLevel = 0;
    wheelRotation = 0;
    beadScale = 1;
    bgScale = 1;

    noLoop();   // stop continuous draw() calls
    redraw();   // draw a single static frame
  } else {
    // Not playing → start audio + start animation
    song.loop();
    loop();     // resume continuous draw() calls
  }
}


When playback stops, all audio-driven variables are reset and noLoop() is called. This guarantees that the image is completely static when the music is not playing, satisfying the assignment requirement.