import * as React from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, HashRouter, Link, useMatch } from "react-router-dom";
import { Schema, Warning as SchemaWarning } from "xdatenfelder-xml";
import { Warning } from "./warning";
import { DataFieldCard } from "./data-field-card";
import { CodeListsPage } from "./code-lists-page";
import { DataGroupsPage } from "./data-groups-page";
import { PreviewPage } from "./preview-page";
import { multilineToHtml } from "./util";

function Application() {
  const [schema, setSchema] = React.useState<Schema | null>(null);

  function renderContent() {
    if (schema !== null) {
      return <Viewer schema={schema} />;
    } else {
      return <UploadPage onSchemaUpload={setSchema} />;
    }
  }

  return (
    <div>
      <nav className="navbar bg-dark" data-bs-theme="dark">
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1">xDatenfelder Viewer</span>
        </div>
      </nav>
      {renderContent()}
    </div>
  );
}

async function loadFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target === null) {
        return reject("Target is none");
      }
      const { result } = event.target;

      if (typeof result !== "string") {
        console.error(result);
        return reject("Unknown file content");
      }

      resolve(result);
    };

    reader.onerror = (event) => {
      reject(event.target?.error);
    };

    reader.readAsText(file, "utf-8");
  });
}

type UploadPageProps = {
  onSchemaUpload: (schema: Schema) => void;
};

interface ParserError {
  type: "error";
  message: string;
}

interface Ready {
  type: "ready";
}

interface Loading {
  type: "loading";
}

type UploadState = ParserError | Ready | Loading;

