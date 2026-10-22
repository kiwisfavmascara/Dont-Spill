# Verification — first prototype, 22 October 2026

## Passed

- `node --check app.js`.
- `npm test`: four tests covering screen-space control direction and detection ordering, comfortable-pose calibration, missing-hand rejection, symmetric loss and safe small tilts.
- Headless Chromium desktop interaction: holding D tilts and reduces the remaining amount (100% to 88% in the check); pause freezes the timer; side-wind warning appears; no uncaught page errors.
- Narrow 390px viewport: no horizontal document overflow. Desktop is still the intended input environment.
- Camera lifecycle test with an explicitly mocked hand detector and synthetic video stream: permission denial provides an actionable message; retry proceeds to two-hand detection; hand loss freezes both amount and timer; stopping clears the video stream; no uncaught page errors. **This is a simulation, not proof of real model accuracy.**
- Visually inspected intro and gameplay screenshots. Added foreground thumbs so the grip reads clearly. Cached halftone tiles after the first browser pass exposed slow drawing; repeated the checks after this revision.

## Not yet verified

- Real camera, actual MediaPipe recognition quality and end-to-end external model loading on the user's machine.
- Sensitivity, lighting, arm comfort and timing with a real user.
- The required unprompted human trial and subsequent design decision.
- Hosting/live deployment (repository source is provided).

Do not present automated checks as a user trial.

## Visual/event revision — 23 October 2026

- Seven tests pass, including five unique events within a 30-second schedule, force-free warnings, counterable stronger floor tilt, slip/chase motion and ball collision separation.
- Headless Chromium: exactly two drink options; all five event messages appear during a complete round; round ends and retry returns to 100% / 30s; no uncaught page errors.
- Selected coffee cup and tomato soup screenshots are actual runtime captures. The generated transparent artwork was inspected in context.
- Keyboard tilt still drains the liquid; pause freezes the timer; narrow viewport has no horizontal overflow.
- Real camera recognition and comfort still require device/user testing after this revision. The required trial with another person remains pending.
