import { useState } from "react";
import "./App.css";
import DenominationRow from "./components/DenominationRow";
import { denominations } from "./data/denominations";
import {
  calculateTargetFloatTotal,
  formatCurrency,
} from "./utils/cashCalculations";

function App() {
  const initialCounts = Object.fromEntries(
    denominations.map((denomination) => [denomination.id, 0]),
  );

  const [counts, setCounts] = useState(initialCounts);

  const targetFloatTotal = calculateTargetFloatTotal();

  const tillTotal = denominations.reduce((total, denomination) => {
    const count = counts[denomination.id] ?? 0;

    return total + count * denomination.valueInCents;
  }, 0);

  const updateCount = (denominationId, newCount) => {
    setCounts((currentCounts) => ({
      ...currentCounts,
      [denominationId]: newCount,
    }));
  };

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

        <button type="button" className="primary-button">
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