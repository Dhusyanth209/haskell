const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

/* ══════════════════════════════════════
   LOTKA-VOLTERRA ENGINE (CORRECTED)
   ══════════════════════════════════════
   
   The classic Lotka-Volterra model:
   
   For PREY (producers):
     dN/dt = r*N*(1 - N/K) - sum(rate * N * Predator_pop)
     r = intrinsic growth rate
     K = carrying capacity
   
   For PREDATORS:
     dN/dt = sum(efficiency * rate * N * Prey_pop) - d*N
     d = natural death rate
     efficiency = conversion efficiency (prey biomass → predator biomass)
   
   This ensures:
   - Producers grow logistically (with carrying capacity)
   - Predators DECLINE without prey (natural death rate)
   - Populations stay bounded and realistic
   ══════════════════════════════════════ */

const PRODUCER_GROWTH = 0.1;   // r: intrinsic growth rate for producers
const CARRYING_CAPACITY = 200; // K: max producer population
const PREDATOR_DEATH = 0.05;   // d: natural death rate for consumers
const CONVERSION_EFF = 0.4;    // e: biomass conversion efficiency

function getPop(name, speciesList) {
    const s = speciesList.find(sp => sp.name === name);
    return s ? s.population : 0;
}

function isProducer(web, speciesName) {
    // A producer is a species that doesn't eat anything (never appears as 'predator' in interactions)
    return !web.interactions.some(i => i.predator === speciesName);
}

function updateSpecies(web, sp) {
    const N = sp.population;
    if (N <= 0) return { ...sp, population: 0 };

    const producer = isProducer(web, sp.name);

    // Predation loss: How much this species loses to its predators
    const predationLoss = web.interactions
        .filter(i => i.prey === sp.name)
        .reduce((sum, i) => sum + (i.rate * N * getPop(i.predator, web.speciesList)), 0);

    let newPop;

    if (producer) {
        // PRODUCER: logistic growth - predation loss
        const growth = PRODUCER_GROWTH * N * (1 - N / CARRYING_CAPACITY);
        newPop = N + growth - predationLoss;
    } else {
        // CONSUMER: gains from eating prey - natural death
        const preyGain = web.interactions
            .filter(i => i.predator === sp.name)
            .reduce((sum, i) => sum + (CONVERSION_EFF * i.rate * N * getPop(i.prey, web.speciesList)), 0);

        const death = PREDATOR_DEATH * N;
        newPop = N + preyGain - death - predationLoss;
    }

    return { ...sp, population: Math.max(0, newPop) };
}

function simulateStep(web) {
    return { ...web, speciesList: web.speciesList.map(s => updateSpecies(web, s)) };
}

function simulate(web, steps) {
    let result = JSON.parse(JSON.stringify(web));
    for (let i = 0; i < steps; i++) result = simulateStep(result);
    return result;
}

function getStability(web) {
    const alive = web.speciesList.filter(s => s.population > 0.1).length;
    return web.speciesList.length === 0 ? 0 : alive / web.speciesList.length;
}

function removeSpecies(web, name) {
    return {
        ...web,
        speciesList: web.speciesList.filter(s => s.name !== name),
        interactions: web.interactions.filter(i => i.predator !== name && i.prey !== name)
    };
}

function findKeystone(web) {
    const results = web.speciesList.map(sp => {
        const reduced = removeSpecies(web, sp.name);
        const after = simulate(reduced, 20);
        return { name: sp.name, stability: getStability(after) };
    });
    if (results.length === 0) return "None";
    results.sort((a, b) => a.stability - b.stability);
    return results[0].name;
}

/* ══════════════════════════════════════
   TROPHIC LEVEL DETECTION
   ══════════════════════════════════════ */
function getTrophicLevels(web) {
    const levels = {};
    const speciesNames = web.speciesList.map(s => s.name);
    const isPredator = new Set(web.interactions.map(i => i.predator));

    speciesNames.forEach(name => {
        if (!isPredator.has(name)) {
            levels[name] = { level: 1, role: "Producer" };
        }
    });

    let changed = true;
    while (changed) {
        changed = false;
        web.interactions.forEach(i => {
            if (levels[i.prey] && !levels[i.predator]) {
                levels[i.predator] = { level: levels[i.prey].level + 1, role: "" };
                changed = true;
            } else if (levels[i.prey] && levels[i.predator] &&
                levels[i.predator].level <= levels[i.prey].level) {
                levels[i.predator] = { level: levels[i.prey].level + 1, role: "" };
                changed = true;
            }
        });
    }

    Object.keys(levels).forEach(name => {
        const lvl = levels[name].level;
        if (lvl === 1) levels[name].role = "Producer";
        else if (lvl === 2) levels[name].role = "Primary Consumer";
        else if (lvl === 3) levels[name].role = "Secondary Consumer";
        else if (lvl === 4) levels[name].role = "Tertiary Consumer";
        else levels[name].role = "Apex Predator";
        const isEaten = web.interactions.some(i => i.prey === name);
        if (!isEaten && lvl > 1) levels[name].role = "Apex Predator";
    });

    return levels;
}

