import "./App.css";
import {
  calculateTargetFloatTotal,
  formatCurrency,
} from "./utils/cashCalculations";

function App() {
  const targetFloatTotal = calculateTargetFloatTotal();
  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-eyebrow">Cash-up assistant</p>
        <h1>Cash-up Hacker</h1>
        <p className="app-subtitle">
          Rebuild your float with clear, step-by-step instructions.
        </p>
      </header>

      <main className="app-content">
        <section className="welcome-card">
          <h2>Ready to start?</h2>
          <p>
            Count what is currently in the till, and we’ll show you exactly
            what to move.
          </p>

          <button type="button" className="primary-button">
            Start cash-up
          </button>

          <button type="button" className="secondary-button">
            How it works
          </button>
        </section>

        <section className="target-card">
          <span>Current float target</span>
          <strong>{formatCurrency(targetFloatTotal)}</strong>
        </section>
      </main>
    </div>
  );
}

export default App;