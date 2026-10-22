# Don't Spill!

A short, playful browser experience for students and other desktop users taking a break. Hold up both hands, balance a tray, and deliver as much soup as possible while the world interferes.

![First playable version](docs/screenshot.png)

## Run

No build step or paid account is required. Install Python 3, then from a fresh terminal:

```sh
git clone https://github.com/kiwisfavmascara/Dont-Spill.git
cd Dont-Spill
python3 -m http.server 8000
```

Open **http://localhost:8000** in a current desktop Chrome or Edge browser. Do not open `index.html` directly. A hosted copy must use HTTPS for camera access. This repository has not yet enabled GitHub Pages.

## How to play

1. Choose tomato soup, pumpkin soup, or coffee.
2. Select **Enable camera & try it**, allow camera access, and show both open hands, comfortably apart, in the mirrored preview.
3. Hold your hands still for calibration. Raise one hand to tilt the tray; move both hands sideways to move it. Use **Recalibrate** if the resting angle feels wrong.
4. Watch the liquid, remaining percentage, and event warnings. Counteract wind and floor tilt; move away from a falling ball's landing position.
5. After 30 seconds, see how much remains. Retry or return home to change your order.

The program uses palm centres, not a special gripping gesture. Small movements are enough. Put the camera far enough away to see both hands.

**Keyboard fallback:** A/D tilt; left/right arrows move; Space pauses. It works even when camera permission is denied or the hand model cannot load. Pause and Stop camera are also visible buttons. If one hand disappears, time and loss freeze until both return and a short countdown finishes. Switching tabs pauses the experience.

## Dependencies and privacy

- Plain HTML, CSS, JavaScript modules and Canvas 2D.
- MediaPipe Tasks Vision **0.10.21**, loaded on demand from jsDelivr, including its WebAssembly files.
- Google's Hand Landmarker **float16 model, version 1**, loaded from Google Storage. Exact URLs are in `app.js`.
- Camera mode requires an internet connection to those providers, HTTPS/localhost, a camera, permission, and a browser supporting WebAssembly. Initial model loading can take time.
- Camera processing is in the browser. This application does not record, store, or upload frames. External providers receive ordinary requests for library/model assets. No microphone is requested.
- Stop camera or leave the page to release the camera. Keyboard mode is available without these external dependencies.

## Implementation

`physics.js` maps two palm positions to tray angle and horizontal position. `app.js` smooths that input, adds event disturbance, calculates loss, and draws each object independently. The amount left is state, not a random score: sustained excessive tilt drains it, while ball collisions remove 15 percentage points. Three prototype events currently cycle: wind, slope and falling ball (with a randomized target location). The proposed 6–8 randomly selected events are future work.

## Checks

With Node.js installed (no npm install required):

```sh
npm test
```

Before submission, also run the camera on a real device, try permission denial, remove one hand, pause/resume, finish a round, and ask another person to try it without explanation. See `PROCESS.md` for unfinished trial requirements.

## Known limitations

This is the first prototype. The Canvas illustration interprets the approved visual direction; it is not a pixel-identical layered recreation. Liquids use a simple loss rule rather than fluid simulation. Tracking can jitter, fail in poor lighting, or struggle with overlapping hands. Calibration needs a comfortable steady pose. Detection runs at a limited frequency on the main thread, so older computers may stutter. Physical camera comfort and recognition quality still need user testing. Keyboard is the demonstration path when camera dependencies are unavailable. Desktop use is intended; mobile touch controls are not implemented.

## Credits

See [CREDITS.md](CREDITS.md) for the visual reference, AI assistance and MediaPipe sources. This is Assignment 3, *An interactive experience*. The required user trial is still pending; this is not a completed submission.
