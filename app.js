//------------------------------------------
// CONFIGURATION
//------------------------------------------
const DENOMS = [
  { key: "n100", label: "$100", value: 10000, target: 0,  type: "note" },
  { key: "n50",  label: "$50",  value: 5000,  target: 1,  type: "note" },
  { key: "n20",  label: "$20",  value: 2000,  target: 10, type: "note" },
  { key: "n10",  label: "$10",  value: 1000,  target: 10, type: "note" },
  { key: "n5",   label: "$5",   value: 500,   target: 10, type: "note" },
  { key: "c2",   label: "$2",   value: 200,   target: 15, type: "coin" },
  { key: "c1",   label: "$1",   value: 100,   target: 11, type: "coin" },
  { key: "c50",  label: "50c",  value: 50,    target: 10, type: "coin" },
  { key: "c20",  label: "20c",  value: 20,    target: 10, type: "coin" },
  { key: "c10",  label: "10c",  value: 10,    target: 10, type: "coin" },
  { key: "c5",   label: "5c",   value: 5,     target: 20, type: "coin" }
];

const ORDER_DESC = [...DENOMS].sort((a, b) => b.value - a.value);
const ORDER_ASC  = [...DENOMS].sort((a, b) => a.value - b.value);

//------------------------------------------
// STATE
//------------------------------------------
let lastExpectedTakingsCents = 0;
let focusMode = false;
let showWhy = false;
let currentStepIndex = 0;
let cachedSteps = [];

//------------------------------------------
// HELPERS
//------------------------------------------
function findDenom(key) {
  return DENOMS.find(d => d.key === key);
}

function centsToDollars(cents) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return sign + "$" + Math.floor(abs / 100) + "." + String(abs % 100).padStart(2, "0");
}

function sumMapValue(map) {
  return Object.keys(map).reduce((sum, key) => {
    const d = findDenom(key);
    return sum + (map[key] || 0) * d.value;
  }, 0);
}

function mapToLines(map) {
  return Object.keys(map)
    .filter(k => map[k] > 0)
    .map(k => `- ${map[k]} × ${findDenom(k).label}`);
}

function mergeMapsSum(a, b) {
  const out = { ...a };
  Object.keys(b).forEach(k => {
    out[k] = (out[k] || 0) + (b[k] || 0);
  });
  Object.keys(out).forEach(k => {
    if (!out[k]) delete out[k];
  });
  return out;
}

function subtractMaps(a, b) {
  // returns a - b (floored at 0)
  const out = { ...a };
  Object.keys(b).forEach(k => {
    out[k] = (out[k] || 0) - (b[k] || 0);
    if (out[k] <= 0) delete out[k];
  });
  return out;
}

function addToMap(target, add) {
  Object.keys(add).forEach(k => {
    target[k] = (target[k] || 0) + (add[k] || 0);
  });
}

function removeFromMap(target, remove) {
  Object.keys(remove).forEach(k => {
    target[k] = (target[k] || 0) - (remove[k] || 0);
    if (target[k] < 0) target[k] = 0;
  });
}

function anyPositive(map) {
  return Object.values(map).some(v => v > 0);
}

/**
 * Change bag “take out” helper:
 * break a value into denominations (greedy, high -> low)
 */
function makeChange(valueCents) {
  const out = {};
  let remaining = valueCents;

  for (const d of ORDER_DESC) {
    const count = Math.floor(remaining / d.value);
    if (count > 0) {
      out[d.key] = count;
      remaining -= count * d.value;
    }
  }

  return { breakdown: out, remaining };
}

/**
 * Key improvement:
 * Choose the smallest SINGLE denomination in Takings that covers `neededValue`.
 * (If there is no single one, fallback to a simple largest-first combination.)
 */
function chooseSmallestSingleDeposit(takings, neededValue) {
  for (const d of ORDER_ASC) {
    if ((takings[d.key] || 0) > 0 && d.value >= neededValue) {
      return { deposit: { [d.key]: 1 }, depositValue: d.value };
    }
  }

  // fallback: combine (largest-first) until covered
  const deposit = {};
  let total = 0;
  for (const d of ORDER_DESC) {
    let available = takings[d.key] || 0;
    while (available > 0 && total < neededValue) {
      deposit[d.key] = (deposit[d.key] || 0) + 1;
      available--;
      total += d.value;
    }
    if (total >= neededValue) break;
  }

  if (total < neededValue) return null;
  return { deposit, depositValue: total };
}

