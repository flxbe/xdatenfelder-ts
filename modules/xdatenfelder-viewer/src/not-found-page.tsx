import * as React from "react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="container-xxl text-center">
      <h3>Die Seite konnte nicht gefunden werden.</h3>
      <Link className="btn btn-sm btn-primary" to="/">
        Zur Startseite
      </Link>
    </div>
  );
}
