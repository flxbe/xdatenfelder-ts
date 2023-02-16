import * as React from "react";
import { Schema } from "xdatenfelder-xml";

export interface DataGroupsPageProps {
  schema: Schema;
}

export function DataGroupsPage({ schema }: DataGroupsPageProps) {
  return (
    <div className="container">
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-sm">
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Version</th>
              <th scope="col">Elemente</th>
              <th scope="col">Regeln</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(schema.dataGroups).map((group) => (
              <tr key={group.identifier}>
                <th scope="row">{group.identifier}</th>
                <td>{group.version}</td>
                <td>
                  {group.elements
                    .map((element) => element.identifier)
                    .join(", ")}
                </td>
                <td>{group.rules.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
