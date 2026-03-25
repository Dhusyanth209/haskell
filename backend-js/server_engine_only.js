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
