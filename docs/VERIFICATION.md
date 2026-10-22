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