function UploadPage({ onSchemaUpload }: UploadPageProps) {
  const [state, setState] = React.useState<UploadState>({ type: "ready" });

  const isLoading = state.type === "loading";
  // const [error, setError] = React.useState<string | null>(null);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files === null || files.length === 0) {
      return;
    }

    setState({ type: "loading" });

    try {
      const data = await loadFile(files[0]);
      const schema = Schema.fromString(data);
      onSchemaUpload(schema);
    } catch (error) {
      console.error(error);
      setState({ type: "error", message: `${error}` });
    }
  }

  function renderError() {
    if (state.type !== "error") {
      return undefined;
    }

    const message = state.message;

    return (
      <div
        className="mt-3 mb-0 alert alert-danger d-flex align-items-center"
        role="alert"
      >
        <div>{message}</div>
      </div>
    );
  }

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title mb-3">Datei öffnen</h4>
              <input
                className="form-control"
                type="file"
                accept=".xml"
                disabled={isLoading}
                onChange={onChange}
              />
              <div className="form-text">
                Die Datei wird ausschließlich lokal geöffnet. Es werden keine
                Daten an den Server gesendet.
              </div>
              {renderError()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewerProps = {
  schema: Schema;
};

function Viewer({ schema }: ViewerProps) {
  return (
    <>
      <div className="container-fluid px-4 pt-4 border-bottom bg-white">
        <h5>
          {schema.schemaData.name}{" "}
          <span className="badge bg-secondary">
            Version {schema.schemaData.version}
          </span>
          <br />
          <small className="text-muted">{schema.schemaData.identifier}</small>
        </h5>
        <ul className="nav mt-4">
          {renderLink("Schema", "/")}
          {renderLink("Vorschau", "/preview")}
          {renderBadeLink(
            "Datenfeldgrupppen",
            "/groups",
            Object.keys(schema.dataGroups).length
          )}
          {renderBadeLink(
            "Datenfelder",
            "/datafields",
            Object.keys(schema.dataFields).length
          )}
          {renderBadeLink(
            "Codelisten",
            "/codelists",
            schema.codeListReferences.length
          )}
        </ul>
      </div>
      <div className="container p-3">
        <Routes>
          <Route path="/" element={<OverviewPage schema={schema} />}></Route>
          <Route
            path="/preview"
            element={<PreviewPage schema={schema} />}
          ></Route>
          <Route
            path="/groups"
            element={<DataGroupsPage schema={schema} />}
          ></Route>
          <Route
            path="/datafields"
            element={<DataFieldsPage schema={schema} />}
          ></Route>
          <Route
            path="/codelists"
            element={<CodeListsPage schema={schema} />}
          ></Route>
        </Routes>
      </div>
    </>
  );
}

function renderBadeLink(name: string, target: string, count: number) {
  const isActive = Boolean(useMatch(target));

  const className = isActive
    ? "nav-link text-reset border-bottom border-2 border-primary"
    : "nav-link text-reset";

  return (
    <li className="nav-item">
      <Link to={target} className={className} aria-current={isActive}>
        {name} <span className="badge text-bg-secondary">{count}</span>
      </Link>
    </li>
  );
}

function renderLink(name: string, target: string, strict: boolean = true) {
  let isActive = false;
  if (strict) {
    isActive = Boolean(useMatch(target));
  } else {
    isActive = Boolean(useMatch(`${target}/*`));
  }

  const className = isActive
    ? "nav-link text-reset border-bottom border-2 border-primary"
    : "nav-link text-reset";

  return (
    <li className="nav-item">
      <Link to={target} className={className} aria-current={isActive}>
        {name}
      </Link>
    </li>
  );
}

type OverviewPageProps = {
  schema: Schema;
};

function OverviewPage({ schema }: OverviewPageProps) {
  return (
    <div className="container-xxl">
      <h4 className="mb-2">Eigenschaften</h4>
      <dl className="row">
        <dt className="col-sm-3">Nachrichten-Id</dt>
        <dd className="col-sm-9">{schema.messageId}</dd>

        <dt className="col-sm-3">Id</dt>
        <dd className="col-sm-9">{schema.schemaData.identifier}</dd>

        <dt className="col-sm-3">Versionshinweis</dt>
        <dd className="col-sm-9">{schema.schemaData.versionInfo || "-"}</dd>

        <dt className="col-sm-3">Fachlicher Ersteller</dt>
        <dd className="col-sm-9">{schema.schemaData.creator}</dd>

        <dt className="col-sm-3">Bezug</dt>
        <dd className="col-sm-9">
          {multilineToHtml(schema.schemaData.relatedTo || "-")}
        </dd>

        <dt className="col-sm-3">Definition</dt>
        <dd className="col-sm-9">
          {multilineToHtml(schema.schemaData.definition || "-")}
        </dd>

        <dt className="col-sm-3">Beschreibung</dt>
        <dd className="col-sm-9">
          {multilineToHtml(schema.schemaData.description || "-")}
        </dd>
      </dl>

      <h4 className="mb-2">Status</h4>
      {renderStatus(schema.warnings)}
    </div>
  );
}

function renderStatus(warnings: Array<SchemaWarning>) {
  if (warnings.length === 0) {
    return (
      <div className="alert alert-success" role="alert">
        Keine Warnungen
      </div>
    );
  } else {
    return (
      <div>
        {warnings.map((warning, index) => (
          <Warning key={index} warning={warning} />
        ))}
      </div>
    );
  }
}

type DataFieldsPageProps = {
  schema: Schema;
};

function DataFieldsPage({ schema }: DataFieldsPageProps) {
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
    const counter = typeCounter[dataField.input.type] || 0;
    typeCounter[dataField.input.type] = counter + 1;
  }

  let dataFields = Object.values(schema.dataFields);
  if (types.size > 0) {
    dataFields = dataFields.filter((dataField) =>
      types.has(dataField.input.type)
    );
  }

  return (
    <div className="row">
      <div className="col-12 col-lg-2">
        <div>
          <h5>Typ</h5>
          {Object.entries(typeCounter).map(([type, counter]) => {
            return (
              <div key={type} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={`${types.has(type)}`}
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
        {dataFields.map((dataField) => (
          <DataFieldCard key={dataField.identifier} dataField={dataField} />
        ))}
      </div>
    </div>
  );
}

function Root() {
  return (
    <React.StrictMode>
      <HashRouter>
        <Application />
      </HashRouter>
    </React.StrictMode>
  );
}

const element = document.getElementById("root");
if (element === null) {
  throw Error("Cannot find #root element");
}

const root = createRoot(element);
root.render(<Root />);