/* ══════════════════════════════════════
   RECOVERY STRATEGY GENERATOR
   ══════════════════════════════════════ */
function generateRecoveryStrategies(removedSpecies, impacts, trophicLevels) {
    const strategies = [];

    strategies.push({
        type: "Species Reintroduction",
        icon: "🦎",
        priority: "HIGH",
        description: `Reintroduce ${removedSpecies} population through controlled breeding programs or relocation from stable populations.`,
        example: "Similar to wolf reintroduction in Yellowstone National Park (1995), which restored the entire ecosystem."
    });

    const increased = impacts.filter(i => i.change > 20);
    const decreased = impacts.filter(i => i.change < -20);

    if (increased.length > 0) {
        strategies.push({
            type: "Population Control",
            icon: "📊",
            priority: "MEDIUM",
            description: `Control overpopulation of ${increased.map(i => i.name).join(", ")} through managed harvesting or natural predator support.`,
            example: "Controlled deer population management when wolf populations decline."
        });
    }

    if (decreased.length > 0) {
        const isProducerAffected = decreased.some(i => trophicLevels[i.name]?.level === 1);
        if (isProducerAffected) {
            strategies.push({
                type: "Habitat Restoration",
                icon: "🌱",
                priority: "HIGH",
                description: "Restore vegetation and primary producers through replanting and habitat protection programs.",
                example: "Grassland restoration projects in degraded ecosystems to rebuild the food web foundation."
            });
        }
        strategies.push({
            type: "Protected Area Designation",
            icon: "🛡️",
            priority: "MEDIUM",
            description: `Establish protected zones to shield declining species: ${decreased.map(i => i.name).join(", ")}.`,
            example: "Marine Protected Areas (MPAs) have shown 446% increase in fish biomass on average."
        });
    }

    const herbivoreIncrease = increased.filter(i => trophicLevels[i.name]?.level === 2);
    if (herbivoreIncrease.length > 0) {
        strategies.push({
            type: "Biological Pest Control",
            icon: "🐞",
            priority: "MEDIUM",
            description: `Introduce natural predators to control ${herbivoreIncrease.map(i => i.name).join(", ")} population surge.`,
            example: "Ladybugs controlling aphid populations, or barn owls managing rodent outbreaks."
        });
    }

    strategies.push({
        type: "Long-term Monitoring",
        icon: "📡",
        priority: "LOW",
        description: "Deploy biodiversity sensors and conduct regular population surveys to track recovery progress.",
        example: "Camera traps and eDNA sampling for continuous ecosystem health monitoring."
    });

    return strategies;
}

/* API ENDPOINTS */

app.post('/simulate', (req, res) => {
  const web = req.body;
  const result = simulate(web, 20);
  const stability = getStability(result);
  const keystone = findKeystone(web);
  res.json({ result, stability, keystone });
});

