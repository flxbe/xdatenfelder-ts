import * as React from "react";
import { DataField } from "xdatenfelder-xml";
import { multilineToHtml } from "./util";

export type DataFieldCardProps = {
  dataField: DataField;
};

const TYPE_TO_COLOR_CLASS: Record<string, string> = {
  select: "text-bg-success",
  text: "text-bg-primary",
  label: "text-bg-dark",
};

export function DataFieldCard({ dataField }: DataFieldCardProps) {
  const colorClass =
    TYPE_TO_COLOR_CLASS[dataField.input.type] || "text-bg-secondary";

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
          <span className={`badge ${colorClass}`}>{dataField.input.type}</span>{" "}
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
  switch (dataField.input.type) {
    case "select": {
      const { codeListReference } = dataField.input;

      return (
        <div className="card-body border-top">
          <dl className="row mb-0">
            <dt className="col-sm-3">Codeliste</dt>
            <dd className="col-sm-9">{codeListReference.identifier}</dd>

            <dt className="col-sm-3">Version</dt>
            <dd className="col-sm-9">{codeListReference.version}</dd>

            <dt className="col-sm-3">Canonical URI</dt>
            <dd className="col-sm-9">{codeListReference.canonicalUri}</dd>

            <dt className="col-sm-3">Canonical Version URI</dt>
            <dd className="col-sm-9">
              {codeListReference.canonicalVersionUri}
            </dd>
          </dl>
        </div>
      );
    }

    case "text": {
      const { constraints } = dataField.input;

      return (
        <div className="card-body border-top">
          <dl className="row mb-0">
            <dt className="col-sm-3">Minimale Länge</dt>
            <dd className="col-sm-9">{constraints.minLength || "-"}</dd>

            <dt className="col-sm-3">Maximale Länge</dt>
            <dd className="col-sm-9">{constraints.maxLength || "-"}</dd>

            <dt className="col-sm-3">Pattern</dt>
            <dd className="col-sm-9">{constraints.pattern || "-"}</dd>
          </dl>
        </div>
      );
    }

    case "number":
    case "integer":
    case "currency": {
      const { constraints } = dataField.input;

      return (
        <div className="card-body border-top">
          <dl className="row mb-0">
            <dt className="col-sm-3">Minimaler Wert</dt>
            <dd className="col-sm-9">{constraints.minValue || "-"}</dd>

            <dt className="col-sm-3">Maximaler Wert</dt>
            <dd className="col-sm-9">{constraints.maxValue || "-"}</dd>
          </dl>
        </div>
      );
    }

    default: {
      return undefined;
    }
  }
}
