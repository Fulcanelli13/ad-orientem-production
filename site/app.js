/* Navigation only. No liturgical sources are imported into this foundation. */
const MODULES = Object.freeze({
  mass: {
    title: "The Holy Mass",
    latin: "Introibo ad altare Dei",
    description: "The approved Mass reader, its canonical liturgical texts and the complete 65-card LIVE sequence are awaiting a selected transfer."
  },
  pray: {
    title: "The Life of Prayer",
    latin: "Orate sine intermissione",
    description: "The interactive church, Angelus, Regina Cæli, Rosary and other devotional experiences will arrive only in their approved versions."
  },
  calendar: {
    title: "The Calendar",
    latin: "Tempus acceptabile",
    description: "The 1962 Roman liturgical calendar, its observances, propers and commemorations have not been transferred. The dates on Home are civil dates only."
  },
  atlas: {
    title: "The Sacred Atlas",
    latin: "In omnem terram",
    description: "The canonical church and community registry, verified locations and Sacred Atlas interface are still in the research repository."
  },
  formation: {
    title: "Formation",
    latin: "Veritas liberabit vos",
    description: "The formation library and guides remain in research until their content, presentation and dependencies are approved."
  }
});
const byId = (id) => document.getElementById(id);
const VALID_ROUTES = new Set(["home", ...Object.keys(MODULES)]);

function routeFromHash() {
  const route = decodeURIComponent(window.location.hash.replace(/^#/, ""));
  return VALID_ROUTES.has(route) ? route : "home";
}
function showRoute(route, updateHistory = true) {
  if (!VALID_ROUTES.has(route)) route = "home";
  const home = route === "home";
  byId("home-view").hidden = !home;
  byId("module-view").hidden = home;
  if (!home) {
    const details = MODULES[route];
    byId("module-title").textContent = details.title;
    byId("module-latin").textContent = details.latin;
    byId("module-description").textContent = details.description;
  }
  document.querySelectorAll(".tabbar .tab").forEach(button => {
    const selected = button.dataset.route === route;
    button.classList.toggle("active", selected);
    if (selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (updateHistory && route !== routeFromHash()) {
    window.history.pushState({ route }, "", "#" + route);
  }
  window.scrollTo({ top: 0, behavior: "instant" });
  if (!home) byId("module-title").focus({ preventScroll: true });
}
function createCivilWeek() {
  const now = new Date();
  const locale = document.documentElement.lang || "en";
  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const longFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const grid = byId("civil-week");
  grid.replaceChildren();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
    const selected = date.toDateString() === now.toDateString();
    const cell = document.createElement("div");
    cell.className = "civil-day" + (i === 0 ? " sunday" : "") + (selected ? " today" : "");
    cell.setAttribute("aria-label", longFormatter.format(date) + (selected ? ", today" : ""));
    if (selected) cell.setAttribute("aria-current", "date");
    const name = document.createElement("small");
    name.textContent = dayFormatter.format(date).charAt(0).toUpperCase();
    const number = document.createElement("span");
    number.textContent = String(date.getDate());
    cell.append(name, number);
    grid.append(cell);
  }
}
document.addEventListener("click", event => {
  const button = event.target.closest("button[data-route]");
  if (button) showRoute(button.dataset.route);
});
byId("back-button").addEventListener("click", () => showRoute("home"));
byId("about-button").addEventListener("click", () => byId("about-dialog").showModal());
byId("prayer-art-expand").addEventListener("click", () => byId("prayer-art-dialog").showModal());
/* The V9 home has a three-panel hero; secondary panels are labelled previews. */
let heroIndex = 0;
const heroPanels = [...document.querySelectorAll(".home-hero .hero-panel")];
const heroDots = [...document.querySelectorAll(".home-hero .hero-dots button")];
function showHero(index) {
  heroIndex = ((index % heroPanels.length) + heroPanels.length) % heroPanels.length;
  heroPanels.forEach((panel, i) => {
    const active = i === heroIndex;
    panel.classList.toggle("active", active);
    panel.setAttribute("aria-hidden", String(!active));
    /* Prevent hidden slide buttons from receiving keyboard focus. */
    panel.inert = !active;
  });
  heroDots.forEach((dot, i) => {
    const active = i === heroIndex;
    dot.classList.toggle("active", active);
    dot.setAttribute("aria-pressed", String(active));
  });
}
document.querySelectorAll("[data-slide-go]").forEach(button =>
  button.addEventListener("click", () => showHero(Number(button.dataset.slideGo)))
);
document.querySelectorAll("[data-slide-move]").forEach(button =>
  button.addEventListener("click", () => showHero(heroIndex + Number(button.dataset.slideMove)))
);
const homeHero = document.querySelector(".home-hero");
let touchStartX = null;
let touchStartY = null;
homeHero.addEventListener("touchstart", event => {
  if (event.touches.length !== 1) return;
  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });
homeHero.addEventListener("touchend", event => {
  if (touchStartX == null || !event.changedTouches.length) return;
  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;
  touchStartX = touchStartY = null;
  if (Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
    showHero(heroIndex + (deltaX < 0 ? 1 : -1));
  }
}, { passive: true });
homeHero.addEventListener("keydown", event => {
  if (event.key === "ArrowRight") { showHero(heroIndex + 1); event.preventDefault(); }
  if (event.key === "ArrowLeft") { showHero(heroIndex - 1); event.preventDefault(); }
});
showHero(0);
window.addEventListener("popstate", () => showRoute(routeFromHash(), false));
window.addEventListener("hashchange", () => showRoute(routeFromHash(), false));
createCivilWeek();
showRoute(routeFromHash(), false);
