import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  accent?: "default" | "warn" | "danger" | "good";
}) {
  const accentClass =
    accent === "warn"
      ? "text-amber-300"
      : accent === "danger"
        ? "text-red-300"
        : accent === "good"
          ? "text-emerald-300"
          : "text-white";
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
        {icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-ink-800 text-ink-300">
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-3 font-display text-2xl font-bold sm:text-3xl ${accentClass}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function EmptyState({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 py-16 text-center">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {desc && <p className="max-w-sm text-sm text-ink-400">{desc}</p>}
      {action}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-white"
    >
      ← {label}
    </Link>
  );
}

export function AdminContainer({ children }: { children: ReactNode }) {
  return <div className="p-5 sm:p-8">{children}</div>;
}