app.post('/extinction', (req, res) => {
  const { ecosystem, removedSpecies } = req.body;
  const trophicLevels = getTrophicLevels(ecosystem);
  const originalPops = {};
  ecosystem.speciesList.forEach(s => { originalPops[s.name] = s.population; });
  const reduced = removeSpecies(ecosystem, removedSpecies);
  const after = simulate(reduced, 20);
  const stabilityAfter = getStability(after);
  const impacts = after.speciesList.map(s => {
    const original = originalPops[s.name] || 0;
    const change = original > 0 ? ((s.population - original) / original) * 100 : 0;
    return { name: s.name, before: original, after: s.population, change: parseFloat(change.toFixed(1)), status: s.population < 0.1 ? 'EXTINCT' : change < -50 ? 'CRITICAL' : change < -20 ? 'DECLINING' : change > 20 ? 'SURGING' : 'STABLE' };
  });
  const cascadeChain = [{ event: removedSpecies + ' removed', type: 'trigger' }];
  impacts.forEach(imp => {
    if (imp.status === 'EXTINCT') cascadeChain.push({ event: imp.name + ' goes extinct', type: 'extinction' });
    else if (imp.status === 'CRITICAL') cascadeChain.push({ event: imp.name + ' critical', type: 'decline' });
    else if (imp.status === 'SURGING') cascadeChain.push({ event: imp.name + ' surges +' + imp.change.toFixed(0) + '%', type: 'surge' });
    else if (imp.status === 'DECLINING') cascadeChain.push({ event: imp.name + ' declines ' + imp.change.toFixed(0) + '%', type: 'decline' });
  });
  const originalBiomass = ecosystem.speciesList.reduce((sum, s) => sum + s.population, 0);
  const finalBiomass = after.speciesList.reduce((sum, s) => sum + s.population, 0);
  const biomassLoss = ((originalBiomass - finalBiomass) / originalBiomass * 100).toFixed(1);
  const strategies = generateRecoveryStrategies(removedSpecies, impacts, trophicLevels);
  const timeline = [];
  let cur = JSON.parse(JSON.stringify(reduced));
  for (let step = 0; step <= 20; step++) {
    const entry = { step };
    cur.speciesList.forEach(s => { entry[s.name] = parseFloat(s.population.toFixed(1)); });
    timeline.push(entry);
    cur = simulateStep(cur);
  }
  res.json({ removedSpecies, removedRole: trophicLevels[removedSpecies] ? trophicLevels[removedSpecies].role : 'Unknown', stabilityBefore: 1.0, stabilityAfter, biomassLoss: parseFloat(biomassLoss), impacts, cascadeChain, strategies, timeline, trophicLevels, result: after });
});

app.post('/recovery', (req, res) => {
  const { ecosystem, removedSpecies, reintroducePop } = req.body;
  const reduced = removeSpecies(ecosystem, removedSpecies);
  const degraded = simulate(reduced, 20);
  const sp = ecosystem.speciesList.find(s => s.name === removedSpecies);
  const reintroduced = { ...degraded, speciesList: [...degraded.speciesList, { name: removedSpecies, population: reintroducePop || 5, icon: sp ? sp.icon : '' }], interactions: ecosystem.interactions };
  const timeline = [];
  let cur = JSON.parse(JSON.stringify(reduced));
  for (let step = 0; step <= 20; step++) {
    const entry = { step, phase: 'Degradation' };
    cur.speciesList.forEach(s => { entry[s.name] = parseFloat(s.population.toFixed(1)); });
    entry[removedSpecies] = 0;
    timeline.push(entry);
    cur = simulateStep(cur);
  }
  cur = JSON.parse(JSON.stringify(reintroduced));
  for (let step = 21; step <= 50; step++) {
    const entry = { step, phase: 'Recovery' };
    cur.speciesList.forEach(s => { entry[s.name] = parseFloat(s.population.toFixed(1)); });
    timeline.push(entry);
    cur = simulateStep(cur);
  }
  const finalStability = getStability(cur);
  const originalPops = {};
  ecosystem.speciesList.forEach(s => { originalPops[s.name] = s.population; });
  const recoveryScores = cur.speciesList.map(s => {
    const orig = originalPops[s.name] || 0;
    const pct = orig > 0 ? (s.population / orig * 100) : 0;
    return { name: s.name, original: orig, recovered: parseFloat(s.population.toFixed(1)), recoveryPct: parseFloat(pct.toFixed(1)) };
  });
  res.json({ timeline, finalStability, recoveryScores, removedSpecies, reintroduceStep: 20 });
});

app.post('/sensitivity', (req, res) => {
  const { ecosystem } = req.body;
  const names = ecosystem.speciesList.map(s => s.name);
  const matrix = [];
  names.forEach(removed => {
    const reduced = removeSpecies(ecosystem, removed);
    const after = simulate(reduced, 20);
    const row = { removed };
    names.forEach(target => {
      if (target === removed) { row[target] = -100; return; }
      const orig = ecosystem.speciesList.find(s => s.name === target).population || 0;
      const fin = after.speciesList.find(s => s.name === target);
      row[target] = orig > 0 ? parseFloat(((( fin ? fin.population : 0) - orig) / orig * 100).toFixed(1)) : 0;
    });
    matrix.push(row);
  });
  res.json({ species: names, matrix });
});