//------------------------------------------
// BUILD TABLES
//------------------------------------------
function buildFloatTable() {
  const rowsContainer = document.getElementById("denomRows");
  if (!rowsContainer) return;
  rowsContainer.innerHTML = "";

  DENOMS.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="denom">${d.label}</td>
      <td><input type="number" min="0" inputmode="numeric" id="input_${d.key}" aria-label="Count of ${d.label} in till"></td>
      <td>${d.target}</td>
      <td id="status_${d.key}" class="status"></td>
    `;
    rowsContainer.appendChild(tr);
  });
}

function buildTakingsCheckTable() {
  const body = document.getElementById("takingsCheckRows");
  if (!body) return;
  body.innerHTML = "";

  DENOMS.forEach(d => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="denom">${d.label}</td>
      <td><input type="number" min="0" inputmode="numeric" id="check_takings_${d.key}" aria-label="Count of ${d.label} in takings"></td>
    `;
    body.appendChild(tr);
  });
}

//------------------------------------------
// RESET
//------------------------------------------
function clearAll() {
  document.querySelectorAll("input[type=number]").forEach(i => (i.value = ""));
  document.getElementById("stepsList") && (document.getElementById("stepsList").innerHTML = "");
  document.getElementById("summaryBox") && (document.getElementById("summaryBox").innerHTML = "");
  document.getElementById("takingsCheckResult") && (document.getElementById("takingsCheckResult").innerHTML = "");
  document.querySelectorAll(".status").forEach(s => (s.textContent = ""));

  cachedSteps = [];
  currentStepIndex = 0;
  lastExpectedTakingsCents = 0;
}

//------------------------------------------
// STEP RENDERING
//------------------------------------------
function renderSteps() {
  const container = document.getElementById("stepsList");
  if (!container) return;
  container.innerHTML = "";

  if (!cachedSteps.length) {
    container.innerHTML = `<p class="placeholder">No swaps needed. Your float is already perfect!</p>`;
    return;
  }

  const stepsToShow = focusMode ? [cachedSteps[currentStepIndex]] : cachedSteps;

  stepsToShow.forEach(step => {
    const div = document.createElement("div");
    div.className = "step";

    div.innerHTML = `
      <label style="display:flex; gap:0.5rem; align-items:flex-start;">
        <input type="checkbox" ${step.done ? "checked" : ""}>
        <div>
          <strong>Step ${step.number}:</strong><br>
          ${step.text}
          ${showWhy && step.why ? `<p style="font-size:0.8rem;color:#555; margin:0.35rem 0 0;">ℹ️ ${step.why}</p>` : ""}
        </div>
      </label>
    `;

    div.querySelector("input").addEventListener("change", e => {
      step.done = e.target.checked;

      if (focusMode && e.target.checked && currentStepIndex < cachedSteps.length - 1) {
        currentStepIndex++;
        renderSteps();
      }
    });

    container.appendChild(div);
  });
}

