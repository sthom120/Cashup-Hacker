import { useId } from "react";

function ComparisonSection({
  title,
  description,
  items,
  emptyMessage,
}) {
  const headingId = useId();
  const descriptionId = useId();

  return (
    <section
      className="comparison-section"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <div className="comparison-heading">
        <h2 id={headingId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
      </div>

      {items.length > 0 ? (
        <ul className="comparison-list">
          {items.map((item) => {
            const quantity =
              Math.abs(item.difference);

            return (
              <li
                key={item.id}
                className="comparison-item"
              >
                <strong>
                  {quantity} × {item.label}
                </strong>

                <span>
                  Counted {item.counted}. Target{" "}
                  {item.target}.
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          className="empty-message"
          role="status"
        >
          {emptyMessage}
        </p>
      )}
    </section>
  );
}

export default ComparisonSection;