function QuantityList({
  items,
  emptyMessage = "Nothing to move.",
  ariaLabel = "Money quantities",
}) {
  if (!items || items.length === 0) {
    return (
      <p
        className="empty-message"
        role="status"
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className="quantity-list"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="quantity-list-item"
        >
          <strong>
            {item.quantity} × {item.label}
          </strong>
        </li>
      ))}
    </ul>
  );
}

export default QuantityList;