function MoneyMoveList({ items }) {
  if (items.length === 0) {
    return <p className="empty-message">No money needs to be moved.</p>;
  }

  return (
    <ul className="money-move-list">
      {items.map((item) => (
        <li key={item.id} className="money-move-item">
          <strong>{Math.abs(item.difference)} × {item.label}</strong>
        </li>
      ))}
    </ul>
  );
}

export default MoneyMoveList;