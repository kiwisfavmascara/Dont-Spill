// All timings use active game time: pause and lost tracking freeze every layer.
export const SPLASH_WINDOW = 0.6;
export const SPLASH_THRESHOLD = 8;
export const SPLASH_SECONDS = 0.8;
export const COVER_SECONDS = 2;

export function coverAge(cover, time) {
  return cover ? time - cover.start : -1;
}

export function clothSteps(cover, time) {
  const age = coverAge(cover, time);
  if (age < 0.25 || age > 2.5) return { angle: 0, x: 0, y: 0 };
  const strength = Math.min(1, (age - 0.25) / 0.3, (2.5 - age) / 0.4);
  return {
    angle: Math.sin(age * 14) * 0.13 * strength,
    x: Math.sin(age * 10) * 0.025 * strength,
    y: Math.sin(age * 18) * 8 * strength,
  };
}

export function createSceneFeedback(random = Math.random) {
  const covers = random() < 0.5 ? ["cloth", "fog"] : ["fog", "cloth"];
  const state = { cloth: null, fog: null, splash: null, spiderStart: 4 + random() * 2 };
  let samples = [{ time: 0, amount: 100 }], lastCoverEvent = -1;
  let lastSplash = -10;
  return {
    state,
    update(time, amount, event, eventIndex) {
      // Two covers overlap existing hazards; they do not replace the five events.
      // Their second second coincides with the hazard's force onset at 1.1s.
      if (event && (eventIndex === 2 || eventIndex === 4) && lastCoverEvent !== event.start) {
        const kind = covers[eventIndex === 2 ? 0 : 1];
        state[kind] = { start: event.start + 0.1, direction: random() < 0.5 ? -1 : 1 };
        lastCoverEvent = event.start;
      }
      while (samples.length > 1 && samples[1].time < time - SPLASH_WINDOW) samples.shift();
      if (samples[0].time >= time - SPLASH_WINDOW - 0.06 &&
          samples[0].amount - amount > SPLASH_THRESHOLD && time - lastSplash > 1.4) {
        state.splash = { start: time };
        lastSplash = time;
        samples = [];
      }
      samples.push({ time, amount });
    },
  };
}
