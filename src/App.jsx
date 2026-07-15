import { useState } from "react";
import "./App.css";
import DenominationRow from "./components/DenominationRow";
import ComparisonSection from "./components/ComparisonSection";
import { denominations } from "./data/denominations";
import {
  calculateExpectedTakings,
  calculateTargetFloatTotal,
  calculateTillTotal,
  compareWithTarget,
  formatCurrency,
} from "./utils/cashCalculations";

function App() {
  const initialCounts = Object.fromEntries(
    denominations.map((denomination) => [denomination.id, 0]),
  );

  const [counts, setCounts] = useState(initialCounts);
  const [currentStep, setCurrentStep] = useState("count");

  const tillTotal = calculateTillTotal(counts);
  const targetFloatTotal = calculateTargetFloatTotal();
  const expectedTakings = calculateExpectedTakings(counts);

  const comparison = compareWithTarget(counts);

  const extras = comparison.filter((item) => item.status === "extra");
  const shortages = comparison.filter((item) => item.status === "short");
  const correct = comparison.filter((item) => item.status === "correct");

  const updateCount = (denominationId, newCount) => {
    setCounts((currentCounts) => ({
      ...currentCounts,
      [denominationId]: newCount,
    }));
  };

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

          <button type="button" className="primary-button">
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Step 1 of 5</p>
        <h1>Count the Till</h1>
        <p className="app-subtitle">
          Count everything currently in the till.
        </p>
      </header>

      <main className="app-content">
        <section className="instruction-card">
          <h2>Enter each denomination</h2>
          <p>
            Use the buttons or type the number of notes and coins you have.
          </p>
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
      </main>
    </div>
  );
}

export default App;