import {
  MAX_COUNT,
  sanitiseCountInput,
} from "../utils/countValidation";

function FloatTargetRow({
  denomination,
  targetCount,
  onTargetChange,
}) {
  const safeTargetCount =
    sanitiseCountInput(targetCount);

  const handleChange = (event) => {
    onTargetChange(
      sanitiseCountInput(event.target.value),
    );
  };

  return (
    <div className="float-target-row">
      <div>
        <strong className="denomination-label">
          {denomination.label}
        </strong>

        <span className="float-target-value">
          Each one is $
          {(denomination.valueInCents / 100).toFixed(2)}
        </span>
      </div>

      <label className="float-target-input-group">
        <span>Target count</span>

        <input
          type="number"
          min="0"
          max={MAX_COUNT}
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={safeTargetCount}
          onChange={handleChange}
          className="float-target-input"
        />
      </label>
    </div>
  );
}

export default FloatTargetRow;