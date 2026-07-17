import {
  MAX_COUNT,
  sanitiseCountInput,
} from "../utils/countValidation";

function DenominationRow({
  denomination,
  count,
  onCountChange,
}) {
  const safeCount = sanitiseCountInput(count);

  const handleInputChange = (event) => {
    onCountChange(
      sanitiseCountInput(event.target.value),
    );
  };

  const decreaseCount = () => {
    onCountChange(
      sanitiseCountInput(safeCount - 1),
    );
  };

  const increaseCount = () => {
    onCountChange(
      sanitiseCountInput(safeCount + 1),
    );
  };

  const subtotal =
    safeCount * denomination.valueInCents;

  return (
    <div className="denomination-row">
      <div>
        <strong className="denomination-label">
          {denomination.label}
        </strong>

        <span className="denomination-subtotal">
          Subtotal: ${(subtotal / 100).toFixed(2)}
        </span>
      </div>

      <div className="count-controls">
        <button
          type="button"
          className="count-button"
          onClick={decreaseCount}
          disabled={safeCount === 0}
          aria-label={`Remove one ${denomination.label}`}
        >
          −
        </button>

        <input
          type="number"
          min="0"
          max={MAX_COUNT}
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeCount}
          onChange={handleInputChange}
          className="count-input"
          aria-label={`${denomination.label} count`}
        />

        <button
          type="button"
          className="count-button"
          onClick={increaseCount}
          disabled={safeCount >= MAX_COUNT}
          aria-label={`Add one ${denomination.label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default DenominationRow;