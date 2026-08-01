import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

function NavBadge({ count }: { count: number }) {
  const label = count > 9 ? "9+" : String(count);
  return (
    <span className="app-navbar-badge" aria-hidden="true">
      {label}
    </span>
  );
}

export function NavIconLink({
  to,
  label,
  icon,
  badge,
  variant,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  badge?: number;
  variant: "pill" | "action";
}) {
  const showBadge = typeof badge === "number" && badge > 0;
  const baseClass =
    variant === "pill" ? "app-navbar-pill-item" : "app-navbar-action";
  const activeClass =
    variant === "pill"
      ? "app-navbar-pill-item-active"
      : "app-navbar-action-active";

  return (
    <NavLink
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        cn(baseClass, isActive && activeClass)
      }
    >
      {icon}
      {showBadge && <NavBadge count={badge} />}
    </NavLink>
  );
}
