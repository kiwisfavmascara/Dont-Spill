# Process

## Starting idea

I wanted an everyday action to become unexpectedly difficult. The idea developed from opening a cupboard or fridge and making the whole scene tilt into carrying a tray while absurd events happen around it. The intended audience is students and ordinary desktop users looking for a brief playful break.

The core loop is: move two hands → change the tray position and tilt → see the liquid move or spill → adjust the hands again. The remaining amount gives the action a consequence.

## Visual development

I referred to the style of the second reference image (P2) I supplied: a cyan background, pale pink organic shapes, red-orange comic bursts and grainy halftone shadows. I changed it to my own selected palette: bright yellow background, blue tray and shadows, cream bowl, warm peach hands and tomato-red soup. I used ChatGPT image generation to explore these visual directions and selected the version labelled “01 SUNNY POP”. This was a choice of palette and art direction; the resulting reference image was AI-generated, not entirely hand-drawn by me.

The source/artist and original URL of P2 have not been identified yet. This must be completed before submission. The third-party reference itself is not redistributed in this repository. The generated direction is in `assets/visual-direction.png`.

## First implementation — 22 October 2026

The initial repository contained README and PROCESS templates. The first code version adds a desktop browser prototype, a live mirrored camera preview, two-hand palm detection, calibration, liquid loss and three events. Drawn hands, tray, bowl, liquid and drops are separate Canvas elements so they can respond to input. The approved image is visual guidance, not a static gameplay background.

Hand positions are sorted by their mirrored screen x coordinate. Their height difference determines an angle; their midpoint determines horizontal movement. The comfortable calibration pose is subtracted so the user does not need an exact prescribed resting angle. Smoothing reduces small jitter.

I kept the initial scope to wind, floor tilt and falling ball. They currently cycle; only the ball target varies. A larger randomized event library is planned, not claimed as implemented. The three drink choices currently share the same rules.

Interruption handling: loss of either hand freezes time and loss, then requires both hands plus a short countdown. Permission denial and model-loading failure offer keyboard mode. Tab changes pause, repeated start clicks are guarded, and the camera can be explicitly stopped.

## AI tools used

- ChatGPT conversation: concept development, interaction ideas, visual exploration and prompt drafting.
- ChatGPT image generation: visual mockups and palette variants.
- Codex: first HTML/CSS/JavaScript implementation, documentation and automated checks. I still need to review and understand the code before presenting it as coursework.
- Suggestion kept: use the difference between the two hand heights for tray tilt, with a keyboard demonstration mode.
- Suggestion changed/rejected: the early detailed 3D-like restaurant scenes were too complicated. I chose a close-up 2D composition with large hands and tray, simple event cues and a brighter palette. I also rejected muted/unnatural skin and soup colorways.

## Verification versus user trial

Automated physics checks are in `tests/physics.test.js`. Browser checks and camera limitations are recorded in `docs/VERIFICATION.md`. Automated checks are not a substitute for the required human trial.

## User trial — NOT YET CONDUCTED

Ask at least one other person to use the experience **before explaining it**. Do not include their name or camera recording in the public repository.

Fill this section only after the actual trial:

- Date and setup:
- What they tried first:
- Where they hesitated:
- Did they understand tilt versus sideways movement?
- Did they understand the spill feedback and warning?
- What happened when one hand left the frame?
- One observed issue:
- The change made in response (or reason for retaining the design):
- Result when trying the revision:

## Still to do before submission

- Real two-hand camera test and comfort/sensitivity tuning.
- Actual user trial and one documented decision/revision.
- Identify and credit P2's original source.
- Review and explain the hand-to-response code.
- Re-run from a fresh terminal, verify public repository access when signed out, and submit the repository URL through Canvas.

## Iteration — 23 October 2026

After trying the first prototype, I felt that 60 seconds was slightly too long, so I requested a 30-second round. The countdown, end condition and instructions were updated together. This is feedback from my own playtest, not the required trial with another person. Visual fidelity and stronger external events are next planned revisions; they are not implemented in this timing-only change.

## Visual and event iteration — 23 October 2026

After trying the prototype myself, I kept tomato soup and coffee and removed pumpkin soup. The earlier runtime shapes differed too much from the selected illustration, so I asked for closer printed-art visuals. Codex used ChatGPT image generation to produce separate transparent tray/hands, empty bowl, empty coffee cup with saucer, alien and bear assets based on the approved direction. The liquid is still drawn in code so it responds to tilt and drains. This is AI-assisted artwork, not a claim that I drew the assets manually.

The updated event set is floor tilt, falling ball, alien pull, slippery step and bear chase. The alien uses blue/red with tiny green lights, and the bear uses orange-red and blue print shadows. Events are shuffled with one of each per 30-second round. Floor tilt is sustained; slipping gives a decaying sideways jolt; the alien pulls an edge; bear pursuit causes oscillating bounce; the ball requires sideways avoidance. The background remains mostly yellow. Warning periods do not apply force, and time/forces stay frozen when tracking is interrupted.

Automated checks are recorded separately in docs/VERIFICATION.md. My own feedback does not replace the required trial with another person, which remains pending.
