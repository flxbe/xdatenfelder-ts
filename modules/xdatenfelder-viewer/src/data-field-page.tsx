import * as React from "react";
import { useParams } from "react-router-dom";
import { Schema, DataField } from "xdatenfelder-xml";
import { DataFieldType } from "./data-field-type";
import { NotFoundPage } from "./not-found-page";
import { multilineToHtml } from "./util";

export interface DataFieldPageProps {
  schema: Schema;
}

export function DataFieldPage({ schema }: DataFieldPageProps) {
  let { identifier } = useParams();
  if (identifier === undefined) {
    throw new Error("identifier is undefined");
  }

  const dataField = schema.dataFields[identifier];
  if (dataField === undefined) {
    return <NotFoundPage />;
  }

  return (
    <div className="container-xxl">
      <div className="row">
        <div className="col-12 col-md-9">
          <h3>
            {dataField.name}{" "}
            <small className="text-muted">v{dataField.version}</small>
          </h3>
          <h6>
            <span className="badge rounded-pill text-bg-secondary">
              {dataField.identifier}
            </span>{" "}
            <DataFieldType type={dataField.input.type} />
          </h6>
        </div>
        <div className="col-12 col-md-3 text-end">
          <button className="btn btn-sm btn-success" disabled>
            Bearbeiten
          </button>
        </div>
      </div>
      <hr />

      <dl className="row">
        <dt className="col-sm-3">Versionshinweis</dt>
        <dd className="col-sm-9">{dataField.versionInfo ?? "-"}</dd>

        <dt className="col-sm-3">Fachlicher Ersteller</dt>
        <dd className="col-sm-9">{dataField.creator}</dd>

        <dt className="col-sm-3">Bezug</dt>
        <dd className="col-sm-9">
          {multilineToHtml(dataField.relatedTo ?? "-")}
        </dd>

        <dt className="col-sm-3">Definition</dt>
        <dd className="col-sm-9">
          {multilineToHtml(dataField.definition ?? "-")}
        </dd>

        <dt className="col-sm-3">Beschreibung</dt>
        <dd className="col-sm-9">
          {multilineToHtml(dataField.description ?? "-")}
        </dd>

        <dt className="col-sm-3">Bezeichnung Eingabe</dt>
        <dd className="col-sm-9">{dataField.inputLabel}</dd>
        <dt className="col-sm-3">Hilfetext Eingabe</dt>
        <dd className="col-sm-9">{dataField.inputHint ?? "-"}</dd>

        <dt className="col-sm-3">Bezeichnung Ausgabe</dt>
        <dd className="col-sm-9">{dataField.outputLabel ?? "-"}</dd>
        <dt className="col-sm-3">Bezeichnung Ausgabe</dt>
        <dd className="col-sm-9">{dataField.outputHint ?? "-"}</dd>

        <dt className="col-sm-3">Regeln</dt>
        <dd className="col-sm-9">{dataField.rules.join(", ") || "-"}</dd>

        {renderData(dataField)}
      </dl>
    </div>
  );
}

function renderData(dataField: DataField) {
  switch (dataField.input.type) {
    case "select": {
      const { codeListReference } = dataField.input;

      return (
        <>
          <dt className="col-sm-3">Codeliste</dt>
          <dd className="col-sm-9">{codeListReference.identifier}</dd>

          <dt className="col-sm-3">Version</dt>
          <dd className="col-sm-9">{codeListReference.version}</dd>

          <dt className="col-sm-3">Canonical URI</dt>
          <dd className="col-sm-9">{codeListReference.canonicalUri}</dd>

          <dt className="col-sm-3">Canonical Version URI</dt>
          <dd className="col-sm-9">{codeListReference.canonicalVersionUri}</dd>

          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">{dataField.input.content ?? "-"}</dd>
        </>
      );
    }

    case "text":
    case "number":
    case "integer":
    case "currency": {
      return (
        <>
          <dt className="col-sm-3">Präzisierung</dt>
          <dd className="col-sm-9">{dataField.input.constraints ?? "-"}</dd>

          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">{dataField.input.content ?? "-"}</dd>
        </>
      );
    }

    case "label": {
      return (
        <>
          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">
            {multilineToHtml(dataField.input.content)}
          </dd>
        </>
      );
    }

    default: {
      return undefined;
    }
  }
}
