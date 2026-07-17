function FloatTargetRow({
  denomination,
  targetCount,
  onTargetChange,
}) {
  const handleChange = (event) => {
    const parsedValue = Number.parseInt(event.target.value, 10);

    if (Number.isNaN(parsedValue)) {
      onTargetChange(0);
      return;
    }

    onTargetChange(Math.max(0, parsedValue));
  };

  return (
    <div className="float-target-row">
      <div>
        <strong className="denomination-label">
          {denomination.label}
        </strong>

        <span className="float-target-value">
          Each one is ${(denomination.valueInCents / 100).toFixed(2)}
        </span>
      </div>

      <label className="float-target-input-group">
        <span>Target count</span>

        <input
          type="number"
          min="0"
          step="1"
          value={targetCount}
          onChange={handleChange}
          className="float-target-input"
        />
      </label>
    </div>
  );
}

export default FloatTargetRow;