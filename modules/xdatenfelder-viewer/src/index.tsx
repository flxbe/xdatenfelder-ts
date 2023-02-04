import * as React from "react";
import { createRoot } from "react-dom/client";
import { DataField, Schema } from "xdatenfelder-xml";

function Application() {
  const [schema, setSchema] = React.useState<Schema | null>(null);

  if (schema !== null) {
    return <Viewer schema={schema} />;
  } else {
    return <UploadPage onSchemaUpload={setSchema} />;
  }
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
      <div className="row">
        <div className="col-12 col-md-3">
          <div className="card">
            <ul className="list-group list-group-flush">
              <li className="list-group-item">Vorschau</li>
              <li className="list-group-item active">
                Datenfelder ({schema.dataFields.length})
              </li>
              <li className="list-group-item">Codelisten (0)</li>
              <li className="list-group-item">Datenfeldgruppen (0)</li>
            </ul>
          </div>
        </div>
        <div className="col-12 col-md-9">
          {schema.dataFields.map((dataField) => (
            <DataFieldCard key={dataField.identifier} dataField={dataField} />
          ))}
        </div>
      </div>
    </div>
  );
}

type DataFieldCardProps = {
  dataField: DataField;
};

function DataFieldCard({ dataField }: DataFieldCardProps) {
  return (
    <div className="card mb-3">
      <div className="card-body">{dataField.identifier}</div>
    </div>
  );
}

console.log("moin");

const element = document.getElementById("root");
if (element === null) {
  throw Error("Cannot find #root element");
}

const root = createRoot(element);
root.render(<Application />);
