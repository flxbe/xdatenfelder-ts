import * as React from "react";
import { Warning as SchemaWarning } from "xdatenfelder-xml/src/v2";

export interface WarningProps {
  warning: SchemaWarning;
}

export function Warning({ warning }: WarningProps) {
  return (
    <div className="alert alert-warning mb-3" role="alert">
      {getMessage(warning)}
    </div>
  );
}

function getMessage(warning: SchemaWarning) {
  switch (warning.type) {
    case "invalidInputConstraints": {
      return (
        <>
          <b>Ungültige Präzisierung in Element {warning.identifier}</b>
          <br />
          <code>{warning.value}</code>
        </>
      );
    }
    case "missingAttribute": {
      return (
        <>
          <b>
            Fehlender Attributwert "{warning.attribute}" in Datenfeld{" "}
            {warning.identifier}
          </b>
        </>
      );
    }
    default:
      throw new Error(`Unknown warning: ${warning}`);
  }
}
