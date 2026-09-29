/**
 * Shows the user's Discord avatar (animated GIFs included) when available,
 * otherwise a monochrome initial. `className` controls size/shape (pass e.g.
 * "h-8 w-8"). Uses a plain <img> so animated avatars keep animating.
 */
export function Avatar({
  src,
  name,
  className = "h-8 w-8",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-white ${className}`}
    >
      {initial}
    </span>
  );
}
