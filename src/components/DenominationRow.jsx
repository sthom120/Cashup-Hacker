function DenominationRow({
  denomination,
  count,
  onCountChange,
}) {
  const decreaseCount = () => {
    onCountChange(Math.max(0, count - 1));
  };

  const increaseCount = () => {
    onCountChange(count + 1);
  };

  const handleInputChange = (event) => {
    const value = Number.parseInt(event.target.value, 10);

    onCountChange(Number.isNaN(value) ? 0 : Math.max(0, value));
  };

  const subtotalInCents = count * denomination.valueInCents;

  return (
    <div className="denomination-row">
      <div>
        <strong className="denomination-label">
          {denomination.label}
        </strong>
        <span className="denomination-subtotal">
          ${(subtotalInCents / 100).toFixed(2)}
        </span>
      </div>

      <div className="count-controls">
        <button
          type="button"
          className="count-button"
          onClick={decreaseCount}
          aria-label={`Remove one ${denomination.label}`}
        >
          −
        </button>

        <input
          className="count-input"
          type="number"
          min="0"
          step="1"
          value={count}
          onChange={handleInputChange}
          aria-label={`${denomination.label} count`}
        />

        <button
          type="button"
          className="count-button"
          onClick={increaseCount}
          aria-label={`Add one ${denomination.label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default DenominationRow;