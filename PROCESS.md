# Process

## Starting idea

I wanted an everyday action or scenario become more interesting. The idea developed from opening a cupboard or fridge and making the whole scene tilt into carrying a tray while absurd events happen around it. Then I come up with the idea of holding a type of liquid to avoid spilling it.

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

## First user trial — 24 October 2026, afternoon

One participant tried the experience before I explained what it was or how it worked. Their name is omitted from this public record.

**Observation:** The participant did not understand what to do at the start. Unlike my own tests, they did not keep checking whether the camera could see their hands, so their hands frequently left the camera frame. They also did not understand why the tray was being disturbed. Across about three attempts, the liquid quickly reached 0%; this had not happened in my earlier testing. No exact scores or timings were recorded.

**Decision and response — 25 October 2026:** Add a separate instruction page between choosing a control mode and starting. Explain the 30-second goal, remaining-liquid score, two-hand tilt and sideways movement, keeping both hands fully visible, and tracking interruption/resume. Mention unexpected effects without naming specific hazards or adding per-event text warnings. Include an explicit start button and a back button. Also fix the alien's proportions by preserving its source image aspect ratio.

**Unresolved issue:** The repeated quick 0% results are recorded as a difficulty or tracking concern, not attributed to a proven cause. Difficulty was not changed in this revision. The participant has not yet tested the revised instructions, so their effectiveness and the actual average score remain unverified.

## Still to do before submission

- Real two-hand camera test and comfort/sensitivity tuning.
- Re-test the revised instructions with a participant and record whether they help.
- Identify and credit P2's original source.
- Review and explain the hand-to-response code.
- Re-run from a fresh terminal, verify public repository access when signed out, and submit the repository URL through Canvas.

## Iteration — 23 October 2026

After trying the first prototype, I felt that 60 seconds was slightly too long, so I requested a 30-second round. The countdown, end condition and instructions were updated together. This is feedback from my own playtest, not the required trial with another person. Visual fidelity and stronger external events are next planned revisions; they are not implemented in this timing-only change.

## Visual and event iteration — 23 October 2026

After trying the prototype myself, I kept tomato soup and coffee and removed pumpkin soup. The earlier runtime shapes differed too much from the selected illustration, so I asked for closer printed-art visuals. Codex used ChatGPT image generation to produce separate transparent tray/hands, empty bowl, empty coffee cup with saucer, alien and bear assets based on the approved direction. The liquid is still drawn in code so it responds to tilt and drains. This is AI-assisted artwork, not a claim that I drew the assets manually.

The updated event set is floor tilt, falling ball, alien pull, slippery step and bear chase. The alien uses blue/red with tiny green lights, and the bear uses orange-red and blue print shadows. Events are shuffled with one of each per 30-second round. Floor tilt is sustained; slipping gives a decaying sideways jolt; the alien pulls an edge; bear pursuit causes oscillating bounce; the ball requires sideways avoidance. The background remains mostly yellow. Warning periods do not apply force, and time/forces stay frozen when tracking is interrupted.

Automated checks are recorded separately in docs/VERIFICATION.md. My own feedback does not replace the required trial with another person, which remains pending.

## Liquid and difficulty iteration — 23 October 2026

I requested closer liquid styling and a harder experience, aiming for about 55% remaining on average. Codex replaced the regular liquid dots with irregular seeded grain, added curved cream ribbons, floating garnish, tilt-dependent waves and textured splash highlights. Animation uses game elapsed time, so pausing or losing tracking freezes the visual motion too. Lower remaining volume reduces splash size.

The spill threshold changed from 0.18 to 0.14 radians, tilt loss from 27 to 46 percentage points per radian per second, and the rapid-motion penalty increased. Floor, alien, slip and bear disturbances were strengthened. The round remains 30 seconds and a level, steady tray still loses nothing. A simplified controller that compensates for 80% of an event with 0.3–0.7 second delay retained approximately 49–56%, excluding ball hits and real hand noise. This is a tuning estimate, not an observed human average. Real player trials are still needed to assess the 55% target.

Checks: seven existing tests passed, JavaScript syntax and whitespace checks passed, and 120 mocked Canvas render states covered five events, both drinks, four fill amounts and three tilt angles without exceptions or unbalanced Canvas saves. These are not a browser screenshot review or a real-camera trial of this revision.

## Surprise timing and comic accents — 23 October 2026

After testing, I felt the ball fell too slowly and the event labels made the surprises too predictable. I requested a much faster drop, one explanation at the start instead of text for each event, and visual accents closer to the approved still image. The attached detail showed a red jagged comic fan and cream speed streaks.

The ball now has a short 0.45-second landing-shadow cue followed by a 0.32-second fall to the collision point, rather than a 1.4-second descent. Its drawn position and collision use shared timing constants. Per-event names, instructions and ball-result messages were removed; tracking, permission and pause messages remain. The opening explains that random surprises can happen. Event order remains shuffled; directions and short gaps now also vary. Large asymmetric red comic fans and cream speed streaks sit behind the tray during stronger tilts, keeping the bright yellow field and the main illustration visible.

JavaScript syntax checks, whitespace checks and all seven existing tests passed. This revision still needs a real browser/camera playtest to judge whether the fast ball feels fair. The 55% average remains a playtest target, not a measured result.
