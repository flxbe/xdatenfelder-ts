import * as React from "react";
import { Schema } from "xdatenfelder-xml";

export type CodeListsPageProps = {
  schema: Schema;
};

export function CodeListsPage({ schema }: CodeListsPageProps) {
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
            {schema.codeListReferences.map((reference) => (
              <tr key={reference.identifier}>
                <th scope="row">{reference.identifier}</th>
                <td>{reference.version}</td>
                <td>{reference.canonicalVersionUri}</td>
              </tr>
            ))}
            {}
          </tbody>
        </table>
      </div>
    </div>
  );
}