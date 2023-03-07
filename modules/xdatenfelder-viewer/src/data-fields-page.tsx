import * as React from "react";
import { Link } from "react-router-dom";
import { SchemaContainer } from "xdatenfelder-xml/src/v2";
import { DataFieldType } from "./data-field-type";

type DataFieldsPageProps = {
  container: SchemaContainer;
};

export function DataFieldsPage({ container }: DataFieldsPageProps) {
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
  for (const dataField of Object.values(container.datenfelder.entries())) {
    const counter = typeCounter[dataField.feldart] ?? 0;
    typeCounter[dataField.feldart] = counter + 1;
  }

  let dataFields = Object.values(container.datenfelder.entries());
  if (types.size > 0) {
    dataFields = dataFields.filter((dataField) => types.has(dataField.feldart));
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
                      {dataField.fachlicherErsteller ?? "Unbekannt"}
                    </small>
                  </div>
                  <div className="col-12 col-md-auto">
                    <DataFieldType type={dataField.feldart} />
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
