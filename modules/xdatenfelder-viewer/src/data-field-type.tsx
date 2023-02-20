import * as React from "react";
import { Link } from "react-router-dom";
import { DataField } from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

const TYPE_TO_COLOR_CLASS: Record<string, string> = {
  select: "text-bg-success",
  text: "text-bg-primary",
  label: "text-bg-dark",
};

export function DataFieldType({ type }: { type: string }) {
  const colorClass = TYPE_TO_COLOR_CLASS[type] || "text-bg-secondary";

  return <span className={`badge ${colorClass}`}>{type}</span>;
}
