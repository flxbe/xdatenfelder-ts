import * as React from "react";
import { Schema } from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

export interface RulesPageProps {
  schema: Schema;
}

export function RulesPage({ schema }: RulesPageProps) {
  return (
    <div className="container">
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-sm">
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Version</th>
              <th scope="col">Script</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(schema.rules).map((rule) => (
              <tr key={rule.identifier}>
                <th scope="row">{rule.identifier}</th>
                <td>{rule.version}</td>
                <td>{multilineToHtml(rule.definition)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
