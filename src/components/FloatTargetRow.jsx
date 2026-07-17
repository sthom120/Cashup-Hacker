import { useId } from "react";

import {
  MAX_COUNT,
  sanitiseCountInput,
} from "../utils/countValidation";

function FloatTargetRow({
  denomination,
  targetCount,
  onTargetChange,
}) {
  const labelId = useId();
  const valueId = useId();
  const inputId = useId();

  const safeTargetCount =
    sanitiseCountInput(targetCount);

  const handleChange = (event) => {
    onTargetChange(
      sanitiseCountInput(event.target.value),
    );
  };

  return (
    <div
      className="float-target-row"
      role="group"
      aria-labelledby={labelId}
      aria-describedby={valueId}
    >
      <div>
        <strong
          id={labelId}
          className="denomination-label"
        >
          {denomination.label}
        </strong>

        <span
          id={valueId}
          className="float-target-value"
        >
          Each one is $
          {(denomination.valueInCents / 100).toFixed(2)}
        </span>
      </div>

      <label
        htmlFor={inputId}
        className="float-target-input-group"
      >
        <span>Target count</span>

        <input
          id={inputId}
          type="number"
          min="0"
          max={MAX_COUNT}
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeTargetCount}
          onChange={handleChange}
          className="float-target-input"
          aria-describedby={valueId}
        />
      </label>
    </div>
  );
}

export default FloatTargetRow;