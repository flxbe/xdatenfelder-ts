import * as React from "react";
import { Warning as SchemaWarning } from "xdatenfelder-xml";

export type WarningProps = {
  warning: SchemaWarning;
};

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
          <b>Ungültige Präzisierung in Datenfeld {warning.identifier}</b>
          <br />
          <code>{warning.value}</code>
        </>
      );
    }
  }
}
