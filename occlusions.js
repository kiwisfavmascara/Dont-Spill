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
  let coverCount = 0, nextCover = 4 + random() * 4;
  const state = { cloth: null, fog: null, splash: null, spiderStart: 3 + random() * 18 };
  let samples = [{ time: 0, amount: 100 }], lastCoverEvent = -1;
  let lastSplash = -10;
  return {
    state,
    update(time, amount, event, eventIndex) {
      // Independent cover choices and spacing: no fixed second/fourth-event pattern.
      if (event && time >= nextCover && lastCoverEvent !== event.start && coverCount < 3) {
        const kind = random() < .5 ? "cloth" : "fog";
        state[kind] = { start: time + random() * .5, direction: random() < .5 ? -1 : 1 };
        lastCoverEvent = event.start;
        coverCount++;
        nextCover = time + 6 + random() * 4;
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
