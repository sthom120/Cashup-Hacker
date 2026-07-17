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
          <p className="app-eyebrow">Saved cash-up found</p>
          <h1>Ready to pick up where you left off?</h1>

          <p className="app-subtitle">
            Your last cash-up was saved on this device.
          </p>
        </header>

        <main className="app-content">
          <section className="recovery-card">
            <h2>Your progress is still here</h2>

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
            Continue my cash-up
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={discardSavedCashUp}
          >
            Start a fresh cash-up
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
          <p className="app-eyebrow">Let’s check one thing</p>
          <h1>Let’s check the Till count</h1>

          <p className="app-subtitle">
            The current total is not enough to rebuild the Float yet.
          </p>
        </header>

        <main className="app-content">
          <section className="warning-card" aria-live="assertive">
            <h2>The Till total is below the Float target</h2>

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
            Back to the Till count
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
          <h1>How Cash-up Hacker works</h1>

          <p className="app-subtitle">
            The app guides you through rebuilding the Float without needing to
            do the maths yourself.
          </p>
        </header>

        <main className="app-content">
          <section className="help-section">
            <h2>Your cash-up, step by step</h2>

            <ol className="help-steps">
              <li>
                <strong>Let’s count the Till</strong>
                <span>
                  Enter how many notes and coins are currently in the till.
                </span>
              </li>

              <li>
                <strong>Check the result</strong>
                <span>The app compares your count with the target Float.</span>
              </li>

              <li>
                <strong>Move the extras</strong>
                <span>
                  Remove denominations above the target and put them into
                  Takings.
                </span>
              </li>

              <li>
                <strong>Now let’s rebuild the Float</strong>
                <span>
                  Exchange some Takings for the denominations missing from the
                  Float.
                </span>
              </li>

              <li>
                <strong>Finish with a final check</strong>
                <span>
                  Confirm that the Float and Takings add up to the original till
                  total.
                </span>
              </li>
            </ol>
          </section>

          <section className="help-section">
            <h2>Helpful terms</h2>

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
            <h2>We’ll handle the maths</h2>

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
            Back to my cash-up
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
          <h1>Float settings</h1>

          <p className="app-subtitle">
            Choose how many of each note and coin should stay in the Float.
          </p>
        </header>

        <main className="app-content">
          <section className="instruction-card">
            <h2>Your current Float setup</h2>

            <p>
              These targets are used throughout the whole cash-up.
            </p>
          </section>

          <div className="section-heading">
            <h2>Notes and coin targets</h2>
            <p>
              Set the amount of each note and coin you want to keep in the Float.
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
            <span>Float target total</span>
            <strong>{formatCurrency(targetFloatTotal)}</strong>
          </section>

          <button
            type="button"
            className="primary-button"
            onClick={saveTargetSettings}
          >
            Save these Float settings
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={resetTargetSettings}
          >
            Restore Amazen’s default
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
          <h1>Cash-up complete - Woo Hoo!</h1>
          <p className="app-subtitle">
            Your Float is ready and your Takings have been worked out.
          </p>
        </header>

        <main className="app-content">
          <section className="completion-card" aria-live="polite">
            <div className="completion-icon" aria-hidden="true">
              ✓
            </div>

            <h2>Everything matches</h2>

            <p>
              Every dollar from the original Till has been accounted for.
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
            Start a new cash-up
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("final-check")}
          >
            Review the final summary
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
          <h1>One final check</h1>

          <p className="app-subtitle">
            Let’s make sure everything adds up before you finish.
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
              <h2>Everything matches</h2>

              <p>
                The Float and Takings add up to the original Till total.
              </p>
            </section>
          ) : (
            <section className="warning-card" aria-live="assertive">
              <h2>Something doesn’t match yet</h2>

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
            Finish my cash-up
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
            <h1>No Change Bag needed</h1>

            <p className="app-subtitle">
              You’re ready to continue — your Float already has the right notes and coins.
            </p>
          </header>

          <main className="app-content">
            <section className="instruction-card">
              <h2>You’re ready to continue</h2>

              <p>
                There’s nothing to exchange through the Change Bag this time.
              </p>
            </section>

            <button
              type="button"
              className="primary-button"
              onClick={() => setCurrentStep("final-check")}
            >
              Continue to the final check
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
            <h1>We need a little help here</h1>

            <p className="app-subtitle">
              This Change Bag exchange cannot be completed safely as entered.
            </p>
          </header>

          <main className="app-content">
            <section className="warning-card">
              <h2>This needs a quick manual check</h2>
              <p>{changeBagPlan.reason}</p>
              {changeBagPlan.staffAction && (
                <p>
                  <strong>Next step:</strong> {changeBagPlan.staffAction}
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
              Back to the results
            </button>
          </main>
        </div>
      );
    }

    return (
      <div className="app-shell">
        <header className="app-header">
          <p className="app-eyebrow">Step 4 of 5</p>
          <h1>Now let’s rebuild the Float</h1>

          <p className="app-subtitle">
            Follow each step in order — the maths is already done.
          </p>
        </header>

        <main className="app-content">
          <section className="instruction-card">
            <h2>What you’re doing now</h2>

            <p>
              You are exchanging some Takings for the denominations needed to
              complete the Float.
            </p>
          </section>

          <div className="section-heading">
            <h2>Change Bag steps</h2>
            <p>Move the money in this order so everything stays clear.</p>
          </div>

          <section className="change-step-card">
            <span className="change-step-number">1</span>

            <div>
              <h2>Put into the Change Bag</h2>

              <QuantityList items={changeBagPlan.depositItems} />
            </div>
          </section>

          <section className="change-step-card">
            <span className="change-step-number">2</span>

            <div>
              <h2>Take out of the Change Bag</h2>

              <QuantityList items={changeBagPlan.withdrawalItems} />
            </div>
          </section>

          <div className="section-heading">
            <h2>Where to place the money</h2>
            <p>Split the money between the Float and Takings as shown below.</p>
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
            <h2>Quick check before you continue</h2>

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
            Done — the change is complete
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
          <h1>Move the extras to Takings</h1>

          <p className="app-subtitle">
            Take the extra notes and coins out of the Till.
          </p>
        </header>

        <main className="app-content">
          <section className="move-instruction-card">
            <p className="move-instruction-label">Move these:</p>

            <MoneyMoveList items={extras} />

            <p className="move-destination">
              Place this money into <strong>Takings</strong>.
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
            <span>Takings moved so far</span>
            <strong>{formatCurrency(extrasTotal)}</strong>
          </section>

          <section className="instruction-card">
            <h2>Quick check</h2>

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
            Done — extras are in Takings
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("review")}
          >
            Back to the results
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
          <h1>Here’s what needs adjusting</h1>

          <p className="app-subtitle">
            Here’s how your Till compares with the target Float.
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
              <span>Takings</span>
              <strong>{formatCurrency(expectedTakings)}</strong>
            </div>
          </section>

          <div className="section-heading">
            <h2>What we found</h2>
            <p>Check what needs moving and what is already right.</p>
          </div>

          <ComparisonSection
            title="Extras"
            description="These are above the Float target."
            items={extras}
            emptyMessage="No extras here — nice and simple."
          />

          <ComparisonSection
            title="Shortages"
            description="These are needed to complete the Float."
            items={shortages}
            emptyMessage="No shortages — great."
          />

          <ComparisonSection
            title="Correct"
            description="These already match the Float target."
            items={correct}
            emptyMessage="Nothing matches the target yet."
          />

          <button
            type="button"
            className="primary-button"
            onClick={() => setCurrentStep("move-extras")}
          >
            Next: Move the extras to Takings
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setCurrentStep("count")}
          >
            Back to the Till count
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
        <h1>Let’s count the Till</h1>

        <p className="app-subtitle">Enter everything currently in the Till.</p>
      </header>

      <main className="app-content">
        <section className="instruction-card">
          <h2>Start with what’s in the Till</h2>

          <p>Use the buttons or type how many notes and coins you have.</p>
        </section>

        <div className="section-heading">
          <h2>Till notes and coins</h2>
          <p>Enter how many of each note and coin are in the Till.</p>
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
          <span>Till total</span>
          <strong>{formatCurrency(tillTotal)}</strong>
        </section>

        {tillIsEmpty && (
          <section className="validation-card" aria-live="polite">
            <h2>Ready when you are</h2>

            <p>
              Enter the notes and coins in the Till to get started.
            </p>
          </section>
        )}

        {tillIsBelowTarget && !tillIsEmpty && (
          <section className="warning-card" aria-live="assertive">
            <h2>The Till is below the Float target</h2>

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
          Check my totals
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
          How this works
        </button>
      </main>
    </div>
  );
}

export default App;