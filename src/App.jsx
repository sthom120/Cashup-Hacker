import { useEffect, useState } from "react";
import "./App.css";

import ComparisonSection from "./components/ComparisonSection";
import DenominationRow from "./components/DenominationRow";
import FloatTargetRow from "./components/FloatTargetRow";
import MoneyMoveList from "./components/MoneyMoveList";
import QuantityList from "./components/QuantityList";

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

import {
  clearCashUpProgress,
  hasMeaningfulCashUpProgress,
  loadCashUpProgress,
  saveCashUpProgress,
} from "./utils/cashUpProgressStorage";

function App() {
  const initialCounts = Object.fromEntries(
    denominations.map((denomination) => [denomination.id, 0]),
  );

  const [savedProgress] = useState(() => loadCashUpProgress());

  const [counts, setCounts] = useState(savedProgress?.counts ?? initialCounts);

  const [floatTargets, setFloatTargets] = useState(() => loadFloatTargets());

  const [currentStep, setCurrentStep] = useState(
    savedProgress?.currentStep ?? "count",
  );

  const [completedAt, setCompletedAt] = useState(() => {
    if (!savedProgress?.completedAt) {
      return null;
    }

    const restoredDate = new Date(savedProgress.completedAt);

    return Number.isNaN(restoredDate.getTime()) ? null : restoredDate;
  });

  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(() =>
    hasMeaningfulCashUpProgress(savedProgress),
  );

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

  const tillIsEmpty = tillTotal === 0;

  const tillIsBelowTarget = tillTotal < targetFloatTotal;

  const canReviewCashUp = !tillIsEmpty && !tillIsBelowTarget;

  useEffect(() => {
    const cashUpSteps = [
      "count",
      "review",
      "move-extras",
      "change-bag",
      "final-check",
      "complete",
    ];

    if (!cashUpSteps.includes(currentStep)) {
      return;
    }

    const hasEnteredCounts = Object.values(counts).some((count) => count > 0);

    const shouldSave =
      hasEnteredCounts || currentStep !== "count" || completedAt !== null;

    if (!shouldSave) {
      clearCashUpProgress();
      return;
    }

    saveCashUpProgress({
      counts,
      currentStep,
      completedAt: completedAt ? completedAt.toISOString() : null,
    });
  }, [counts, currentStep, completedAt]);

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
    clearCashUpProgress();
    setCounts(initialCounts);
    setCompletedAt(null);
    setShowRecoveryPrompt(false);
    setCurrentStep("count");
  };

  const continueSavedCashUp = () => {
    setShowRecoveryPrompt(false);
  };

  const discardSavedCashUp = () => {
    clearCashUpProgress();
    setCounts(initialCounts);
    setCompletedAt(null);
    setShowRecoveryPrompt(false);
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
   * RECOVERY PROMPT
   */
  if (showRecoveryPrompt) {
    const savedStepLabel =
      currentStep === "complete"
        ? "Cash-up complete"
        : currentStep
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");

    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Unfinished cash-up</p>
          <h1>Continue where you left off?</h1>

          <p className="app-subtitle">
            We found a cash-up that was not cleared from this device.
          </p>
        </header>

        <main className="app-content">
          <section className="recovery-card">
            <h2>Your progress is safe</h2>

            <p>
              Your till counts and current cash-up step were saved
              automatically.
            </p>

            <dl className="recovery-summary">
              <div>
                <dt>Saved till total</dt>
                <dd>{formatCurrency(tillTotal)}</dd>
              </div>

              <div>
                <dt>Saved step</dt>
                <dd>{savedStepLabel}</dd>
              </div>
            </dl>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={continueSavedCashUp}
          >
            Continue cash-up
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={discardSavedCashUp}
          >
            Start over
          </button>
        </main>
      </div>
    );
  }

  if (
    currentStep !== "count" &&
    currentStep !== "settings" &&
    currentStep !== "help" &&
    currentStep !== "complete" &&
    tillIsBelowTarget
  ) {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Cash-up issue</p>
          <h1>Check the Till Count</h1>

          <p className="app-subtitle">
            The current amount cannot produce a complete Float.
          </p>
        </header>

        <main className="app-content">
          <section className="warning-card" aria-live="assertive">
            <h2>The till is short overall</h2>

            <p>
              The till contains {formatCurrency(tillTotal)}, but the target
              Float is {formatCurrency(targetFloatTotal)}.
            </p>

            <p>
              Return to the count and check whether any notes or coins were
              missed.
            </p>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("count")}
          >
            Return to Till count
          </button>
        </main>
      </div>
    );
  }

  /*
   * HELP
   */
  if (currentStep === "help") {
    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Help</p>
          <h1>How Cash-up Hacker Works</h1>

          <p className="app-subtitle">
            The app guides you through rebuilding the Float without needing to
            do the maths yourself.
          </p>
        </header>

        <main className="app-content">
          <section className="help-section">
            <h2>The cash-up process</h2>

            <ol className="help-steps">
              <li>
                <strong>Count the Till</strong>
                <span>
                  Enter how many notes and coins are currently in the till.
                </span>
              </li>

              <li>
                <strong>Review the result</strong>
                <span>The app compares your count with the target Float.</span>
              </li>

              <li>
                <strong>Move Extras</strong>
                <span>
                  Remove denominations above the target and put them into
                  Takings.
                </span>
              </li>

              <li>
                <strong>Use the Change Bag</strong>
                <span>
                  Exchange some Takings for the denominations missing from the
                  Float.
                </span>
              </li>

              <li>
                <strong>Complete the cash-up</strong>
                <span>
                  Confirm that the Float and Takings add up to the original till
                  total.
                </span>
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2>What the terms mean</h2>

            <dl className="term-list">
              <div className="term-card">
                <dt>Float</dt>
                <dd>
                  The money that stays in the till so staff can give customers
                  change.
                </dd>
              </div>

              <div className="term-card">
                <dt>Takings</dt>
                <dd>
                  The money earned during the trading period that is removed
                  from the till.
                </dd>
              </div>

              <div className="term-card">
                <dt>Change Bag</dt>
                <dd>
                  The supply of notes and coins used to exchange money and
                  rebuild the correct Float.
                </dd>
              </div>

              <div className="term-card">
                <dt>Extra</dt>
                <dd>
                  A denomination where the till contains more than the Float
                  target.
                </dd>
              </div>

              <div className="term-card">
                <dt>Shortage</dt>
                <dd>
                  A denomination where the till contains fewer than the Float
                  target.
                </dd>
              </div>
            </dl>
          </section>

          <section className="instruction-card">
            <h2>You do not need to calculate anything</h2>

            <p>
              Follow each instruction in order. The app will tell you what money
              to move and where to put it.
            </p>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("count")}
          >
            Return to cash-up
          </button>
        </main>
      </div>
    );
  }

  /*
   * SETTINGS
   */
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

          <div className="section-heading">
            <h2>Denomination targets</h2>
            <p>
              Set how many of each note and coin should remain in the Float.
            </p>
          </div>

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
              Your Float already has the correct denominations.
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
              The current Takings cannot cover all Float shortages.
            </p>
          </header>

          <main className="app-content">
            <section className="warning-card">
              <h2>Unable to complete automatically</h2>
              <p>{changeBagPlan.reason}</p>
              {changeBagPlan.staffAction && (
                <p>
                  <strong>What to do:</strong> {changeBagPlan.staffAction}
                </p>
              )}
              <dl className="recovery-summary">
                <div>
                  <dt>Float shortages</dt>
                  <dd>{formatCurrency(changeBagPlan.shortagesTotalInCents)}</dd>
                </div>

                <div>
                  <dt>Available extras</dt>
                  <dd>
                    {formatCurrency(changeBagPlan.availableExtrasTotalInCents)}
                  </dd>
                </div>
              </dl>
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
          <section className="instruction-card">
            <h2>What is happening?</h2>

            <p>
              You are exchanging some Takings for the denominations needed to
              complete the Float.
            </p>
          </section>

          <div className="section-heading">
            <h2>Change Bag actions</h2>
            <p>Complete each physical money movement in order.</p>
          </div>

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

          <div className="section-heading">
            <h2>Where the money goes</h2>
            <p>Separate the withdrawn change between Float and Takings.</p>
          </div>

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
   * STEP 3: MOVE EXTRAS
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
            We compared your till with the target Float.
          </p>
        </header>

        <main className="app-content">
          <section className="summary-grid">
            <div className="summary-card">
              <span>Till total</span>
              <strong>{formatCurrency(tillTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Target Float</span>
              <strong>{formatCurrency(targetFloatTotal)}</strong>
            </div>

            <div className="summary-card">
              <span>Expected Takings</span>
              <strong>{formatCurrency(expectedTakings)}</strong>
            </div>
          </section>

          <div className="section-heading">
            <h2>Comparison results</h2>
            <p>See what is extra, short or already correct.</p>
          </div>

          <ComparisonSection
            title="Extras"
            description="These are above the target Float."
            items={extras}
            emptyMessage="There are no extra denominations."
          />

          <ComparisonSection
            title="Shortages"
            description="These are below the target Float."
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

        <div className="section-heading">
          <h2>Notes and coins</h2>
          <p>Enter how many of each denomination are in the till.</p>
        </div>

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

        {tillIsEmpty && (
          <section className="validation-card" aria-live="polite">
            <h2>No money entered yet</h2>

            <p>
              Enter the notes and coins currently in the till before continuing.
            </p>
          </section>
        )}

        {tillIsBelowTarget && !tillIsEmpty && (
          <section className="warning-card" aria-live="assertive">
            <h2>The till is below the target Float</h2>

            <p>
              The till contains {formatCurrency(tillTotal)}, but the target
              Float is {formatCurrency(targetFloatTotal)}.
            </p>

            <p>
              Check the count before continuing. The app cannot calculate
              positive Takings from this amount.
            </p>
          </section>
        )}

        <button
          type="button"
          className="primary-button"
          disabled={!canReviewCashUp}
          onClick={() => setCurrentStep("review")}
        >
          Review my cash-up
        </button>

        <section className="target-card">
          <span>Target Float</span>
          <strong>{formatCurrency(targetFloatTotal)}</strong>
        </section>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentStep("settings")}
        >
          Float settings
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => setCurrentStep("help")}
        >
          How it works
        </button>
      </main>
    </div>
  );
}

export default App;
