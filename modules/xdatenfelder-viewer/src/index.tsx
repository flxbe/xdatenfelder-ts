import * as React from "react";
import { createRoot } from "react-dom/client";
import { Routes, Route, BrowserRouter, Link, useMatch } from "react-router-dom";
import { DataField, Schema } from "xdatenfelder-xml";

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

function UploadPage({ onSchemaUpload }: UploadPageProps) {
  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files === null || files.length === 0) {
      return;
    }

    const data = await loadFile(files[0]);
    const schema = Schema.fromString(data);
    onSchemaUpload(schema);
  }

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="card">
            <div className="card-body">
              <label htmlFor="fileUpload" className="form-label">
                Datei hochladen
              </label>
              <input
                className="form-control"
                type="file"
                id="fileUpload"
                onChange={onChange}
              />
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
    <div className="container my-5">
      <div className="container my-5">
        <ul className="nav nav-pills justify-content-center">
          {renderLink("Vorschau", "/")}
          {renderLink("Datenfeldgrupppen (0)", "/groups")}
          {renderLink(
            `Datenfelder (${schema.dataFields.length})`,
            "/datafields"
          )}
          {renderLink("Codelisten (0)", "/codelists")}
        </ul>
      </div>
      <Routes>
        <Route path="/" element={<PreviewPage schema={schema} />}></Route>
        <Route path="/groups" element={<div>Gruppen</div>}></Route>
        <Route
          path="/datafields"
          element={<DataFieldsPage schema={schema} />}
        ></Route>
        <Route path="/codelists" element={<div>Codelisten</div>}></Route>
      </Routes>
    </div>
  );
}

function renderLink(name: string, target: string) {
  const isActive = Boolean(useMatch(target));

  const className = isActive ? "nav-link active" : "nav-link";

  return (
    <li className="nav-item">
      <Link to={target} className={className} aria-current={isActive}>
        {name}
      </Link>
    </li>
  );
}

type PreviewPageProps = {
  schema: Schema;
};

function PreviewPage({ schema }: PreviewPageProps) {
  return <div>Preview</div>;
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
  for (const dataField of schema.dataFields) {
    const counter = typeCounter[dataField.type] || 0;
    typeCounter[dataField.type] = counter + 1;
  }

  let dataFields = schema.dataFields;
  if (types.size > 0) {
    dataFields = dataFields.filter((dataField) => types.has(dataField.type));
  }

  return (
    <div className="row">
      <div className="col-12 col-md-3">
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
      <div className="col-12 col-md-9">
        {dataFields.map((dataField) => (
          <DataFieldCard key={dataField.identifier} dataField={dataField} />
        ))}
      </div>
    </div>
  );
}

function renderTypeFilter(
  name: string,
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
) {
  return (
    <div className="form-check">
      <input className="form-check-input" type="checkbox" value="" id={name} />
      <label className="form-check-label" htmlFor={name}>
        {name}
      </label>
    </div>
  );
}

type DataFieldCardProps = {
  dataField: DataField;
};

const TYPE_TO_COLOR_CLASS: Record<string, string> = {
  input: "text-bg-primary",
  select: "text-bg-success",
  label: "text-bg-dark",
};

function DataFieldCard({ dataField }: DataFieldCardProps) {
  const colorClass = TYPE_TO_COLOR_CLASS[dataField.type] || "text-bg-secondary";

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{dataField.name}</h5>
        <h6 className="card-subtitle mb-2 text-muted">
          <span className="badge text-bg-secondary">
            {dataField.identifier}
          </span>{" "}
          <span className={`badge ${colorClass}`}>{dataField.type}</span>
        </h6>
        <p className="card-text">{dataField.definition}</p>
      </div>
    </div>
  );
}

function Root() {
  return (
    <React.StrictMode>
      <BrowserRouter>
        <Application />
      </BrowserRouter>
    </React.StrictMode>
  );
}

const element = document.getElementById("root");
if (element === null) {
  throw Error("Cannot find #root element");
}

const root = createRoot(element);
root.render(<Root />);
