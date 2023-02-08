import * as React from "react";
import { DataField, DataGroup, Schema } from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

export type PreviewPageProps = {
  schema: Schema;
};

export function PreviewPage({ schema }: PreviewPageProps) {
  const [page, setPage] = React.useState<string | null>(null);

  return (
    <div className="row">
      <div className="col-12 col-lg-3">
        <div className="list-group mt-2 mb-5">
          <NavLink to={null} location={page} onClick={setPage}>
            Start
          </NavLink>
          {schema.schemaData.steps.map((identifier) => {
            let label = "Unbekannt";

            const group = schema.dataGroups[identifier];
            if (group !== undefined) {
              label = group.bezeichnungEingabe || "Unbekannt";
            } else {
              const dataField = schema.dataFields[identifier];
              label = dataField?.bezeichnungEingabe || "Unbekannt";
            }

            return (
              <NavLink
                key={identifier}
                to={identifier}
                location={page}
                onClick={setPage}
              >
                {label}
              </NavLink>
            );
          })}
        </div>
      </div>
      <div className="col-12 col-lg-9">
        <Optional identifier={null} location={page}>
          <Start schema={schema} />
        </Optional>
        {schema.schemaData.steps.map((identifier) => {
          return (
            <Optional key={identifier} identifier={identifier} location={page}>
              <Step schema={schema} identifier={identifier} />
            </Optional>
          );
        })}
      </div>
    </div>
  );
}

function NavLink({
  children,
  to,
  location,
  onClick,
}: {
  children: string;
  to: string | null;
  location: string | null;
  onClick: (to: string | null) => void;
}) {
  const isActive = to === location;

  const className = isActive
    ? "list-group-item list-group-item-action active"
    : "list-group-item list-group-item-action";

  return (
    <a
      className={className}
      href="#"
      onClick={(event) => {
        onClick(to);
        event.preventDefault();
      }}
    >
      {children}
    </a>
  );
}

function Optional({
  children,
  identifier,
  location,
}: {
  children: JSX.Element;
  identifier: string | null;
  location: string | null;
}) {
  const isActive = identifier === location;
  const className = isActive ? "" : "d-none";

  return <div className={className}>{children}</div>;
}

function Start({ schema }: { schema: Schema }) {
  return (
    <div>
      <h3>{schema.schemaData.name}</h3>
      <p>{schema.schemaData.description}</p>
    </div>
  );
}

const Step = React.memo(
  ({ schema, identifier }: { schema: Schema; identifier: string }) => {
    const dataField = schema.dataFields[identifier];
    if (dataField !== undefined) {
      return (
        <div>
          <h2 className="mb-4">{dataField.bezeichnungEingabe}</h2>
          <DataFieldSection schema={schema} dataField={dataField} />
        </div>
      );
    }

    const group = schema.dataGroups[identifier];
    if (group === undefined) {
      return <div>Cannot find group {identifier}</div>;
    }

    return (
      <div>
        <h2 className="mb-4">{group.bezeichnungEingabe}</h2>

        {group.steps.map((identifier) => {
          return (
            <Section key={identifier} schema={schema} identifier={identifier} />
          );
        })}
      </div>
    );
  }
);

function Section({
  schema,
  identifier,
}: {
  schema: Schema;
  identifier: string;
}) {
  const dataField = schema.dataFields[identifier];
  if (dataField !== undefined) {
    return <DataFieldSection schema={schema} dataField={dataField} />;
  }

  const dataGroup = schema.dataGroups[identifier];
  if (dataGroup !== undefined) {
    return <DataGroupSection schema={schema} dataGroup={dataGroup} />;
  }

  console.warn(`Unbekanntes element: ${identifier}`);
  return <div>Unknown element {identifier}</div>;
}

function DataFieldSection({
  schema,
  dataField,
}: {
  schema: Schema;
  dataField: DataField;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">{dataField.name}</div>
      <div className="card-body pb-0">
        <DataFieldInput schema={schema} dataField={dataField} />
      </div>
    </div>
  );
}

