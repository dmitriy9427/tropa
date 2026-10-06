export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="var(--ink)" />
      <path
        d="M12 46c8-2 10-12 18-14s12 6 22-4"
        fill="none"
        stroke="var(--paper)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
      <circle cx="12" cy="46" r="5" fill="var(--paper)" />
      <path d="M50 12a8 8 0 0 0-8 8c0 6 8 13 8 13s8-7 8-13a8 8 0 0 0-8-8z" fill="var(--accent)" />
      <circle cx="50" cy="20" r="3" fill="var(--ink)" />
    </svg>
  )
}
