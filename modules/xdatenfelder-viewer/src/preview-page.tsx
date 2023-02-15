import * as React from "react";
import {
  DataField,
  DataGroup,
  ElementReference,
  Schema,
} from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

export interface PreviewPageProps {
  schema: Schema;
}

export function PreviewPage({ schema }: PreviewPageProps) {
  const [page, setPage] = React.useState<string | null>(null);

  return (
    <div className="row">
      <div className="col-12 col-lg-3">
        <div className="list-group mt-2 mb-5">
          <NavLink to={null} location={page} onClick={setPage}>
            Start
          </NavLink>
          {schema.schemaData.elements.map(({ type, identifier }) => {
            let label = "";
            if (type === "dataGroup") {
              const group = schema.dataGroups[identifier];
              label = group.inputLabel;
            } else {
              const dataField = schema.dataFields[identifier];
              label = dataField.inputLabel;
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
        {schema.schemaData.elements.map((element) => {
          return (
            <Optional
              key={element.identifier}
              identifier={element.identifier}
              location={page}
            >
              <Step schema={schema} element={element} />
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
  ({ schema, element }: { schema: Schema; element: ElementReference }) => {
    const { type, identifier } = element;

    if (type === "dataField") {
      const dataField = schema.getDataField(identifier);

      return (
        <div>
          <h2 className="mb-4">{dataField.inputLabel}</h2>
          <DataFieldSection dataField={dataField} />
        </div>
      );
    } else {
      const dataGroup = schema.getDataGroup(identifier);

      return (
        <div>
          <h2 className="mb-4">{dataGroup.inputLabel}</h2>

          {dataGroup.elements.map((element) => {
            return (
              <Section
                key={element.identifier}
                schema={schema}
                element={element}
              />
            );
          })}
        </div>
      );
    }
  }
);

function Section({
  schema,
  element,
}: {
  schema: Schema;
  element: ElementReference;
}) {
  const { type, identifier } = element;

  if (type === "dataField") {
    const dataField = schema.getDataField(identifier);
    return <DataFieldSection dataField={dataField} />;
  } else {
    const dataGroup = schema.getDataGroup(identifier);
    return <DataGroupSection schema={schema} dataGroup={dataGroup} />;
  }
}

function DataFieldSection({ dataField }: { dataField: DataField }) {
  return (
    <div className="card mb-4">
      <div className="card-header">{dataField.name}</div>
      <div className="card-body pb-0">
        <DataFieldInput dataField={dataField} />
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
        {dataGroup.elements.map((element) => {
          return (
            <DataGroupElement
              key={element.identifier}
              schema={schema}
              element={element}
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
  element,
  level,
}: {
  schema: Schema;
  element: ElementReference;
  level: number;
}) {
  const { type, identifier } = element;

  if (type === "dataField") {
    const dataField = schema.getDataField(identifier);
    return <DataFieldInput dataField={dataField} />;
  } else {
    const dataGroup = schema.getDataGroup(identifier);
    return (
      <DataSubGroupElement
        schema={schema}
        dataGroup={dataGroup}
        level={level}
      />
    );
  }
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
    title = <h3>{dataGroup.inputLabel}</h3>;
  } else if (level === 2) {
    title = <h4>{dataGroup.inputLabel}</h4>;
  } else {
    title = <h5>{dataGroup.inputLabel}</h5>;
  }

  return (
    <>
      {title}
      {dataGroup.elements.map((element) => {
        return (
          <DataGroupElement
            key={element.identifier}
            element={element}
            schema={schema}
            level={level + 1}
          />
        );
      })}
    </>
  );
}

function DataFieldInput({ dataField }: { dataField: DataField }) {
  switch (dataField.input.type) {
    case "select": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
          <select className="form-select" aria-label={dataField.inputLabel}>
            <option value="1">Beispiel 1</option>
            <option value="2">Beispiel 2</option>
            <option value="3">Beispiel 3</option>
          </select>
          {inputHelp(dataField)}
        </div>
      );
    }

    case "text": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
          <input type="text" className="form-control" />
          {inputHelp(dataField)}
        </div>
      );
    }

    case "number":
    case "integer":
    case "currency": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
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
            <label className="form-check-label" htmlFor={dataField.identifier}>
              {dataField.inputLabel}
            </label>
          </div>
          {inputHelp(dataField)}
        </div>
      );
    }

    case "file": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
          <input className="form-control" type="file" />
          {inputHelp(dataField)}
        </div>
      );
    }

    case "object": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
          <input className="form-control" type="file" />
          {inputHelp(dataField)}
        </div>
      );
    }

    case "date": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.inputLabel}</label>
          <input type="text" className="form-control" />
          {inputHelp(dataField)}
        </div>
      );
    }

    case "label": {
      return (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">{dataField.inputLabel}</h5>
          {multilineToHtml(dataField.input.content)}
        </div>
      );
    }
  }
}

function inputHelp(dataField: DataField) {
  return (
    <div className="form-text">{multilineToHtml(dataField.inputHint)}</div>
  );
}
