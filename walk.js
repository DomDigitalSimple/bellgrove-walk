const walk = document.getElementById("walk");
const door = document.getElementById("door");
const toBed = document.getElementById("to-bedroom");
const burgerBtn = document.getElementById("burger-btn");
const burger = document.getElementById("burger");
const hud = document.getElementById("hud");
const hudHead = document.getElementById("hud-head");
const hudBody = document.getElementById("hud-body");
const rooms = {
  exterior: document.getElementById("room-exterior"),
  living: document.getElementById("room-living"),
  bedroom: document.getElementById("room-bedroom"),
};
const COPY = {
  living: {
    head: "Open-plan living",
    body: "Island, dining, and sliders in one volume. Indoor-outdoor without a wall.",
  },
  bedroom: {
    head: "Master bedroom",
    body: "Ensuite through the doorway. 360 on the listing still until the splat draws.",
  },
};
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOLD = reduced ? 0 : 1800;
const FRAME_MS = reduced ? 0 : 280;
let flying = false;
let flyGen = 0;
let holdTimer = 0;
let visitedLiving = false;
const EXT_FRAMES = [1,2,3,4,5,6,7,8].map((n) => `fly/ext-fly-0${n}.jpg`);
const KIT_FRAMES = [1,2,3,4,5,6,7,8].map((n) => `fly/kit-orbit-0${n}.jpg`);
[...EXT_FRAMES, ...KIT_FRAMES].forEach((src) => { const i = new Image(); i.src = src; });
function showRoom(id) {
  for (const [key, el] of Object.entries(rooms)) el.hidden = key !== id;
}
function markBurger(id) {
  burger.querySelectorAll("[data-jump]").forEach((btn) => {
    btn.setAttribute("aria-current", btn.dataset.jump === id ? "true" : "false");
  });
}
function setBurger(open) {
  walk.dataset.burger = open ? "open" : "closed";
  burger.hidden = !open;
  burgerBtn.setAttribute("aria-expanded", String(open));
}
function hudDown() {
  walk.dataset.hud = "down";
  hud.setAttribute("aria-hidden", "true");
  toBed.hidden = true;
  clearTimeout(holdTimer);
}
function setCopy(room) {
  const c = COPY[room] || COPY.living;
  hudHead.textContent = c.head;
  hudBody.textContent = c.body;
}
function hudUp(room) {
  setCopy(room);
  walk.dataset.hud = "up";
  hud.setAttribute("aria-hidden", "false");
  toBed.hidden = room !== "living";
}
function killFly() {
  flyGen += 1;
  flying = false;
  walk.dataset.phase = "idle";
  document.getElementById("seq-ext").hidden = true;
  document.getElementById("seq-kit").hidden = true;
}
function playSeq(el, frames) {
  return new Promise((resolve) => {
    if (reduced || !frames.length) { resolve(); return; }
    el.hidden = false;
    let i = 0;
    el.style.backgroundImage = `url("${frames[0]}")`;
    const tick = () => {
      i += 1;
      if (i >= frames.length) { resolve(); return; }
      el.style.backgroundImage = `url("${frames[i]}")`;
      setTimeout(tick, FRAME_MS);
    };
    setTimeout(tick, FRAME_MS);
  });
}
function cutTo(room) {
  killFly();
  setBurger(false);
  walk.dataset.room = room;
  showRoom(room);
  markBurger(room);
  if (room === "living") {
    const first = !visitedLiving;
    visitedLiving = true;
    if (reduced || !first) hudUp("living");
    else {
      hudDown();
      holdTimer = setTimeout(() => hudUp("living"), HOLD);
    }
  } else if (room === "bedroom") {
    hudDown();
    holdTimer = setTimeout(() => hudUp("bedroom"), reduced ? 0 : 900);
  } else {
    hudDown();
  }
}
async function startFly() {
  if (walk.dataset.room !== "exterior" || flying) return;
  const gen = ++flyGen;
  flying = true;
  setBurger(false);
  hudDown();
  walk.dataset.phase = "flying";
  if (reduced) {
    flying = false;
    cutTo("living");
    hudUp("living");
    return;
  }
  await playSeq(document.getElementById("seq-ext"), EXT_FRAMES);
  if (gen !== flyGen) return;
  walk.dataset.phase = "fade";
  rooms.living.hidden = false;
  await new Promise((r) => setTimeout(r, 420));
  if (gen !== flyGen) return;
  flying = false;
  walk.dataset.phase = "idle";
  walk.dataset.room = "living";
  showRoom("living");
  visitedLiving = true;
  markBurger("living");
  hudDown();
  holdTimer = setTimeout(() => hudUp("living"), HOLD);
}
async function flyToBedroom() {
  if (flying) return;
  if (walk.dataset.room === "bedroom") return;
  const gen = ++flyGen;
  flying = true;
  setBurger(false);
  hudDown();
  walk.dataset.phase = "flying";
  walk.dataset.room = "living";
  showRoom("living");
  if (reduced) {
    flying = false;
    cutTo("bedroom");
    return;
  }
  await playSeq(document.getElementById("seq-kit"), KIT_FRAMES);
  if (gen !== flyGen) return;
  walk.dataset.phase = "fade";
  rooms.bedroom.hidden = false;
  await new Promise((r) => setTimeout(r, 480));
  if (gen !== flyGen) return;
  flying = false;
  walk.dataset.phase = "idle";
  walk.dataset.room = "bedroom";
  showRoom("bedroom");
  markBurger("bedroom");
  holdTimer = setTimeout(() => hudUp("bedroom"), 800);
}
door.addEventListener("click", startFly);
toBed.addEventListener("click", flyToBedroom);
burgerBtn.addEventListener("click", () => setBurger(walk.dataset.burger !== "open"));
burger.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-jump]");
  if (!btn) return;
  const target = btn.dataset.jump;
  if (target === "bedroom" && walk.dataset.room !== "bedroom") {
    flyToBedroom();
    return;
  }
  if (target === walk.dataset.room) { setBurger(false); return; }
  cutTo(target);
});
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (walk.dataset.burger === "open") { setBurger(false); return; }
  if (flying) {
    killFly();
    cutTo("living");
    return;
  }
  if (walk.dataset.room === "bedroom") cutTo("living");
});
markBurger("exterior");
showRoom("exterior");
