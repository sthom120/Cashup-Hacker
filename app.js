//------------------------------------------
// CONFIGURATION
//------------------------------------------
const DENOMS = [
  { key: "n50", label: "$50", value: 5000, target: 1,  type: "note" },
  { key: "n20", label: "$20", value: 2000, target: 10, type: "note" },
  { key: "n10", label: "$10", value: 1000, target: 10, type: "note" },
  { key: "n5",  label: "$5",  value: 500,  target: 10, type: "note" },
  { key: "c2",  label: "$2",  value: 200,  target: 15, type: "coin" },
  { key: "c1",  label: "$1",  value: 100,  target: 11, type: "coin" },
  { key: "c50", label: "50c", value: 50,   target: 10, type: "coin" },
  { key: "c20", label: "20c", value: 20,   target: 10, type: "coin" },
  { key: "c10", label: "10c", value: 10,   target: 10, type: "coin" },
  { key: "c5",  label: "5c",  value: 5,    target: 20, type: "coin" }
];

// Note keys (we can break these)
const NOTE_KEYS = ["n5", "n10", "n20", "n50"];

// Coins in AUD "thinking order"
const COIN_KEYS = ["c2", "c1", "c50", "c20", "c10", "c5"];

//------------------------------------------
// APP SETUP: build the main till table
//------------------------------------------
const rowsContainer = document.getElementById("denomRows");

DENOMS.forEach(denom => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="denom">${denom.label}</td>
    <td><input type="number" min="0" id="input_${denom.key}"></td>
    <td>${denom.target}</td>
    <td id="status_${denom.key}" class="status"></td>
  `;
  rowsContainer.appendChild(tr);
});

// -----------------------------------------
// OPTIONAL: Build the takings double-check table
// (requires a <tbody id="takingsCheckRows"> in your HTML)
// -----------------------------------------
const takingsCheckBody = document.getElementById("takingsCheckRows");
if (takingsCheckBody) {
  DENOMS.forEach(denom => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="denom">${denom.label}</td>
      <td>
        <input type="number" min="0" id="check_takings_${denom.key}">
      </td>
    `;
    takingsCheckBody.appendChild(tr);
  });
}

//------------------------------------------
// HELPERS
//------------------------------------------
function centsToDollars(cents) {
  const sign = cents < 0 ? "-" : "";
  const absolute = Math.abs(cents);
  const dollars = Math.floor(absolute / 100);
  const remainder = absolute % 100;
  const centsStr = remainder.toString().padStart(2, "0");
  return sign + "$" + dollars + "." + centsStr;
}

function findDenom(key) {
  return DENOMS.find(d => d.key === key);
}

// Choose the smallest note that can fully cover the total shortage value.
function chooseBreakNote(totalShortCents) {
  for (const key of NOTE_KEYS) {
    const d = findDenom(key);
    if (totalShortCents <= d.value) return d;
  }
  // If somehow larger than $50, just use a $50
  return findDenom("n50");
}

//------------------------------------------
// MAIN: CALCULATE STEPS
//------------------------------------------
let lastExpectedTakingsCents = 0; // used for double-check

