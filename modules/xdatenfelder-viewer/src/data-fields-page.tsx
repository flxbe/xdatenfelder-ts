import * as React from "react";
import { Link } from "react-router-dom";
import { Schema } from "xdatenfelder-xml";
import { DataFieldType } from "./data-field-type";

type DataFieldsPageProps = {
  schema: Schema;
};

export function DataFieldsPage({ schema }: DataFieldsPageProps) {
  const [types, setTypes] = React.useState<Set<string>>(new Set());

  function toggleType(type: string) {
    const newTypes = new Set(types);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setTypes(newTypes);
  }

  const typeCounter: Record<string, number> = {};
  for (const dataField of Object.values(schema.dataFields)) {
    const counter = typeCounter[dataField.input.type] ?? 0;
    typeCounter[dataField.input.type] = counter + 1;
  }

  let dataFields = Object.values(schema.dataFields);
  if (types.size > 0) {
    dataFields = dataFields.filter((dataField) =>
      types.has(dataField.input.type)
    );
  }

  return (
    <div className="container-xxl">
      <div className="row">
        <div className="col-12 col-lg-2">
          <div>
            <h5>Filter</h5>
            <h6>Typ</h6>
            {Object.entries(typeCounter).map(([type, counter]) => {
              return (
                <div key={type} className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    value={types.has(type) ? "true" : "false"}
                    onChange={() => toggleType(type)}
                    id={type}
                  />
                  <label className="form-check-label" htmlFor={type}>
                    {type} ({counter})
                  </label>
                </div>
              );
            })}
          </div>
        </div>
        <div className="col-12 col-lg-10">
          <div className="list-group">
            {dataFields.map((dataField) => (
              <Link
                className="list-group-item list-group-item-action"
                to={`/datafields/${dataField.identifier}`}
                key={dataField.identifier}
              >
                <div className="row">
                  <div className="col-12 col-md">
                    <h6 className="mb-0">
                      <span className="badge rounded-pill text-bg-secondary">
                        {dataField.identifier}
                      </span>{" "}
                      {dataField.name}{" "}
                      <small className="text-muted">v{dataField.version}</small>
                    </h6>
                    <small>
                      <span className="text-muted">Erstellt von</span>{" "}
                      {dataField.creator ?? "Unbekannt"}
                    </small>
                  </div>
                  <div className="col-12 col-md-auto">
                    <DataFieldType type={dataField.input.type} />
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
