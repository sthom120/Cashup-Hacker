//------------------------------------------
// CONFIGURATION
//------------------------------------------
const DENOMS = [
  { key: "n50", label: "$50", value: 5000, target: 1 },
  { key: "n20", label: "$20", value: 2000, target: 10 },
  { key: "n10", label: "$10", value: 1000, target: 10 },
  { key: "n5",  label: "$5",  value: 500,  target: 10 },
  { key: "c2",  label: "$2",  value: 200,  target: 15 },
  { key: "c1",  label: "$1",  value: 100,  target: 11 },
  { key: "c50", label: "50c", value: 50,   target: 10 },
  { key: "c20", label: "20c", value: 20,   target: 10 },
  { key: "c10", label: "10c", value: 10,   target: 10 },
  { key: "c5",  label: "5c",  value: 5,    target: 20 }
];

// Preferred & fallback swap variants (all equal value)
const BREAK_VARIANTS = {
  n50: [
    [ { denomKey: "n20", count: 2 }, { denomKey: "n10", count: 1 } ],
    [ { denomKey: "n20", count: 1 }, { denomKey: "n10", count: 3 } ],
    [ { denomKey: "n10", count: 5 } ]
  ],
  n20: [
    [ { denomKey: "n10", count: 2 } ],
    [ { denomKey: "n10", count: 1 }, { denomKey: "n5", count: 2 } ]
  ],
  n10: [
    [ { denomKey: "n5", count: 2 } ],
    [ { denomKey: "n5", count: 1 }, { denomKey: "c1", count: 5 } ]
  ],
  n5: [
    [ { denomKey: "c1", count: 5 } ],
    [ { denomKey: "c2", count: 2 }, { denomKey: "c1", count: 1 } ]
  ],
  c2: [
    [ { denomKey: "c1", count: 2 } ],
    [ { denomKey: "c1", count: 1 }, { denomKey: "c50", count: 2 } ]
  ],
  c1: [
    [ { denomKey: "c50", count: 2 } ],
    [ { denomKey: "c50", count: 1 }, { denomKey: "c20", count: 2 }, { denomKey: "c10", count: 1 } ]
  ],
  c50: [
    [ { denomKey: "c20", count: 2 }, { denomKey: "c10", count: 1 } ],
    [ { denomKey: "c10", count: 5 } ]
  ],
  c20: [
    [ { denomKey: "c10", count: 2 } ],
    [ { denomKey: "c10", count: 1 }, { denomKey: "c5", count: 2 } ]
  ],
  c10: [
    [ { denomKey: "c5", count: 2 } ]
  ]
};

//------------------------------------------
// APP SETUP
//------------------------------------------
const rowsContainer = document.getElementById("denomRows");

// Build table rows dynamically
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

function hasAnyShortage(diff) {
  return DENOMS.some(d => diff[d.key] < 0);
}

function findDenom(key) {
  return DENOMS.find(d => d.key === key);
}

function shortageValue(diff, startIndex) {
  // sum of value of shortages from startIndex downward
  let total = 0;
  for (let i = startIndex; i < DENOMS.length; i++) {
    const d = DENOMS[i];
    if (diff[d.key] < 0) {
      total += (-diff[d.key]) * d.value;
    }
  }
  return total;
}

