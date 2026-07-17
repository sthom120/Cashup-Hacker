function MoneyMoveList({ items }) {
  if (!items || items.length === 0) {
    return (
      <p
        className="empty-message"
        role="status"
      >
        No money needs to be moved.
      </p>
    );
  }

  return (
    <ul
      className="money-move-list"
      aria-label="Money to move"
    >
      {items.map((item) => (
        <li
          key={item.id}
          className="money-move-item"
        >
          <strong>
            {Math.abs(item.difference)} ×{" "}
            {item.label}
          </strong>
        </li>
      ))}
    </ul>
  );
}

export default MoneyMoveList;