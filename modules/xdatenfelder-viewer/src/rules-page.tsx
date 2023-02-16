import * as React from "react";
import { Schema } from "xdatenfelder-xml";
import { Link } from "react-router-dom";

export interface RulesPageProps {
  schema: Schema;
}

export function RulesPage({ schema }: RulesPageProps) {
  const rules = Object.values(schema.rules);

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
            {rules.map((rule) => (
              <Link
                className="list-group-item list-group-item-action"
                to={`/rules/${rule.identifier}`}
                key={rule.identifier}
              >
                <div className="row">
                  <div className="col-12 col-md">
                    <h6 className="mb-0">
                      {rule.name}{" "}
                      <small className="text-muted">v{rule.version}</small>
                    </h6>
                    <small>
                      <span className="text-muted">Erstellt von</span>{" "}
                      {rule.creator ?? "Unbekannt"}
                    </small>
                  </div>
                  <div className="col-12 col-md-auto">
                    <span className="badge bg-secondary">
                      {rule.identifier}
                    </span>{" "}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
