import * as React from "react";
import { Schema } from "xdatenfelder-xml";

export interface DataGroupsPageProps {
  schema: Schema;
}

export function DataGroupsPage({ schema }: DataGroupsPageProps) {
  const dataGroups = Object.values(schema.dataGroups);

  return (
    <div className="container-xxl">
      <div className="row">
        <div className="col-12 col-lg-2">
          <div>
            <h5>Filter</h5>
            <span className="text-muted">Keine Filter</span>
          </div>
        </div>
        <div className="col-12 col-lg-10">
          <div className="list-group">
            {dataGroups.map((dataGroup) => (
              <div
                className="list-group-item list-group-item-action"
                key={dataGroup.identifier}
              >
                <div>
                  <h6 className="mb-0">
                    <span className="badge rounded-pill text-bg-secondary">
                      {dataGroup.identifier}
                    </span>{" "}
                    {dataGroup.name}{" "}
                    <small className="text-muted">v{dataGroup.version}</small>
                  </h6>
                  <small>
                    <span className="text-muted">Erstellt von</span>{" "}
                    {dataGroup.creator ?? "Unbekannt"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
