import * as React from "react";
import { DataField } from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

export type DataFieldCardProps = {
  dataField: DataField;
};

const TYPE_TO_COLOR_CLASS: Record<string, string> = {
  input: "text-bg-primary",
  select: "text-bg-success",
  label: "text-bg-dark",
};

export function DataFieldCard({ dataField }: DataFieldCardProps) {
  const colorClass = TYPE_TO_COLOR_CLASS[dataField.type] || "text-bg-secondary";

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">
          {dataField.name}{" "}
          <small className="text-muted">v{dataField.version}</small>
        </h5>
        <h6 className="card-subtitle mb-3 text-muted">
          <span className="badge text-bg-secondary">
            {dataField.identifier}
          </span>{" "}
          <span className={`badge ${colorClass}`}>{dataField.type}</span>{" "}
          <span className="badge text-bg-secondary">{dataField.dataType}</span>
        </h6>

        <dl className="row mb-0">
          <dt className="col-sm-3">Fachlicher Ersteller</dt>
          <dd className="col-sm-9">{dataField.creator}</dd>

          <dt className="col-sm-3">Bezug</dt>
          <dd className="col-sm-9">
            {multilineToHtml(dataField.relatedTo || "-")}
          </dd>

          <dt className="col-sm-3">Definition</dt>
          <dd className="col-sm-9">
            {multilineToHtml(dataField.definition || "-")}
          </dd>

          <dt className="col-sm-3">Beschreibung</dt>
          <dd className="col-sm-9">
            {multilineToHtml(dataField.description || "-")}
          </dd>
        </dl>
      </div>
      {renderData(dataField)}
    </div>
  );
}

function renderData(dataField: DataField) {
  switch (dataField.type) {
    case "select": {
      if (dataField.codeListReference === undefined) {
        throw new Error();
      }

      return (
        <div className="card-body border-top">
          <dl className="row mb-0">
            <dt className="col-sm-3">Codeliste</dt>
            <dd className="col-sm-9">
              {dataField.codeListReference.identifier}
            </dd>

            <dt className="col-sm-3">Version</dt>
            <dd className="col-sm-9">{dataField.codeListReference.version}</dd>

            <dt className="col-sm-3">Canonical URI</dt>
            <dd className="col-sm-9">
              {dataField.codeListReference.canonicalUri}
            </dd>

            <dt className="col-sm-3">Canonical Version URI</dt>
            <dd className="col-sm-9">
              {dataField.codeListReference.canonicalVersionUri}
            </dd>
          </dl>
        </div>
      );
    }
    case "input": {
      return (
        <div className="card-body border-top">
          <dl className="row mb-0">
            <dt className="col-sm-3">Minimale länge</dt>
            <dd className="col-sm-9">
              {dataField.inputConstraints?.minLength || "-"}
            </dd>

            <dt className="col-sm-3">Maximale Länge</dt>
            <dd className="col-sm-9">
              {dataField.inputConstraints?.maxLength || "-"}
            </dd>

            <dt className="col-sm-3">Minimaler Wert</dt>
            <dd className="col-sm-9">
              {dataField.inputConstraints?.minValue || "-"}
            </dd>

            <dt className="col-sm-3">Maximaler Wert</dt>
            <dd className="col-sm-9">
              {dataField.inputConstraints?.maxValue || "-"}
            </dd>

            <dt className="col-sm-3">Pattern</dt>
            <dd className="col-sm-9">
              {dataField.inputConstraints?.pattern || "-"}
            </dd>
          </dl>
        </div>
      );
    }
    default: {
      return undefined;
    }
  }
}
