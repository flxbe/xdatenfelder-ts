import * as React from "react";

export function multilineToHtml(
  value: string | undefined
): JSX.Element[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  const elements: JSX.Element[] = [];
  const lines = value.replace(/&#xD;/g, "").split("\n");
  for (let i = 0; i < lines.length - 1; i = i + 1) {
    elements.push(
      <span key={i}>
        {lines[i]}
        <br />
      </span>
    );
  }

  // Push the last line without an additional line-break
  elements.push(<span key={lines.length - 1}>{lines[lines.length - 1]}</span>);

  return elements;
}
