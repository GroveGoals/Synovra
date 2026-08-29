"use client";

export default function StructuredListView({ items }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="card p-3">
          {item.image && (
            <div className="mb-3">
              <img src={item.image.url} alt="" style={{ width: "100%", borderRadius: 10, display: "block" }} />
              {item.image.creditName && (
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  Photo by{" "}
                  <a href={`${item.image.creditUrl}?utm_source=vreedits&utm_medium=referral`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                    {item.image.creditName}
                  </a>{" "}
                  on{" "}
                  <a href="https://unsplash.com/?utm_source=vreedits&utm_medium=referral" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
                    Unsplash
                  </a>
                </div>
              )}
            </div>
          )}
          {item.heading && (
            <div className="text-sm font-semibold mb-1">{item.heading}</div>
          )}
          <div className="text-sm" style={{ lineHeight: 1.6, color: "var(--text)" }}>
            {item.text}
          </div>
        </div>
      ))}
    </div>
  );
}