app.post('/risk-scores', (req, res) => {
  const { ecosystem } = req.body;
  const trophicLevels = getTrophicLevels(ecosystem);
  const scores = ecosystem.speciesList.map(sp => {
    const dependents = ecosystem.interactions.filter(i => i.prey === sp.name).length;
    const foodSources = ecosystem.interactions.filter(i => i.predator === sp.name).length;
    const popRisk = Math.max(0, 1 - sp.population / 100);
    const trophicLevel = trophicLevels[sp.name] ? trophicLevels[sp.name].level : 1;
    const trophicRisk = trophicLevel / 5;
    const singleSource = foodSources <= 1 && trophicLevel > 1 ? 0.3 : 0;
    const risk = Math.min(100, Math.round((popRisk * 30) + (trophicRisk * 25) + (singleSource * 20) + ((1 - foodSources / Math.max(1, ecosystem.speciesList.length)) * 15) + (dependents > 0 ? 0 : 10)));
    const reduced = removeSpecies(ecosystem, sp.name);
    const after = simulate(reduced, 20);
    const impactScore = Math.round((1 - getStability(after)) * 100);
    return { name: sp.name, icon: sp.icon, population: sp.population, trophicLevel, role: trophicLevels[sp.name] ? trophicLevels[sp.name].role : 'Unknown', riskScore: risk, impactScore, riskLevel: risk > 70 ? 'CRITICAL' : risk > 40 ? 'VULNERABLE' : 'STABLE', foodSources, dependents, factors: { popRisk: Math.round(popRisk * 30), trophicRisk: Math.round(trophicRisk * 25), singleSource: Math.round(singleSource * 20) } };
  });
  scores.sort((a, b) => b.riskScore - a.riskScore);
  res.json({ scores });
});

app.post('/multi-extinction', (req, res) => {
  const { ecosystem, removedSpecies } = req.body;
  const trophicLevels = getTrophicLevels(ecosystem);
  const originalPops = {};
  ecosystem.speciesList.forEach(s => { originalPops[s.name] = s.population; });
  let current = JSON.parse(JSON.stringify(ecosystem));
  const phaseResults = [];
  removedSpecies.forEach((name, idx) => {
    current = removeSpecies(current, name);
    const after = simulate(current, 20);
    const phaseImpacts = after.speciesList.map(s => {
      const orig = originalPops[s.name] || 0;
      const change = orig > 0 ? ((s.population - orig) / orig * 100) : 0;
      return { name: s.name, before: orig, after: s.population, change: parseFloat(change.toFixed(1)), status: s.population < 0.1 ? 'EXTINCT' : change < -50 ? 'CRITICAL' : change < -20 ? 'DECLINING' : change > 20 ? 'SURGING' : 'STABLE' };
    });
    phaseResults.push({ phase: idx + 1, removed: name, role: trophicLevels[name] ? trophicLevels[name].role : 'Unknown', stability: getStability(after), impacts: phaseImpacts });
    current = after;
  });
  const timeline = [];
  let simWeb = JSON.parse(JSON.stringify(ecosystem));
  let stepCounter = 0;
  removedSpecies.forEach((name, phaseIdx) => {
    simWeb = removeSpecies(simWeb, name);
    for (let s = 0; s <= 20; s++) {
      const entry = { step: stepCounter, phase: 'Phase ' + (phaseIdx + 1) + ': -' + name };
      simWeb.speciesList.forEach(sp => { entry[sp.name] = parseFloat(sp.population.toFixed(1)); });
      removedSpecies.slice(0, phaseIdx + 1).forEach(r => { if (!entry[r]) entry[r] = 0; });
      timeline.push(entry);
      simWeb = simulateStep(simWeb);
      stepCounter++;
    }
  });
  const finalStability = getStability(current);
  const originalBiomass = ecosystem.speciesList.reduce((sum, s) => sum + s.population, 0);
  const finalBiomass = current.speciesList.reduce((sum, s) => sum + s.population, 0);
  const totalBiomassLoss = parseFloat(((originalBiomass - finalBiomass) / originalBiomass * 100).toFixed(1));
  const surviving = current.speciesList.filter(s => s.population > 0.1).length;
  res.json({ removedSpecies, phaseResults, timeline, finalStability, totalBiomassLoss, surviving, totalSpecies: ecosystem.speciesList.length });
});

app.listen(port, () => { console.log('Backend listening at http://localhost:' + port); });
