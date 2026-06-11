const PRIORITY_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  P0: { label: "P0 Critical", className: "text-red-700", dot: "bg-red-500" },
  HIGH: { label: "High", className: "text-orange-700", dot: "bg-orange-400" },
  NORMAL: { label: "Normal", className: "text-gray-600", dot: "bg-gray-400" },
  LOW: { label: "Low", className: "text-gray-400", dot: "bg-gray-300" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.NORMAL;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_CONFIG).map(([value, { label }]) => ({ value, label }));
