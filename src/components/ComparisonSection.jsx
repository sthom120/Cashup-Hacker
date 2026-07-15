function ComparisonSection({ title, description, items, emptyMessage }) {
  return (
    <section className="comparison-section">
      <div className="comparison-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {items.length > 0 ? (
        <ul className="comparison-list">
          {items.map((item) => (
            <li key={item.id} className="comparison-item">
              <strong>
                {Math.abs(item.difference)} × {item.label}
              </strong>

              <span>
                Counted {item.counted} · Target {item.target}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">{emptyMessage}</p>
      )}
    </section>
  );
}

export default ComparisonSection;