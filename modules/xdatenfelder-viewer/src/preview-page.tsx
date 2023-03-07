import * as React from "react";
import {
  Datenfeld,
  Datenfeldgruppe,
  ElementReference,
  SchemaContainer,
} from "xdatenfelder-xml/src/v2";
import { multilineToHtml } from "./util";

export interface PreviewPageProps {
  container: SchemaContainer;
}

export function PreviewPage({ container }: PreviewPageProps) {
  const [page, setPage] = React.useState<string | null>(null);

  function renderContent() {
    if (page === null) {
      return <Start container={container} />;
    } else {
      for (const element of container.schema.elemente) {
        if (element.identifier === page) {
          return <Step container={container} element={element} />;
        }
      }

      throw new Error(`Cannot find page with identifier ${page}`);
    }
  }

  return (
    <div className="row">
      <div className="col-12 col-lg-4 col-xl-3">
        <div className="list-group mt-2 mb-5">
          <NavLink to={null} location={page} onClick={setPage}>
            Start
          </NavLink>
          {container.schema.elemente.map(({ type, identifier }) => {
            let label = "";
            if (type === "dataGroup") {
              const group = container.datenfeldgruppen.get(identifier);
              label = group.bezeichnungEingabe;
            } else {
              const dataField = container.datenfelder.get(identifier);
              label = dataField.bezeichnungEingabe;
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
      <div className="col-12 col-lg-8 col-xl-9">{renderContent()}</div>
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

function Start({ container }: { container: SchemaContainer }) {
  return (
    <div>
      <h3>{container.schema.name}</h3>
      <p>{container.schema.beschreibung}</p>
    </div>
  );
}

function Step({
  container,
  element,
}: {
  container: SchemaContainer;
  element: ElementReference;
}) {
  const { type, identifier } = element;

  if (type === "dataField") {
    const dataField = container.datenfelder.get(identifier);

    return (
      <div>
        <h2 className="mb-4">{dataField.bezeichnungEingabe}</h2>
        <DataFieldSection dataField={dataField} />
      </div>
    );
  } else {
    const dataGroup = container.datenfeldgruppen.get(identifier);

    return (
      <div>
        <h2 className="mb-4">{dataGroup.bezeichnungEingabe}</h2>

        {dataGroup.elemente.map((element) => {
          return (
            <Section
              key={element.identifier}
              container={container}
              element={element}
            />
          );
        })}
      </div>
    );
  }
}

function Section({
  container,
  element,
}: {
  container: SchemaContainer;
  element: ElementReference;
}) {
  const { type, identifier } = element;

  if (type === "dataField") {
    const dataField = container.datenfelder.get(identifier);
    return <DataFieldSection dataField={dataField} />;
  } else {
    const dataGroup = container.datenfeldgruppen.get(identifier);
    return <DataGroupSection container={container} dataGroup={dataGroup} />;
  }
}

function DataFieldSection({ dataField }: { dataField: Datenfeld }) {
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
  container,
  dataGroup,
}: {
  container: SchemaContainer;
  dataGroup: Datenfeldgruppe;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header">{dataGroup.name}</div>
      <div className="card-body pb-0">
        {dataGroup.elemente.map((element) => {
          return (
            <DataGroupElement
              key={element.identifier}
              container={container}
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
  container,
  element,
  level,
}: {
  container: SchemaContainer;
  element: ElementReference;
  level: number;
}) {
  const { type, identifier } = element;

  if (type === "dataField") {
    const dataField = container.datenfelder.get(identifier);
    return <DataFieldInput dataField={dataField} />;
  } else {
    const dataGroup = container.datenfeldgruppen.get(identifier);
    return (
      <DataSubGroupElement
        container={container}
        dataGroup={dataGroup}
        level={level}
      />
    );
  }
}

function DataSubGroupElement({
  container,
  dataGroup,
  level,
}: {
  container: SchemaContainer;
  dataGroup: Datenfeldgruppe;
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
      {dataGroup.elemente.map((element) => {
        return (
          <DataGroupElement
            key={element.identifier}
            element={element}
            container={container}
            level={level + 1}
          />
        );
      })}
    </>
  );
}

function DataFieldInput({ dataField }: { dataField: Datenfeld }) {
  const [value, setValue] = React.useState<string>("");

  const inputProps = {
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => setValue(event.target.value),
  };

  switch (dataField.feldart) {
    case "select": {
      return (
        <div className="mb-3">
          <label className="form-label">{dataField.bezeichnungEingabe}</label>
          <select
            className="form-select"
            aria-label={dataField.bezeichnungEingabe}
            {...inputProps}
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
      switch (dataField.datentyp) {
        case "text": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input type="text" className="form-control" {...inputProps} />
              {inputHelp(dataField)}
            </div>
          );
        }

        case "num":
        case "num_int":
        case "num_currency": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input type="number" className="form-control" {...inputProps} />
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
                  {...inputProps}
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
              <input className="form-control" type="file" {...inputProps} />
              {inputHelp(dataField)}
            </div>
          );
        }

        case "obj": {
          return (
            <div className="mb-3">
              <label className="form-label">
                {dataField.bezeichnungEingabe}
              </label>
              <input className="form-control" type="file" {...inputProps} />
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
              <input type="text" className="form-control" {...inputProps} />
              {inputHelp(dataField)}
            </div>
          );
        }

        default:
          console.error(
            `Unknown datentyp for ${dataField.identifier}: ${dataField.datentyp}`
          );
          return <div>Unbekannter Datentyp: {dataField.datentyp}</div>;
      }
    }

    case "label": {
      return (
        <div className="alert alert-info" role="alert">
          <h5 className="alert-heading">{dataField.bezeichnungEingabe}</h5>
          {multilineToHtml(dataField.inhalt)}
        </div>
      );
    }
  }
}

function inputHelp(dataField: Datenfeld) {
  return (
    <div className="form-text">
      {multilineToHtml(dataField.hilfetextEingabe)}
    </div>
  );
}
