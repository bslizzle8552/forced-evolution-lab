const ENVIRONMENTS = {
  "Deep Ocean": {
    bg: "assets/env-deep-ocean.svg",
    danger: "Crushing pressure and darkness",
    weights: { oxygen: 14, pressure: 13, cold: 9, gill: 12, wing: -8, heat: -7 }
  },
  "Desert Heat": {
    bg: "assets/env-desert-heat.svg",
    danger: "Scorching heat and drought",
    weights: { heat: 14, water: 12, metabolism: 10, cold: -9, gill: -7, pressure: -4 }
  },
  "Skyreach": {
    bg: "assets/env-skyreach.svg",
    danger: "Vertical cliffs and thin air",
    weights: { wing: 14, balance: 11, vision: 9, pressure: 5, strength: 4, water: -6 }
  },
  "Gravemaw": {
    bg: "assets/env-gravemaw.svg",
    danger: "High gravity, unstable terrain",
    weights: { strength: 14, reflex: 11, bone: 9, toughness: 10, wing: -7, water: -3 }
  }
};

const TRAIT_NAMES = ["strength","reflex","bone","toughness","recovery","balance","oxygen","pressure","cold","heat","water","metabolism","gill","wing","vision"];
const BASE_TRAITS = Object.fromEntries(TRAIT_NAMES.map(t => [t, 20]));
BASE_TRAITS.gill = 5; BASE_TRAITS.wing = 8;

let state = {
  generation: 1,
  survival: 41,
  mutation: 12,
  stability: 74,
  currentEnv: "Gravemaw",
  traits: { ...BASE_TRAITS },
  autoTimer: null
};

const spriteByGeneration = (g) => g >= 50 ? "assets/subject-gen50.svg" : g >= 35 ? "assets/subject-gen35.svg" : g >= 20 ? "assets/subject-gen20.svg" : g >= 10 ? "assets/subject-gen10.svg" : "assets/subject-gen1.svg";
const $ = (id) => document.getElementById(id);

function appendLog(message, type = "") {
  const li = document.createElement("li");
  if (type) li.classList.add(type);
  li.textContent = `Gen ${state.generation}: ${message}`;
  $("log").prepend(li);
}

function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, v)); }

function evolveOneGeneration() {
  state.generation += 1;
  const weights = ENVIRONMENTS[state.currentEnv].weights;

  for (const t of TRAIT_NAMES) {
    const drift = (Math.random() * 6) - 3;
    const envBoost = (weights[t] || 0) * 0.1;
    state.traits[t] = clamp(state.traits[t] + drift + envBoost);
  }

  state.mutation = clamp(state.mutation + (Math.random() * 14 - 5));
  state.stability = clamp(100 - (state.mutation * 0.55) + (state.traits.recovery * 0.15));

  const survivabilityScore = (
    state.traits.strength + state.traits.reflex + state.traits.toughness + state.traits.recovery +
    state.traits.oxygen + state.traits.pressure + state.traits.balance
  ) / 7;

  state.survival = clamp(Math.round(survivabilityScore + Math.random() * 10 - 7), 1, 99);

  if (state.generation % 5 === 0) appendLog("Mutation burst detected.", "warn");
  if ([10, 20, 35, 50].includes(state.generation)) appendLog(`Structural shift reached milestone Gen ${state.generation}.`);
}

function runGenerations(count) {
  for (let i = 0; i < count; i += 1) evolveOneGeneration();
  appendLog(`Executed ${count} generation${count > 1 ? "s" : ""} in ${state.currentEnv}.`);
  render();
}

function renderEnvironmentCards() {
  const grid = $("envGrid");
  grid.innerHTML = "";

  Object.entries(ENVIRONMENTS).forEach(([name, env]) => {
    const card = document.createElement("article");
    card.className = `env-card${name === state.currentEnv ? " active" : ""}`;
    card.innerHTML = `<img src="${env.bg}" alt="${name}"><b>${name}</b><div class="desc">${env.danger}</div>`;
    card.addEventListener("click", () => {
      state.currentEnv = name;
      appendLog(`Environment switched to ${name}.`);
      render();
    });
    grid.append(card);
  });
}

function renderTraits() {
  const wrap = $("traitBars");
  wrap.innerHTML = "";

  TRAIT_NAMES.forEach((trait) => {
    const value = Math.round(state.traits[trait]);
    const row = document.createElement("div");
    row.className = "trait";
    row.innerHTML = `<label><span>${trait.toUpperCase()}</span><span>${value}</span></label><div class="bar"><div class="fill" style="width:${value}%"></div></div>`;
    wrap.append(row);
  });
}

function renderTimeline() {
  const timeline = $("timeline");
  timeline.innerHTML = "";
  [1, 10, 20, 35, 50].filter((milestone) => state.generation >= milestone).forEach((milestone) => {
    const fig = document.createElement("figure");
    fig.innerHTML = `<img src="${spriteByGeneration(milestone)}" alt="Gen ${milestone}"><figcaption>Gen ${milestone}</figcaption>`;
    timeline.append(fig);
  });
}

function render() {
  const env = ENVIRONMENTS[state.currentEnv];
  $("chamber").style.backgroundImage = `url('${env.bg}')`;
  $("subjectSprite").src = spriteByGeneration(state.generation);
  $("generation").textContent = state.generation;
  $("survival").textContent = `${state.survival}%`;
  $("mutation").textContent = `${Math.round(state.mutation)}%`;
  $("stability").textContent = `${Math.round(state.stability)}%`;
  $("hudEnv").textContent = state.currentEnv.toUpperCase();
  $("hudGen").textContent = `GEN ${state.generation}`;
  $("envBlurb").textContent = env.danger;
  renderEnvironmentCards();
  renderTraits();
  renderTimeline();
}

$("run1").addEventListener("click", () => runGenerations(1));
$("run10").addEventListener("click", () => runGenerations(10));
$("auto").addEventListener("click", () => {
  if (state.autoTimer) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
    $("auto").textContent = "Auto-Evolve";
    appendLog("Auto-Evolve halted.");
    return;
  }

  state.autoTimer = setInterval(() => runGenerations(1), 900);
  $("auto").textContent = "Stop Auto-Evolve";
  appendLog("Auto-Evolve initiated.");
});

$("reset").addEventListener("click", () => {
  if (state.autoTimer) {
    clearInterval(state.autoTimer);
    state.autoTimer = null;
    $("auto").textContent = "Auto-Evolve";
  }

  state = { generation: 1, survival: 41, mutation: 12, stability: 74, currentEnv: state.currentEnv, traits: { ...BASE_TRAITS }, autoTimer: null };
  appendLog("Subject reset to baseline human.", "warn");
  render();
});

$("save").addEventListener("click", () => appendLog("Specimen saved to archive (placeholder)."));

appendLog("Subject introduced to chamber.");
render();