document.getElementById("calculateBtn").addEventListener("click", () => {
  const counts = {};
  let totalActual = 0;
  let totalTarget = 0;

  // 1. Read inputs & totals
  DENOMS.forEach(d => {
    const val = parseInt(document.getElementById(`input_${d.key}`).value) || 0;
    counts[d.key] = val;
    totalActual += val * d.value;
    totalTarget += d.target * d.value;
  });

  // 2. Differences (till - target)
  const diff = {};
  DENOMS.forEach(d => {
    diff[d.key] = counts[d.key] - d.target;
  });

  const steps = [];
  let stepNumber = 1;

  //--------------------------------
  // STEP A: remove all extras to takings
  //--------------------------------
  DENOMS.forEach(d => {
    const extra = diff[d.key];
    if (extra > 0) {
      const text = `
🟦 Remove from the float and place into <strong>daily takings</strong>:
<strong>${extra} × ${d.label}</strong>
      `.trim();

      steps.push({
        id: `step_${stepNumber}`,
        number: stepNumber++,
        text
      });
    }
  });

 //--------------------------------
// STEP B: handle note shortages (now with recommended exchange advice)
//--------------------------------
DENOMS.forEach(d => {
  if (d.type === "note" && diff[d.key] < 0) {
    const short = Math.abs(diff[d.key]);

    // choose a recommended note to break
    // If short is 1–2, usually break the next note up
    let recommendedBreak = null;
    let recommendedYield = 0;

    // Decide recommended note:
    // e.g., to get $5 notes → break a $10 (gives 2×$5)
    //       to get $10 notes → break a $20 (gives 2×$10)
    //       to get $20 notes → break a $50 (gives 2×$20 + $10 but we can simplify)
    if (d.key === "n5") {
      recommendedBreak = findDenom("n10");
      recommendedYield = 2; // from one $10 → two $5
    } else if (d.key === "n10") {
      recommendedBreak = findDenom("n20");
      recommendedYield = 2; // one $20 → two $10
    } else if (d.key === "n20") {
      recommendedBreak = findDenom("n50");
      recommendedYield = 2; // one $50 → two $20 (simplified advice)
    } else {
      recommendedBreak = null; // for $50 shortages we just take $50s directly
    }

    // Build main instruction
    let text = `
🟢 Add to the float from today's daily takings:
<strong>${short} × ${d.label}</strong>
`.trim();

    // Add recommended advice if applicable
    if (recommendedBreak) {
      const rLabel = recommendedBreak.label;

      // If yield = exact number needed (like 2)
      if (recommendedYield === short) {
        text += `
<br><br>
💡 <strong>Recommended:</strong><br>
Break <strong>1 × ${rLabel}</strong> in the cash bag → Take <strong>${short} × ${d.label}</strong>.
        `.trim();
      }

      // If yield produces MORE than needed (overflow into takings)
      else if (recommendedYield > short) {
        const overflow = recommendedYield - short;
        text += `
<br><br>
💡 <strong>Recommended:</strong><br>
Break <strong>1 × ${rLabel}</strong> in the cash bag → Take <strong>${recommendedYield} × ${d.label}</strong>.<br>
Use <strong>${short}</strong> for the float, put <strong>${overflow}</strong> into takings.
        `.trim();
      }
    }

    steps.push({
      id: `step_${stepNumber}`,
      number: stepNumber++,
      text
    });
  }
});


  //--------------------------------
  // STEP C: handle coin shortages with ONE smart breakdown
  //--------------------------------
  const coinShortages = {};
  let totalCoinShortCents = 0;

  COIN_KEYS.forEach(key => {
    if (diff[key] < 0) {
      const shortCount = Math.abs(diff[key]);
      coinShortages[key] = shortCount;
      const d = findDenom(key);
      totalCoinShortCents += shortCount * d.value;
    }
  });

  if (totalCoinShortCents > 0) {
    const breakNote = chooseBreakNote(totalCoinShortCents);

    // Distribute that note value into coins:
    let remainingValue = breakNote.value;

    const addToFloat = {};      // exact missing coins we will add
    const coinsFromBreak = {};  // all coins produced from the note

    // 1) Fill shortages first (largest to smallest coin)
    COIN_KEYS.forEach(key => {
      const d = findDenom(key);
      const needed = coinShortages[key] || 0;
      if (needed <= 0 || remainingValue <= 0) return;

      const maxCanGive = Math.floor(remainingValue / d.value);
      const give = Math.min(needed, maxCanGive);

      if (give > 0) {
        addToFloat[key] = (addToFloat[key] || 0) + give;
        coinsFromBreak[key] = (coinsFromBreak[key] || 0) + give;
        remainingValue -= give * d.value;
        coinShortages[key] -= give;
      }
    });

    // 2) Use remaining value for extra coins (go straight to takings)
    COIN_KEYS.forEach(key => {
      const d = findDenom(key);
      if (remainingValue <= 0) return;
      const extra = Math.floor(remainingValue / d.value);
      if (extra > 0) {
        coinsFromBreak[key] = (coinsFromBreak[key] || 0) + extra;
        remainingValue -= extra * d.value;
      }
    });

    // Build text blocks
    const missingLines = [];
    COIN_KEYS.forEach(key => {
      const originalShort = diff[key] < 0 ? Math.abs(diff[key]) : 0;
      if (originalShort > 0) {
        const d = findDenom(key);
        missingLines.push(`- ${originalShort} × ${d.label}`);
      }
    });

    const coinsFromBreakLines = [];
    COIN_KEYS.forEach(key => {
      const total = coinsFromBreak[key] || 0;
      if (total > 0) {
        const d = findDenom(key);
        coinsFromBreakLines.push(`- ${total} × ${d.label}`);
      }
    });

    const addToFloatLines = [];
    COIN_KEYS.forEach(key => {
      const give = addToFloat[key] || 0;
      if (give > 0) {
        const d = findDenom(key);
        addToFloatLines.push(`- ${give} × ${d.label}`);
      }
    });

    const extraToTakingsLines = [];
    COIN_KEYS.forEach(key => {
      const total = coinsFromBreak[key] || 0;
      const give = addToFloat[key] || 0;
      const extra = total - give;
      if (extra > 0) {
        const d = findDenom(key);
        extraToTakingsLines.push(`- ${extra} × ${d.label}`);
      }
    });

    const text = `
⚠️ The float is still short in some coin denominations.<br><br>
The float is missing:<br>
${missingLines.join("<br>")}<br><br>

To fix this in one go, break <strong>1 × ${breakNote.label}</strong> from today's daily takings into smaller coins:<br><br>

🟥 Put into the cash bag:<br>
- 1 × ${breakNote.label}<br><br>

🟩 Take out in coins:<br>
${coinsFromBreakLines.join("<br>")}<br><br>

🟢 Add these to the float (this fixes the shortages):<br>
${addToFloatLines.join("<br>")}<br><br>

🟦 Put the remaining coins into daily takings:<br>
${extraToTakingsLines.length ? extraToTakingsLines.join("<br>") : "- (none, all coins went into the float)"}
    `.trim();

    steps.push({
      id: `step_${stepNumber}`,
      number: stepNumber++,
      text
    });
  }

  //--------------------------------
  // STATUS COLUMN (quick visual)
  //--------------------------------
  DENOMS.forEach(d => {
    const cell = document.getElementById(`status_${d.key}`);
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
  // DISPLAY STEPS
  //--------------------------------
  const stepsList = document.getElementById("stepsList");
  stepsList.innerHTML = "";

  if (steps.length === 0) {
    stepsList.innerHTML = `<p class="placeholder">No swaps needed. Your float is already perfect!</p>`;
  } else {
    steps.forEach(step => {
      const div = document.createElement("div");
      div.className = "step";
      div.id = step.id;

      const numberSpan = document.createElement("span");
      numberSpan.className = "step-number";
      numberSpan.textContent = `Step ${step.number}: `;
      div.appendChild(numberSpan);

      const textSpan = document.createElement("span");
      textSpan.className = "step-text";
      textSpan.innerHTML = step.text;
      div.appendChild(textSpan);

      stepsList.appendChild(div);
    });
  }

  //--------------------------------
  // SUMMARY BOX + expected takings
  //--------------------------------
  const summaryBox = document.getElementById("summaryBox");
  summaryBox.innerHTML = `
    <p><strong>Total in till now:</strong> ${centsToDollars(totalActual)}</p>
    <p><strong>Target float total:</strong> ${centsToDollars(totalTarget)}</p>
  `;

  const diffTotal = totalActual - totalTarget;
  lastExpectedTakingsCents = diffTotal; // store for double-check use

  if (diffTotal < 0) {
    summaryBox.innerHTML += `
      <p class="warn">Till is short overall by ${centsToDollars(-diffTotal)}.</p>
    `;
  } else {
    summaryBox.innerHTML += `
      <p class="good">Takings (what you will bank): ${centsToDollars(diffTotal)}.</p>
    `;
  }

  summaryBox.innerHTML += `
    <p style="font-size:0.8rem; color:#555;">
      After you follow the steps, re-count the float and press "Show my steps" again to check every row says “Perfect!”.
    </p>
  `;
});

//------------------------------------------
// TAKINGS DOUBLE-CHECK
// (User types how many of each denom went to takings)
//------------------------------------------
const checkBtn = document.getElementById("checkTakingsBtn");
if (checkBtn) {
  checkBtn.addEventListener("click", () => {
    let countedTakingsCents = 0;

    DENOMS.forEach(d => {
      const input = document.getElementById(`check_takings_${d.key}`);
      const val = input ? parseInt(input.value) || 0 : 0;
      countedTakingsCents += val * d.value;
    });

    const resultBox = document.getElementById("takingsCheckResult");
    if (!resultBox) return;

    resultBox.innerHTML = `
      <p><strong>Your counted takings:</strong> ${centsToDollars(countedTakingsCents)}</p>
      <p><strong>Expected takings:</strong> ${centsToDollars(lastExpectedTakingsCents)}</p>
    `;

    if (countedTakingsCents === lastExpectedTakingsCents) {
      resultBox.innerHTML += `
        <p class="good">✅ Perfect match! Your cash-up balances.</p>
      `;
    } else {
      const diff = countedTakingsCents - lastExpectedTakingsCents;
      resultBox.innerHTML += `
        <p class="warn">
          ⚠️ These don't match. Difference: ${centsToDollars(diff)}.
          Please re-check your counts and exchanges.
        </p>
      `;
    }
  });
}

// -----------------------------------------
// FINISHED BUTTON CONFETTI + RUN ANIMATION
// (unchanged from your version)
// -----------------------------------------
document.getElementById("finishedBtn").addEventListener("click", () => {

  // ---- CONFETTI ----
  for (let i = 0; i < 120; i++) {
    createConfettiPiece();
  }

  // ---- RUNNER ----
  const runner = document.getElementById("runnerSprite");
  if (runner) {
    runner.classList.remove("run-slide"); // reset if clicked twice
    void runner.offsetWidth; // force reflow
    runner.classList.add("run-slide");
  }

  // ---- SUCCESS MESSAGE ----
  const msg = document.getElementById("successMessage");
  if (msg) {
    msg.classList.add("show");
    setTimeout(() => msg.classList.remove("show"), 3000);
  }
});

// -----------------------------------------
// CONFETTI GENERATOR
// -----------------------------------------
function createConfettiPiece() {
  const confetti = document.createElement("div");
  confetti.classList.add("confetti");

  // randomize position, duration, opacity
  confetti.style.left = Math.random() * 100 + "vw";
  confetti.style.animationDuration = 2 + Math.random() * 3 + "s";
  confetti.style.opacity = Math.random() + 0.3;

  document.body.appendChild(confetti);

  // remove after falling
  setTimeout(() => confetti.remove(), 5000);
}