//------------------------------------------
// MAIN CALCULATION (3-pool model)
//------------------------------------------
function calculate() {
  const counts = {};
  const takings = {};   // inventory of notes/coins in takings
  const needs = {};     // what the float is short (remaining shortages)

  let totalActual = 0;
  let totalTarget = 0;

  // Read counts
  DENOMS.forEach(d => {
    const input = document.getElementById(`input_${d.key}`);
    const val = input ? parseInt(input.value, 10) || 0 : 0;
    counts[d.key] = val;
    takings[d.key] = 0;

    totalActual += val * d.value;
    totalTarget += d.target * d.value;
  });

  // diff vs target
  const diff = {};
  DENOMS.forEach(d => {
    diff[d.key] = counts[d.key] - d.target;
  });

  cachedSteps = [];
  currentStepIndex = 0;
  let stepNumber = 1;

  //--------------------------------
  // STEP A: extras -> Takings (inventory-aware)
  //--------------------------------
  DENOMS.forEach(d => {
    if (diff[d.key] > 0) {
      takings[d.key] += diff[d.key];

      cachedSteps.push({
        number: stepNumber++,
        done: false,
        text: `🟦 Remove <strong>${diff[d.key]} × ${d.label}</strong> from the float and place into <strong>Takings</strong>.`,
        why: "These are extra and should not stay in the float."
      });
    }
  });

  //--------------------------------
  // STEP B: record all shortages
  //--------------------------------
  DENOMS.forEach(d => {
    if (diff[d.key] < 0) {
      needs[d.key] = Math.abs(diff[d.key]);
    }
  });

  //--------------------------------
  // STEP C: First fix shortages directly from Takings (same denom)
  // (If you already have that denom in Takings, just move it into the float.)
  //--------------------------------
  const directMoves = {};
  Object.keys(needs).forEach(key => {
    const canUse = Math.min(needs[key] || 0, takings[key] || 0);
    if (canUse > 0) {
      directMoves[key] = canUse;
      needs[key] -= canUse;
      takings[key] -= canUse;
      if (needs[key] <= 0) delete needs[key];
    }
  });

  if (Object.keys(directMoves).length) {
    cachedSteps.push({
      number: stepNumber++,
      done: false,
      text: `
🟢 Move these from <strong>Takings</strong> into the <strong>Float</strong>:<br>
${mapToLines(directMoves).join("<br>")}
      `.trim(),
      why: "These denominations were already available in Takings, so no breaking is needed."
    });
  }

  //--------------------------------
  // STEP D: Use Change bag for remaining shortages (inventory-aware, smallest-single deposit)
  //--------------------------------
  if (anyPositive(needs)) {
    // total value still needed in cents
    let neededValue = sumMapValue(needs);

    // safety: round up to nearest 5c (should already be, but protects edge cases)
    neededValue = Math.ceil(neededValue / 5) * 5;

    // choose smallest single denom in Takings that covers neededValue
    const depositPlan = chooseSmallestSingleDeposit(takings, neededValue);

    if (!depositPlan) {
      cachedSteps.push({
        number: stepNumber++,
        done: false,
        text: `⚠️ Not enough value in <strong>Takings</strong> to fix the remaining shortages using the Change bag.`,
        why: "There isn’t enough cash available in Takings to exchange for the missing float denominations."
      });
    } else {
      const { deposit, depositValue } = depositPlan;

      // remove deposit from Takings inventory (goes into Change bag)
      removeFromMap(takings, deposit);

      // remainder value comes back as “leftovers” to Takings
      const remainderValue = depositValue - neededValue;
      const remainder = makeChange(remainderValue).breakdown;

      // "Take out" list from change bag = needs + remainder (SUM, not overwrite)
      const takeOut = mergeMapsSum(needs, remainder);

      // Put needs into Float, remainder goes back to Takings
      const intoFloat = { ...needs };
      const intoTakings = { ...remainder };

      // update Takings inventory with remainder coming back
      addToMap(takings, intoTakings);

      cachedSteps.push({
        number: stepNumber++,
        done: false,
        text: `
⚙️ <strong>Use the Change bag to fix the shortages</strong> <span style="font-size:0.9em;">(Change bag value stays the same)</span><br><br>

🟥 <strong>Put into the Change bag</strong> (from Takings):<br>
${mapToLines(deposit).join("<br>")}<br><br>

🟩 <strong>Take out from the Change bag</strong>:<br>
${mapToLines(takeOut).join("<br>")}<br><br>

🟢 <strong>Put into the Float</strong> (to fix shortages):<br>
${mapToLines(intoFloat).join("<br>")}<br><br>

🟦 <strong>Put the leftovers into Takings</strong>:<br>
${Object.keys(intoTakings).length ? mapToLines(intoTakings).join("<br>") : "- (none)"}
        `.trim(),
        why: "We deposit the smallest single available amount from Takings that covers the remaining shortfall, then exchange it into the exact missing denominations plus tidy leftovers."
      });
    }
  }

  //--------------------------------
  // STATUS COLUMN (based on original “in till” vs target)
  //--------------------------------
  DENOMS.forEach(d => {
    const cell = document.getElementById(`status_${d.key}`);
    if (!cell) return;
    const delta = diff[d.key];

    cell.className = "status";
    if (delta === 0) {
      cell.textContent = "Perfect!";
      cell.classList.add("status-perfect");
    } else if (delta > 0) {
      cell.textContent = `Extra ${delta}`;
      cell.classList.add("status-action");
    } else {
      cell.textContent = `Short ${Math.abs(delta)}`;
      cell.classList.add("status-problem");
    }
  });

  //--------------------------------
  // SUMMARY
  //--------------------------------
  const summaryBox = document.getElementById("summaryBox");
  if (summaryBox) {
    summaryBox.innerHTML = `
      <p><strong>Total in till now:</strong> ${centsToDollars(totalActual)}</p>
      <p><strong>Target float total:</strong> ${centsToDollars(totalTarget)}</p>
    `;

    const diffTotal = totalActual - totalTarget;
    lastExpectedTakingsCents = diffTotal;

    summaryBox.innerHTML += diffTotal >= 0
      ? `<p class="good">Takings to bank: ${centsToDollars(diffTotal)}</p>`
      : `<p class="warn">Till short by ${centsToDollars(-diffTotal)}</p>`;

    summaryBox.innerHTML += `
      <p style="font-size:0.8rem; color:#555;">
        Tip: After following steps, re-count the float and press “Show my steps” again until all rows show “Perfect!”.
      </p>
    `;
  }

  renderSteps();
}

