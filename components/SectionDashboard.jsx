"use client";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SectionDashboard({ title, icon: Icon, description, items = [] }) {
  const router = useRouter();

  return (
    <div>
      <style>{`
        .section-dash-header {
          display: flex; align-items: center; gap: 12px; padding: 18px 16px 6px;
        }
        .section-dash-back {
          width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--surface-2); display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text); flex-shrink: 0;
        }
        .section-dash-icon {
          width: 40px; height: 40px; border-radius: 12px; background: var(--accent-soft);
          color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .section-dash-title { font-size: 19px; font-weight: 600; font-family: var(--font-display); }
        .section-dash-desc { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .section-dash-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 16px;
        }
        .section-dash-card {
          display: flex; flex-direction: column; gap: 8px; padding: 14px 12px; border-radius: 14px;
          border: 1px solid var(--border); background: var(--surface); text-align: left;
          cursor: pointer; transition: border-color 0.15s ease, background 0.15s ease;
        }
        .section-dash-card:hover { background: var(--surface-2); }
        .section-dash-card-icon {
          width: 32px; height: 32px; border-radius: 9px; background: var(--surface-2);
          color: var(--accent); display: flex; align-items: center; justify-content: center;
        }
        .section-dash-card-label { font-size: 13.5px; font-weight: 600; color: var(--text); }
        .section-dash-card-sub { font-size: 11.5px; color: var(--text-muted); }
      `}</style>

      <div className="section-dash-header">
        <button className="section-dash-back" onClick={() => router.back()} aria-label="Back">
          <ChevronLeft size={18} />
        </button>
        {Icon && (
          <div className="section-dash-icon">
            <Icon size={20} />
          </div>
        )}
        <div>
          <div className="section-dash-title">{title}</div>
          {description && <div className="section-dash-desc">{description}</div>}
        </div>
      </div>

      <div className="section-dash-grid">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const content = (
            <>
              {ItemIcon && (
                <div className="section-dash-card-icon">
                  <ItemIcon size={16} />
                </div>
              )}
              <div>
                <div className="section-dash-card-label">{item.label}</div>
                {item.sub && <div className="section-dash-card-sub">{item.sub}</div>}
              </div>
              <ChevronRight size={14} style={{ color: "var(--text-muted)", alignSelf: "flex-end", marginTop: -20 }} />
            </>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="section-dash-card">
                {content}
              </Link>
            );
          }
          return (
            <button key={item.label} className="section-dash-card" onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}