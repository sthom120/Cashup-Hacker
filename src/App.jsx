import { useState } from "react";
import "./App.css";

import ComparisonSection from "./components/ComparisonSection";
import DenominationRow from "./components/DenominationRow";
import MoneyMoveList from "./components/MoneyMoveList";
import QuantityList from "./components/QuantityList";
import FloatTargetRow from "./components/FloatTargetRow";

import { denominations } from "./data/denominations";
import { defaultFloatTargets } from "./data/floatTargets";

import {
  calculateChangeBagPlan,
  calculateExpectedTakings,
  calculateExtrasTotal,
  calculateTargetFloatTotal,
  calculateTillTotal,
  compareWithTarget,
  formatCurrency,
} from "./utils/cashCalculations";

import {
  clearSavedFloatTargets,
  loadFloatTargets,
  saveFloatTargets,
} from "./utils/floatTargetStorage";

function App() {
  const initialCounts = Object.fromEntries(
    denominations.map((denomination) => [denomination.id, 0]),
  );

  const [counts, setCounts] = useState(initialCounts);
  const [floatTargets, setFloatTargets] = useState(() => loadFloatTargets());
  const [currentStep, setCurrentStep] = useState("count");
  const [completedAt, setCompletedAt] = useState(null);

  const tillTotal = calculateTillTotal(counts);
  const targetFloatTotal = calculateTargetFloatTotal(floatTargets);

  const expectedTakings = calculateExpectedTakings(counts, floatTargets);

  const comparison = compareWithTarget(counts, floatTargets);

  const extras = comparison.filter((item) => item.status === "extra");
  const shortages = comparison.filter((item) => item.status === "short");
  const correct = comparison.filter((item) => item.status === "correct");

  const extrasTotal = calculateExtrasTotal(comparison);
  const changeBagPlan = calculateChangeBagPlan(comparison);

  const totalsBalance = targetFloatTotal + expectedTakings === tillTotal;

  const updateCount = (denominationId, newCount) => {
    setCounts((currentCounts) => ({
      ...currentCounts,
      [denominationId]: newCount,
    }));
  };

  const finishCashUp = () => {
    if (!totalsBalance) {
      return;
    }

    setCompletedAt(new Date());
    setCurrentStep("complete");
  };

  const startNewCashUp = () => {
    setCounts(initialCounts);
    setCompletedAt(null);
    setCurrentStep("count");
  };

  const updateFloatTarget = (denominationId, newTarget) => {
    setFloatTargets((currentTargets) => ({
      ...currentTargets,
      [denominationId]: newTarget,
    }));
  };

  const saveTargetSettings = () => {
    saveFloatTargets(floatTargets);
    setCurrentStep("count");
  };

  const resetTargetSettings = () => {
    clearSavedFloatTargets();
    setFloatTargets({ ...defaultFloatTargets });
  };

  /*
   * COMPLETION SCREEN
   */
  if (currentStep === "complete") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Cash-up complete</p>
          <h1>All done</h1>

          <p className="app-subtitle">
            Your Float is ready and your Takings have been calculated.
          </p>
        </header>

        <main className="app-content">
          <section className="completion-card" aria-live="polite">
            <div className="completion-icon" aria-hidden="true">
              ✓
            </div>

            <h2>Everything balances</h2>

            <p>
              The full amount from the original till has been accounted for.
            </p>
          </section>

          <section className="summary-grid">
            <div className="summary-card">
              <span>Float</span>
              <strong>{formatCurrency(targetFloatTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Takings</span>
              <strong>{formatCurrency(expectedTakings)}</strong>
            </div>

            <div className="summary-card">
              <span>Original till</span>
              <strong>{formatCurrency(tillTotal)}</strong>
            </div>
          </section>

          {completedAt && (
            <section className="completion-details">
              <span>Completed</span>

              <strong>
                {completedAt.toLocaleString("en-AU", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </strong>
            </section>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={startNewCashUp}
          >
            Start new cash-up
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("final-check")}
          >
            Back to final summary
          </button>
        </main>
      </div>
    );
  }

  if (currentStep === "settings") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Settings</p>
          <h1>Float Targets</h1>

          <p className="app-subtitle">
            Set how many of each denomination should remain in the Float.
          </p>
        </header>

        <main className="app-content">
          <section className="instruction-card">
            <h2>Current Float setup</h2>

            <p>
              These targets control every comparison and cash-up instruction.
            </p>
          </section>

          <section
            className="float-target-list"
            aria-label="Float denomination targets"
          >
            {denominations.map((denomination) => (
              <FloatTargetRow
                key={denomination.id}
                denomination={denomination}
                targetCount={floatTargets[denomination.id] ?? 0}
                onTargetChange={(newTarget) =>
                  updateFloatTarget(denomination.id, newTarget)
                }
              />
            ))}
          </section>

          <section className="total-card" aria-live="polite">
            <span>Target Float total</span>
            <strong>{formatCurrency(targetFloatTotal)}</strong>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={saveTargetSettings}
          >
            Save Float settings
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={resetTargetSettings}
          >
            Reset to Amazen default
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("count")}
          >
            Cancel
          </button>
        </main>
      </div>
    );
  }
  /*
   * STEP 5: FINAL CHECK
   */
  if (currentStep === "final-check") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Step 5 of 5</p>
          <h1>Final Check</h1>

          <p className="app-subtitle">
            Check that the final amounts match your cash-up.
          </p>
        </header>

        <main className="app-content">
          <section className="summary-grid">
            <div className="summary-card">
              <span>Float</span>
              <strong>{formatCurrency(targetFloatTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Takings</span>
              <strong>{formatCurrency(expectedTakings)}</strong>
            </div>

            <div className="summary-card">
              <span>Original till</span>
              <strong>{formatCurrency(tillTotal)}</strong>
            </div>
          </section>

          {totalsBalance ? (
            <section className="instruction-card" aria-live="polite">
              <h2>Everything balances</h2>

              <p>
                The Float and Takings add up to the original amount in the till.
              </p>
            </section>
          ) : (
            <section className="warning-card" aria-live="assertive">
              <h2>The totals do not balance</h2>

              <p>
                Go back and review the count and Change Bag instructions before
                finishing.
              </p>
            </section>
          )}

          <button
            type="button"
            className="primary-button"
            disabled={!totalsBalance}
            onClick={finishCashUp}
          >
            Finish cash-up
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("change-bag")}
          >
            Back to Change Bag
          </button>
        </main>
      </div>
    );
  }

  /*
   * STEP 4: CHANGE BAG
   */
  if (currentStep === "change-bag") {
    if (!changeBagPlan.required) {
      return (
        <div className="app-shell">
          <header className="app-header">
            <p className="app-eyebrow">Step 4 of 5</p>
            <h1>No Change Bag Needed</h1>

            <p className="app-subtitle">
              Your float already has the correct denominations.
            </p>
          </header>

          <main className="app-content">
            <section className="instruction-card">
              <h2>Good news</h2>

              <p>
                You do not need to exchange any money through the Change Bag.
              </p>
            </section>

            <button
              type="button"
              className="primary-button"
              onClick={() => setCurrentStep("final-check")}
            >
              Continue to final check
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setCurrentStep("move-extras")}
            >
              Back
            </button>
          </main>
        </div>
      );
    }

    if (!changeBagPlan.possible) {
      return (
        <div className="app-shell">
          <header className="app-header">
            <p className="app-eyebrow">Step 4 of 5</p>
            <h1>Change Bag Help Needed</h1>

            <p className="app-subtitle">
              The current Takings cannot cover all float shortages.
            </p>
          </header>

          <main className="app-content">
            <section className="warning-card">
              <h2>Unable to complete automatically</h2>
              <p>{changeBagPlan.reason}</p>
            </section>

            <button
              type="button"
              className="secondary-button"
              onClick={() => setCurrentStep("review")}
            >
              Back to review
            </button>
          </main>
        </div>
      );
    }

    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Step 4 of 5</p>
          <h1>Use the Change Bag</h1>

          <p className="app-subtitle">
            Follow each action in order. The app has done the maths for you.
          </p>
        </header>

        <main className="app-content">
          <section className="change-step-card">
            <span className="change-step-number">1</span>

            <div>
              <h2>Put into Change Bag</h2>
              <QuantityList items={changeBagPlan.depositItems} />
            </div>
          </section>

          <section className="change-step-card">
            <span className="change-step-number">2</span>

            <div>
              <h2>Take out of Change Bag</h2>
              <QuantityList items={changeBagPlan.withdrawalItems} />
            </div>
          </section>

          <section className="destination-grid">
            <section className="destination-card">
              <p className="destination-label">Put into</p>
              <h2>Float</h2>

              <QuantityList items={changeBagPlan.shortageItems} />
            </section>

            <section className="destination-card">
              <p className="destination-label">Put into</p>
              <h2>Takings</h2>

              <QuantityList items={changeBagPlan.remainderItems} />
            </section>
          </section>

          <section className="instruction-card">
            <h2>Check before continuing</h2>

            <p>
              Make sure the Float and Takings now contain exactly the amounts
              shown above.
            </p>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("final-check")}
          >
            I’ve completed the change
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("move-extras")}
          >
            Back
          </button>
        </main>
      </div>
    );
  }

  /*
   * STEP 3: MOVE EXTRAS TO TAKINGS
   */
  if (currentStep === "move-extras") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Step 3 of 5</p>
          <h1>Move Extras to Takings</h1>

          <p className="app-subtitle">
            Remove the extra notes and coins from the till.
          </p>
        </header>

        <main className="app-content">
          <section className="move-instruction-card">
            <p className="move-instruction-label">Take out:</p>

            <MoneyMoveList items={extras} />

            <p className="move-destination">
              Put this money into <strong>Takings</strong>.
            </p>
          </section>

          <section className="money-direction-card">
            <div className="money-location">
              <span className="money-location-label">From</span>
              <strong>Till</strong>
            </div>

            <span className="money-direction-arrow" aria-hidden="true">
              →
            </span>

            <div className="money-location">
              <span className="money-location-label">To</span>
              <strong>Takings</strong>
            </div>
          </section>

          <section className="takings-progress-card" aria-live="polite">
            <span>Takings so far</span>
            <strong>{formatCurrency(extrasTotal)}</strong>
          </section>

          <section className="instruction-card">
            <h2>Before continuing</h2>

            <p>
              Make sure all the listed extras have been physically removed from
              the till and placed into Takings.
            </p>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("change-bag")}
          >
            I’ve moved the extras
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("review")}
          >
            Back to review
          </button>
        </main>
      </div>
    );
  }

  /*
   * STEP 2: REVIEW
   */
  if (currentStep === "review") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Step 2 of 5</p>
          <h1>Extras and Shortages</h1>

          <p className="app-subtitle">
            We compared your till with the target float.
          </p>
        </header>

        <main className="app-content">
          <section className="summary-grid">
            <div className="summary-card">
              <span>Till total</span>
              <strong>{formatCurrency(tillTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Target float</span>
              <strong>{formatCurrency(targetFloatTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Expected takings</span>
              <strong>{formatCurrency(expectedTakings)}</strong>
            </div>
          </section>

          <ComparisonSection
            title="Extras"
            description="These are above the target float."
            items={extras}
            emptyMessage="There are no extra denominations."
          />

          <ComparisonSection
            title="Shortages"
            description="These are below the target float."
            items={shortages}
            emptyMessage="There are no shortages."
          />

          <ComparisonSection
            title="Correct"
            description="These already match the target."
            items={correct}
            emptyMessage="No denominations match the target yet."
          />

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("move-extras")}
          >
            Next: Move Extras to Takings
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("count")}
          >
            Back to count
          </button>
        </main>
      </div>
    );
  }

  /*
   * STEP 1: COUNT THE TILL
   */
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Step 1 of 5</p>
        <h1>Count the Till</h1>

        <p className="app-subtitle">Count everything currently in the till.</p>
      </header>

      <main className="app-content">
        <section className="instruction-card">
          <h2>Enter each denomination</h2>

          <p>Use the buttons or type the number of notes and coins you have.</p>
        </section>

        <section
          className="denomination-list"
          aria-label="Till denomination counts"
        >
          {denominations.map((denomination) => (
            <DenominationRow
              key={denomination.id}
              denomination={denomination}
              count={counts[denomination.id]}
              onCountChange={(newCount) =>
                updateCount(denomination.id, newCount)
              }
            />
          ))}
        </section>

        <section className="total-card" aria-live="polite">
          <span>Total in till</span>
          <strong>{formatCurrency(tillTotal)}</strong>
        </section>

        <button
          type="button"
          className="primary-button"
          onClick={() => setCurrentStep("review")}
        >
          Review my cash-up
        </button>

        <section className="target-card">
          <span>Target float</span>
          <strong>{formatCurrency(targetFloatTotal)}</strong>
        </section>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentStep("settings")}
        >
          Float settings
        </button>
      </main>
    </div>
  );
}

export default App;
