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
  const mondayOffset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset);
  const grid = byId("civil-week");
  grid.replaceChildren();
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const selected = date.toDateString() === now.toDateString();
    const cell = document.createElement("div");
    cell.className = "civil-day" + (selected ? " today" : "");
    cell.setAttribute("aria-label", longFormatter.format(date) + (selected ? ", today" : ""));
    if (selected) cell.setAttribute("aria-current", "date");
    const name = document.createElement("small");
    name.textContent = dayFormatter.format(date).slice(0, 2).toUpperCase();
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
byId("art-info").addEventListener("click", () => {
  const note = byId("art-note");
  note.hidden = !note.hidden;
  byId("art-info").setAttribute("aria-expanded", String(!note.hidden));
});
window.addEventListener("popstate", () => showRoute(routeFromHash(), false));
window.addEventListener("hashchange", () => showRoute(routeFromHash(), false));
createCivilWeek();
showRoute(routeFromHash(), false);
