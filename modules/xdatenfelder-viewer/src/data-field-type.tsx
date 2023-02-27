import * as React from "react";

const TYPE_TO_COLOR_CLASS: Record<string, string> = {
  select: "text-bg-success",
  text: "text-bg-primary",
  label: "text-bg-dark",
};

export function DataFieldType({ type }: { type: string }) {
  const colorClass = TYPE_TO_COLOR_CLASS[type] || "text-bg-secondary";

  return <span className={`badge ${colorClass}`}>{type}</span>;
}
