import * as React from "react";
import { createRoot } from "react-dom/client";
import { Augenfarbe, Familienstand, Geschlecht } from "xdatenfelder";
import { Select } from "./src";

function Application() {
  const [familienstand, setFamilienstand] = React.useState<Familienstand>(
    new Familienstand("LD")
  );

  const [augenfarbe, setAugenfarbe] = React.useState<Augenfarbe>(
    new Augenfarbe("22")
  );

  const [geschlecht, setGeschlecht] = React.useState<Geschlecht>(
    new Geschlecht("x")
  );

  return (
    <div>
      <Select
        Type={Familienstand}
        value={familienstand}
        onChange={setFamilienstand}
      />
      <br />
      <Select Type={Augenfarbe} value={augenfarbe} onChange={setAugenfarbe} />
      <br />
      <Select Type={Geschlecht} value={geschlecht} onChange={setGeschlecht} />
    </div>
  );
}

const element = document.getElementById("root");
if (element === null) {
  throw Error("Cannot find #root element");
}

const root = createRoot(element);
root.render(<Application />);
