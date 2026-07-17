import { useId } from "react";

import {
  MAX_COUNT,
  sanitiseCountInput,
} from "../utils/countValidation";

function DenominationRow({
  denomination,
  count,
  onCountChange,
}) {
  const labelId = useId();
  const subtotalId = useId();
  const inputId = useId();

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

  const formattedSubtotal =
    (subtotal / 100).toFixed(2);

  return (
    <div
      className="denomination-row"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={subtotalId}
    >
      <div>
        <strong
          id={labelId}
          className="denomination-label"
        >
          {denomination.label}
        </strong>

        <span
          id={subtotalId}
          className="denomination-subtotal"
        >
          Subtotal: ${formattedSubtotal}
        </span>
      </div>

      <div className="count-controls">
        <button
          type="button"
          className="count-button"
          onClick={decreaseCount}
          disabled={safeCount === 0}
          aria-label={`Decrease ${denomination.label} count`}
        >
          <span aria-hidden="true">−</span>
        </button>

        <label
          htmlFor={inputId}
          className="visually-hidden"
        >
          Number of {denomination.label}
        </label>

        <input
          id={inputId}
          type="number"
          min="0"
          max={MAX_COUNT}
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeCount}
          onChange={handleInputChange}
          className="count-input"
          aria-describedby={subtotalId}
        />

        <button
          type="button"
          className="count-button"
          onClick={increaseCount}
          disabled={safeCount >= MAX_COUNT}
          aria-label={`Increase ${denomination.label} count`}
        >
          <span aria-hidden="true">+</span>
        </button>
      </div>
    </div>
  );
}

export default DenominationRow;