function DataGroupSection({
  schema,
  dataGroup,
}: {
  schema: Schema;
  dataGroup: DataGroup;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">{dataGroup.name}</div>
      <div className="card-body pb-0">
        {dataGroup.steps.map((identifier) => {
          return (
            <DataGroupElement
              key={identifier}
              schema={schema}
              identifier={identifier}
              level={1}
            />
          );
        })}
      </div>
    </div>
  );
}

function DataGroupElement({
  schema,
  identifier,
  level,
}: {
  schema: Schema;
  identifier: string;
  level: number;
}) {
  const dataField = schema.dataFields[identifier];
  if (dataField !== undefined) {
    return <DataFieldInput schema={schema} dataField={dataField} />;
  }

  const dataGroup = schema.dataGroups[identifier];
  if (dataGroup !== undefined) {
    return (
      <DataSubGroupElement
        schema={schema}
        dataGroup={dataGroup}
        level={level}
      />
    );
  }

  console.warn(`Unbekanntes element: ${identifier}`);
  return <div>Unknown element {identifier}</div>;
}

function DataSubGroupElement({
  schema,
  dataGroup,
  level,
}: {
  schema: Schema;
  dataGroup: DataGroup;
  level: number;
}) {
  let title = undefined;
  if (level === 1) {
    title = <h3>{dataGroup.bezeichnungEingabe}</h3>;
  } else if (level === 2) {
    title = <h4>{dataGroup.bezeichnungEingabe}</h4>;
  } else {
    title = <h5>{dataGroup.bezeichnungEingabe}</h5>;
  }

  return (
    <>
      {title}
      {dataGroup.steps.map((identifier) => {
        return (
          <DataGroupElement
            key={identifier}
            identifier={identifier}
            schema={schema}
            level={level + 1}
          />
        );
      })}
    </>
  );
}

function DataFieldInput({
  schema,
  dataField,
}: {
  schema: Schema;
  dataField: DataField;
}) {
  switch (dataField.type) {
    case "select": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.bezeichnungEingabe}</label>
          <select
            className="form-select"
            aria-label={dataField.bezeichnungEingabe}
          >
            <option value="1">Beispiel 1</option>
            <option value="2">Beispiel 2</option>
            <option value="3">Beispiel 3</option>
          </select>
          {inputHelp(dataField)}
        </div>
      );
    }

    case "input": {
      switch (dataField.dataType) {
        case "text": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input type="text" className="form-control" />
              {inputHelp(dataField)}
            </div>
          );
        }

        case "num_int": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input type="number" className="form-control" />
              {inputHelp(dataField)}
            </div>
          );
        }

        case "bool": {
          return (
            <div className="mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={dataField.identifier}
                />
                <label
                  className="form-check-label"
                  htmlFor={dataField.identifier}
                >
                  {dataField.bezeichnungEingabe}
                </label>
              </div>
              {inputHelp(dataField)}
            </div>
          );
        }

        case "file": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input className="form-control" type="file" />
              {inputHelp(dataField)}
            </div>
          );
        }

        case "date": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input type="text" className="form-control" />
              {inputHelp(dataField)}
            </div>
          );
        }

        default: {
          return <div>Unbekannter Datentype: {dataField.dataType}</div>;
        }
      }
    }

    case "label": {
      return (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">{dataField.bezeichnungEingabe}</h5>
          {multilineToHtml(dataField.content)}
        </div>
      );
    }

    default: {
      console.warn(`Unbekannter input type: ${dataField.type}`);
      return <div>Unbekannter input type: {dataField.type}</div>;
    }
  }
}

function inputHelp(dataField: DataField) {
  return (
    <div className="form-text">
      {multilineToHtml(dataField.hilfetextEingabe)}
    </div>
  );
}
