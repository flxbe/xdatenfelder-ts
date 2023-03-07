import * as React from "react";
import { useParams } from "react-router-dom";
import { SchemaContainer, Datenfeld } from "xdatenfelder-xml/src/v2";
import { DataFieldType } from "./data-field-type";
import { NotFoundPage } from "./not-found-page";
import { multilineToHtml } from "./util";

export interface DataFieldPageProps {
  container: SchemaContainer;
}

export function DataFieldPage({ container }: DataFieldPageProps) {
  let { identifier } = useParams();
  if (identifier === undefined) {
    throw new Error("identifier is undefined");
  }

  if (!container.datenfelder.has(identifier)) {
    return <NotFoundPage />;
  }

  const dataField = container.datenfelder.get(identifier);

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
            <DataFieldType type={dataField.feldart} />
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
        <dd className="col-sm-9">{dataField.versionshinweis ?? "-"}</dd>

        <dt className="col-sm-3">Fachlicher Ersteller</dt>
        <dd className="col-sm-9">{dataField.fachlicherErsteller ?? "-"}</dd>

        <dt className="col-sm-3">Bezug</dt>
        <dd className="col-sm-9">{multilineToHtml(dataField.bezug ?? "-")}</dd>

        <dt className="col-sm-3">Definition</dt>
        <dd className="col-sm-9">
          {multilineToHtml(dataField.definition ?? "-")}
        </dd>

        <dt className="col-sm-3">Beschreibung</dt>
        <dd className="col-sm-9">
          {multilineToHtml(dataField.beschreibung ?? "-")}
        </dd>

        <dt className="col-sm-3">Bezeichnung Eingabe</dt>
        <dd className="col-sm-9">{dataField.bezeichnungEingabe}</dd>
        <dt className="col-sm-3">Hilfetext Eingabe</dt>
        <dd className="col-sm-9">{dataField.hilfetextEingabe ?? "-"}</dd>

        <dt className="col-sm-3">Bezeichnung Ausgabe</dt>
        <dd className="col-sm-9">{dataField.bezeichnungAusgabe ?? "-"}</dd>
        <dt className="col-sm-3">Bezeichnung Ausgabe</dt>
        <dd className="col-sm-9">{dataField.hilfetextAusgabe ?? "-"}</dd>

        <dt className="col-sm-3">Regeln</dt>
        <dd className="col-sm-9">{dataField.regeln.join(", ") || "-"}</dd>

        {renderData(dataField)}
      </dl>
    </div>
  );
}

function renderData(dataField: Datenfeld) {
  switch (dataField.feldart) {
    case "select": {
      const { codelisteReferenz } = dataField;

      return (
        <>
          <dt className="col-sm-3">Codeliste</dt>
          <dd className="col-sm-9">{codelisteReferenz?.id}</dd>

          <dt className="col-sm-3">Version</dt>
          <dd className="col-sm-9">{codelisteReferenz?.genericode.version}</dd>

          <dt className="col-sm-3">Canonical URI</dt>
          <dd className="col-sm-9">
            {codelisteReferenz?.genericode.canonicalIdentification}
          </dd>

          <dt className="col-sm-3">Canonical Version URI</dt>
          <dd className="col-sm-9">
            {codelisteReferenz?.genericode.canonicalVersionUri}
          </dd>

          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">{dataField.inhalt ?? "-"}</dd>
        </>
      );
    }

    case "input": {
      return (
        <>
          <dt className="col-sm-3">Datentyp</dt>
          <dd className="col-sm-9">{dataField.datentyp}</dd>

          <dt className="col-sm-3">Präzisierung</dt>
          <dd className="col-sm-9">{dataField.praezisierung ?? "-"}</dd>

          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">{dataField.inhalt ?? "-"}</dd>
        </>
      );
    }

    case "label": {
      return (
        <>
          <dt className="col-sm-3">Inhalt</dt>
          <dd className="col-sm-9">{multilineToHtml(dataField.inhalt)}</dd>
        </>
      );
    }

    default: {
      return undefined;
    }
  }
}
