import * as React from "react";
import { Feldart } from "xdatenfelder-xml/src/v2";

const TYPE_TO_COLOR_CLASS: Record<Feldart, string> = {
  select: "text-bg-success",
  input: "text-bg-primary",
  label: "text-bg-dark",
};

export function DataFieldType({ type }: { type: Feldart }) {
  const colorClass = TYPE_TO_COLOR_CLASS[type] || "text-bg-secondary";

  return <span className={`badge ${colorClass}`}>{type}</span>;
}
