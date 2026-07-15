function QuantityList({ items, emptyMessage = "Nothing to move." }) {
  if (!items || items.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <ul className="quantity-list">
      {items.map((item) => (
        <li key={item.id} className="quantity-list-item">
          <strong>
            {item.quantity} × {item.label}
          </strong>
        </li>
      ))}
    </ul>
  );
}

export default QuantityList;