import * as React from "react";
import { SchemaContainer } from "xdatenfelder-xml/src/v2";

export interface CodeListsPageProps {
  container: SchemaContainer;
}

export function CodeListsPage({ container }: CodeListsPageProps) {
  return (
    <div className="container">
      <div className="table-responsive">
        <table className="table table-striped table-bordered table-sm">
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Version</th>
              <th scope="col">Canonical Version URI</th>
            </tr>
          </thead>
          <tbody>
            {container.getCodeLists().map((reference) => (
              <tr key={reference.genericode.canonicalVersionUri}>
                <th scope="row">{reference.id}</th>
                <td>{reference.genericode.version}</td>
                <td>{reference.genericode.canonicalVersionUri}</td>
              </tr>
            ))}
            {}
          </tbody>
        </table>
      </div>
    </div>
  );
}