//------------------------------------------
// TAKINGS DOUBLE-CHECK
//------------------------------------------
function checkTakings() {
  let countedTakingsCents = 0;

  DENOMS.forEach(d => {
    const input = document.getElementById(`check_takings_${d.key}`);
    const val = input ? parseInt(input.value, 10) || 0 : 0;
    countedTakingsCents += val * d.value;
  });

  const resultBox = document.getElementById("takingsCheckResult");
  if (!resultBox) return;

  resultBox.innerHTML = `
    <p><strong>Your counted takings:</strong> ${centsToDollars(countedTakingsCents)}</p>
    <p><strong>Expected takings:</strong> ${centsToDollars(lastExpectedTakingsCents)}</p>
  `;

  if (countedTakingsCents === lastExpectedTakingsCents) {
    resultBox.innerHTML += `<p class="good">✅ Perfect match! Your cash-up balances.</p>`;
  } else {
    const delta = countedTakingsCents - lastExpectedTakingsCents;
    resultBox.innerHTML += `
      <p class="warn">
        ⚠️ These don't match. Difference: ${centsToDollars(delta)}.<br>
        Re-check counts and any exchanges.
      </p>
    `;
  }
}

//------------------------------------------
// FINISHED BUTTON (confetti + runner + message)
//------------------------------------------
function createConfettiPiece() {
  const confetti = document.createElement("div");
  confetti.classList.add("confetti");
  confetti.style.left = Math.random() * 100 + "vw";
  confetti.style.animationDuration = 2 + Math.random() * 3 + "s";
  confetti.style.opacity = Math.random() + 0.3;
  document.body.appendChild(confetti);
  setTimeout(() => confetti.remove(), 5000);
}

function finished() {
  for (let i = 0; i < 120; i++) createConfettiPiece();

  const runner = document.getElementById("runnerSprite");
  if (runner) {
    runner.classList.remove("run-slide");
    void runner.offsetWidth;
    runner.classList.add("run-slide");
  }

  const msg = document.getElementById("successMessage");
  if (msg) {
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 3000);
  }
}

//------------------------------------------
// EVENT BINDING
//------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  buildFloatTable();
  buildTakingsCheckTable();

  document.getElementById("calculateBtn")?.addEventListener("click", calculate);

  document.getElementById("focusModeToggle")?.addEventListener("change", e => {
    focusMode = e.target.checked;
    renderSteps();
  });

  document.getElementById("whyToggle")?.addEventListener("change", e => {
    showWhy = e.target.checked;
    renderSteps();
  });

  document.getElementById("resetBtn")?.addEventListener("click", () => {
    if (confirm("Clear all counts and steps for the next staff member?")) {
      clearAll();
    }
  });

  document.getElementById("checkTakingsBtn")?.addEventListener("click", checkTakings);

  document.getElementById("finishedBtn")?.addEventListener("click", finished);
});
