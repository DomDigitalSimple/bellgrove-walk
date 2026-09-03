const walk = document.getElementById("walk");
const door = document.getElementById("door");
const burgerBtn = document.getElementById("burger-btn");
const burger = document.getElementById("burger");
const hud = document.getElementById("hud");
const rooms = {
  exterior: document.getElementById("room-exterior"),
  living: document.getElementById("room-living"),
  bedroom: document.getElementById("room-bedroom"),
};

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FLY = reduced ? 0 : 1500;
const FREEZE = reduced ? 0 : 320;
const FADE = reduced ? 0 : 480;
const HOLD = reduced ? 0 : 2400;

let flying = false;
let flyGen = 0;
let holdTimer = 0;
let visitedLiving = false;

function showRoom(id) {
  for (const [key, el] of Object.entries(rooms)) {
    el.hidden = key !== id;
  }
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
  clearTimeout(holdTimer);
}

function hudUp() {
  walk.dataset.hud = "up";
  hud.setAttribute("aria-hidden", "false");
}

function killFly() {
  flyGen += 1;
  flying = false;
  walk.dataset.phase = "idle";
}

function cutTo(room) {
  killFly();
  setBurger(false);
  walk.dataset.room = room;
  showRoom(room);
  if (room === "living") {
    const first = !visitedLiving;
    visitedLiving = true;
    if (reduced || !first) hudUp();
    else {
      hudDown();
      holdTimer = setTimeout(hudUp, HOLD);
    }
  } else {
    hudDown();
  }
  markBurger(room);
}

function landLiving({ assemble } = { assemble: false }) {
  killFly();
  walk.dataset.room = "living";
  showRoom("living");
  visitedLiving = true;
  markBurger("living");
  if (assemble || reduced) hudUp();
  else {
    hudDown();
    holdTimer = setTimeout(hudUp, HOLD);
  }
}

function startFly() {
  if (walk.dataset.room !== "exterior") return;
  if (flying) return;
  if (reduced) {
    landLiving({ assemble: true });
    return;
  }
  flying = true;
  const gen = ++flyGen;
  setBurger(false);
  hudDown();
  walk.dataset.phase = "flying";
  door.blur();

  window.setTimeout(() => {
    if (gen !== flyGen) return;
    walk.dataset.phase = "freeze";
    rooms.living.hidden = false;
    window.setTimeout(() => {
      if (gen !== flyGen) return;
      walk.dataset.phase = "fade";
      window.setTimeout(() => {
        if (gen !== flyGen) return;
        flying = false;
        walk.dataset.phase = "idle";
        walk.dataset.room = "living";
        showRoom("living");
        visitedLiving = true;
        markBurger("living");
        hudDown();
        holdTimer = setTimeout(hudUp, HOLD);
      }, FADE);
    }, FREEZE);
  }, FLY);
}

door.addEventListener("click", startFly);
burgerBtn.addEventListener("click", () => {
  setBurger(walk.dataset.burger !== "open");
});
burger.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-jump]");
  if (!btn) return;
  const target = btn.dataset.jump;
  if (flying) {
    cutTo(target);
    return;
  }
  if (target === walk.dataset.room) {
    setBurger(false);
    return;
  }
  cutTo(target);
});
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (walk.dataset.burger === "open") {
    setBurger(false);
    return;
  }
  if (flying) {
    landLiving({ assemble: false });
    return;
  }
  if (walk.dataset.room === "bedroom") cutTo("living");
});
markBurger("exterior");
showRoom("exterior");