//------------------------------------------
// MAIN: CALCULATE STEPS
//------------------------------------------
document.getElementById("calculateBtn").addEventListener("click", () => {

  //-------------------------------
  // STEP 1: Read inputs
  //-------------------------------
  const counts = {};
  let totalActual = 0;
  let totalTarget = 0;

  DENOMS.forEach(d => {
    const val = parseInt(document.getElementById(`input_${d.key}`).value) || 0;
    counts[d.key] = val;
    totalActual += val * d.value;
    totalTarget += d.target * d.value;
  });

  //-------------------------------
  // STEP 2: Base diff (for status)
  //-------------------------------
  const baseDiff = {};
  DENOMS.forEach(d => {
    baseDiff[d.key] = counts[d.key] - d.target;
  });

  //-------------------------------
  // STEP 3: Working diff (for algorithm)
  //-------------------------------
  const diff = {};
  DENOMS.forEach(d => {
    diff[d.key] = baseDiff[d.key];
  });

  const steps = [];
  let stepNumber = 1;

  // track how many times we break each higher denom
  const breakUsage = {};
  DENOMS.forEach(d => (breakUsage[d.key] = 0));

  //-------------------------------
  // PHASE 1: USE EXCESS TO FIX SHORTAGES (grouped)
  //-------------------------------
  for (let i = 0; i < DENOMS.length; i++) {
    const higher = DENOMS[i];
    const key = higher.key;

    while (diff[key] > 0 && hasAnyShortage(diff)) {
      // Is any lower denomination short?
      let lowerShort = false;
      for (let j = i + 1; j < DENOMS.length; j++) {
        if (diff[DENOMS[j].key] < 0) {
          lowerShort = true;
          break;
        }
      }
      if (!lowerShort) break;

      const variants = BREAK_VARIANTS[key];
      if (!variants) break;

      const chosen = variants[0];

      const before = shortageValue(diff, i + 1);

      // try breaking one note/coin of this denom
      diff[key] -= 1;
      chosen.forEach(part => {
        diff[part.denomKey] += part.count;
      });

      const after = shortageValue(diff, i + 1);

      if (after < before) {
        // this break actually helped → keep it
        breakUsage[key] += 1;
      } else {
        // revert & stop breaking this denom
        diff[key] += 1;
        chosen.forEach(part => {
          diff[part.denomKey] -= part.count;
        });
        break;
      }
    }
  }

  //-------------------------------
  // BUILD GROUPED SWAP STEPS
  //-------------------------------
  Object.keys(breakUsage).forEach(key => {
    const times = breakUsage[key];
    if (times <= 0) return;

    const higher = findDenom(key);
    const variants = BREAK_VARIANTS[key];

    const variantTexts = variants.map(v => {
      const partsText = v
        .map(part => {
          const d = findDenom(part.denomKey);
          const totalCount = part.count * times;
          return `${totalCount} × ${d.label}`;
        })
        .join(", ");

      return `
🟥 Put into the cash bag: <strong>${times} × ${higher.label}</strong><br>
🟩 Take out from the cash bag and add to the float: <strong>${partsText}</strong>
      `.trim();
    });

    steps.push({
      id: `step_${stepNumber}`,
      number: stepNumber,
      variants: variantTexts,
      currentIndex: 0
    });
    stepNumber++;
  });

  //-------------------------------
  // PHASE 2: REMOVE FINAL EXCESS AS TAKINGS (grouped)
  //-------------------------------
  let takings = 0;

  DENOMS.forEach(d => {
    if (diff[d.key] > 0) {
      const extra = diff[d.key];
      takings += extra * d.value;

      const text = `
🟦 Remove from the float and place into <strong>daily takings</strong>:
<strong>${extra} × ${d.label}</strong>
      `.trim();

      steps.push({
        id: `step_${stepNumber}`,
        number: stepNumber,
        variants: [text],
        currentIndex: 0
      });
      stepNumber++;
    }
  });

  //-------------------------------
  // PHASE 3: HANDLE REMAINING SHORTAGES
  //-------------------------------
  const remainingShortages = DENOMS.filter(d => diff[d.key] < 0);

  if (remainingShortages.length > 0) {
    // SPECIAL CASE: exactly Short 1 × 5c → explain how to break $1
    if (
      remainingShortages.length === 1 &&
      remainingShortages[0].key === "c5" &&
      diff["c5"] === -1
    ) {
      const text = `
To fix the 5c shortage:

The float is missing:
- 1 × 5c<br><br>

Break a $1 coin from today's daily takings:

🟥 Put into the cash bag:
- 1 × $1<br><br>

🟩 Take out from the cash bag:
- 1 × 50c<br>
- 2 × 20c<br>
- 2 × 5c<br><br>

🟢 Add to the float:
- 1 × 5c<br><br>

🟦 Put the rest into daily takings:
- 1 × 50c<br>
- 2 × 20c<br>
- 1 × 5c
      `.trim();

      steps.push({
        id: `step_${stepNumber}`,
        number: stepNumber,
        variants: [text],
        currentIndex: 0
      });
      stepNumber++;
    } else {
      // generic grouped warning for any other shortages
      const lines = remainingShortages
        .map(d => `- ${Math.abs(diff[d.key])} × ${d.label}`)
        .join("<br>");

      const text = `
⚠️ The float is still short in some denominations.<br><br>
The float is missing:<br>
${lines}<br><br>
🟦 Please <strong>break a larger note/coin from today's daily takings</strong>
into smaller change, and put these amounts into the float.
      `.trim();

      steps.push({
        id: `step_${stepNumber}`,
        number: stepNumber,
        variants: [text],
        currentIndex: 0
      });
      stepNumber++;
    }
  }

  //-------------------------------
  // STATUS COLUMN (based on original counts)
  //-------------------------------
  DENOMS.forEach(d => {
    const cell = document.getElementById(`status_${d.key}`);
    const extra = baseDiff[d.key];

    cell.className = "status";

    if (extra === 0) {
      cell.textContent = "Perfect!";
      cell.classList.add("status-perfect");
    } else if (extra > 0) {
      cell.textContent = `Extra ${extra}`;
      cell.classList.add("status-action");
    } else {
      cell.textContent = `Short ${Math.abs(extra)}`;
      cell.classList.add("status-problem");
    }
  });

  //-------------------------------
  // DISPLAY STEPS
  //-------------------------------
  const stepsList = document.getElementById("stepsList");
  stepsList.innerHTML = "";

  if (steps.length === 0) {
    stepsList.innerHTML = `<p class="placeholder">No swaps needed.</p>`;
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
      textSpan.innerHTML = step.variants[0]; // allows <br> + bold
      div.appendChild(textSpan);

      if (step.variants.length > 1) {
        const altBtn = document.createElement("button");
        altBtn.className = "alt-btn";
        altBtn.textContent = "Swap not possible?";
        altBtn.addEventListener("click", () => {
          step.currentIndex = (step.currentIndex + 1) % step.variants.length;
          textSpan.innerHTML = step.variants[step.currentIndex];
        });
        div.appendChild(altBtn);
      }

      stepsList.appendChild(div);
    });
  }

  //-------------------------------
  // SUMMARY BOX
  //-------------------------------
  const summaryBox = document.getElementById("summaryBox");
  summaryBox.innerHTML = `
    <p><strong>Total in till now:</strong> ${centsToDollars(totalActual)}</p>
    <p><strong>Target float total:</strong> ${centsToDollars(totalTarget)}</p>
  `;

  if (totalActual < totalTarget) {
    summaryBox.innerHTML += `
      <p class="warn">Till is short overall by ${centsToDollars(totalTarget - totalActual)}.</p>
    `;
  } else {
    summaryBox.innerHTML += `
      <p class="good">Takings: ${centsToDollars(totalActual - totalTarget)}.</p>
    `;
  }

  summaryBox.innerHTML += `<p style="font-size:0.8rem; color:#555;">After you follow the steps, re-count the float and press "Show my steps" again to check every row says “Perfect!”.</p>`;
});

// -----------------------------------------
// FINISHED BUTTON CONFETTI + RUN ANIMATION
// -----------------------------------------
document.getElementById("finishedBtn").addEventListener("click", () => {

  // ---- CONFETTI ----
  for (let i = 0; i < 120; i++) {
    createConfettiPiece();
  }

  // ---- RUNNER ----
  const runner = document.getElementById("runnerSprite");
  runner.classList.remove("run-slide"); // reset if clicked twice
  void runner.offsetWidth; // force reflow
  runner.classList.add("run-slide");

  // ---- SUCCESS MESSAGE ----
  const msg = document.getElementById("successMessage");
  msg.classList.add("show");

  // hide it after 3 seconds
  setTimeout(() => {
    msg.classList.remove("show");
  }, 3000);
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
