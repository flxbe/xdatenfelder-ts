import * as React from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, HashRouter, Link, useMatch } from "react-router-dom";
import {
  SchemaMessage,
  Warning as SchemaWarning,
  SchemaWarnings,
  SchemaContainer,
} from "xdatenfelder-xml/src/v2";
import { Warning } from "./warning";
import { DataFieldsPage } from "./data-fields-page";
import { DataFieldPage } from "./data-field-page";
import { CodeListsPage } from "./code-lists-page";
import { DataGroupsPage } from "./data-groups-page";
import { PreviewPage } from "./preview-page";
import { multilineToHtml } from "./util";
import { RulesPage } from "./rules-page";
import { NotFoundPage } from "./not-found-page";
import { RulePage } from "./rule-page";

interface State {
  container: SchemaContainer;
  warnings: SchemaWarnings;
}

function Application() {
  const [state, setState] = React.useState<State | null>(null);

  function renderContent() {
    if (state !== null) {
      return <Viewer state={state} />;
    } else {
      return <UploadPage onSchemaUpload={setState} />;
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

interface UploadPageProps {
  onSchemaUpload: (state: State) => void;
}

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

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files === null || files.length === 0) {
      return;
    }

    setState({ type: "loading" });

    try {
      const data = await loadFile(files[0]);
      const measure = performance.measure("loading");
      console.time("parse");
      const { message, warnings } = SchemaMessage.fromString(data);
      console.timeEnd("parse");
      onSchemaUpload({ container: message.schemaContainer, warnings });
    } catch (error: any) {
      console.error(error);
      setState({ type: "error", message: `${error}` });
    }
  }

  function renderProgress() {
    if (state.type !== "loading") {
      return undefined;
    }

    return (
      <div
        className="mt-3 mb-0 alert alert-info d-flex align-items-center"
        role="alert"
      >
        <div>Datei wird geladen...</div>
      </div>
    );
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
              <h4 className="card-title mb-3">Datei ??ffnen</h4>
              <input
                className="form-control"
                type="file"
                accept=".xml"
                disabled={isLoading}
                onChange={onChange}
              />
              <div className="form-text">
                Die Datei wird ausschlie??lich lokal ge??ffnet. Es werden keine
                Daten an den Server gesendet.
              </div>
              {renderProgress()}
              {renderError()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ViewerProps = {
  state: State;
};

function Viewer({ state }: ViewerProps) {
  const { container, warnings } = state;

  return (
    <>
      <div className="container-fluid px-4 pt-4 border-bottom bg-white">
        <h5>
          <span className="badge rounded-pill text-bg-secondary">
            {container.schema.identifier}
          </span>{" "}
          {container.schema.name}{" "}
          <small className="text-muted">v{container.schema.version}</small>{" "}
        </h5>
        <ul className="nav mt-4">
          {renderLink("Schema", "/")}
          {renderLink("Vorschau", "/preview")}
          {renderBadeLink(
            "Datenfeldgrupppen",
            "/groups",
            container.datenfeldgruppen.count()
          )}
          {renderBadeLink(
            "Datenfelder",
            "/datafields",
            container.datenfelder.count()
          )}
          {renderBadeLink("Regeln", "/rules", container.regeln.count())}
          {renderBadeLink(
            "Codelisten",
            "/codelists",
            container.getCodeLists().length
          )}
        </ul>
      </div>
      <div className="container p-4">
        <Routes>
          <Route path="/" element={<OverviewPage state={state} />}></Route>
          <Route
            path="/preview"
            element={<PreviewPage container={container} />}
          ></Route>
          <Route
            path="/groups"
            element={<DataGroupsPage container={container} />}
          ></Route>
          <Route
            path="/datafields"
            element={<DataFieldsPage container={container} />}
          ></Route>
          <Route
            path="/datafields/:identifier"
            element={<DataFieldPage container={container} />}
          ></Route>
          <Route
            path="/rules"
            element={<RulesPage container={container} />}
          ></Route>
          <Route
            path="/rules/:identifier"
            element={<RulePage container={container} />}
          ></Route>
          <Route
            path="/codelists"
            element={<CodeListsPage container={container} />}
          ></Route>
          <Route path="*" element={<NotFoundPage />} />
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
  state: State;
};

function OverviewPage({ state }: OverviewPageProps) {
  const { container, warnings } = state;

  return (
    <div className="container-xxl">
      <h4 className="mb-2">Eigenschaften</h4>
      <dl className="row">
        <dt className="col-sm-3">Id</dt>
        <dd className="col-sm-9">{container.schema.identifier}</dd>

        <dt className="col-sm-3">Versionshinweis</dt>
        <dd className="col-sm-9">{container.schema.versionshinweis ?? "-"}</dd>

        <dt className="col-sm-3">Fachlicher Ersteller</dt>
        <dd className="col-sm-9">
          {container.schema.fachlicherErsteller ?? "-"}
        </dd>

        <dt className="col-sm-3">Bezug</dt>
        <dd className="col-sm-9">
          {multilineToHtml(container.schema.bezug ?? "-")}
        </dd>

        <dt className="col-sm-3">Definition</dt>
        <dd className="col-sm-9">
          {multilineToHtml(container.schema.definition ?? "-")}
        </dd>

        <dt className="col-sm-3">Beschreibung</dt>
        <dd className="col-sm-9">
          {multilineToHtml(container.schema.beschreibung ?? "-")}
        </dd>
      </dl>

      {renderStatus(warnings)}
    </div>
  );
}

function renderStatus(warnings: SchemaWarnings) {
  const allWarnings: SchemaWarning[] = [];
  for (const warning of warnings.schemaWarnings) {
    allWarnings.push(warning);
  }
  for (const dataFieldWarnings of Object.values(warnings.dataFieldWarnings)) {
    for (const warning of dataFieldWarnings) {
      allWarnings.push(warning);
    }
  }
  for (const dataGroupWarnings of Object.values(warnings.dataGroupWarnings)) {
    for (const warning of dataGroupWarnings) {
      allWarnings.push(warning);
    }
  }
  for (const ruleWarnings of Object.values(warnings.ruleWarnings)) {
    for (const warning of ruleWarnings) {
      allWarnings.push(warning);
    }
  }

  function renderContent() {
    if (allWarnings.length === 0) {
      return (
        <div className="alert alert-success" role="alert">
          Keine Warnungen
        </div>
      );
    } else {
      return (
        <div>
          {allWarnings.map((warning, index) => (
            <Warning key={index} warning={warning} />
          ))}
        </div>
      );
    }
  }

  return (
    <>
      <h4 className="mb-2">
        Status
        {allWarnings.length === 0 ? undefined : (
          <span className="ms-1 badge bg-warning">
            {allWarnings.length} Warnungen
          </span>
        )}
      </h4>
      {renderContent()}
    </>
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
