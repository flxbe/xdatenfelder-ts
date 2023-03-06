# xdatenfelder-ts

A collection of TypeScript modules to work with the german eGov standard [XDatenfelder](https://www.xrepository.de/details/urn:xoev-de:fim:standard:xdatenfelder).

## Modules

- `xdatenfelder-xml`: Parser for XDatenfelder v2.0 and v3.0.0.
- `xdatenfelder-viewer`: A web application to load and inspect xDatenfelder files locally ([Hosted via Github Pages](https://flxbe.github.io/xdatenfelder-ts/)).
- `xdatenfelder-cg`: Code generation tool that emits TypeScript for a given xDatenfelder file.
- `xdatenfelder-react`: Experimental react bindings for the code generated via `xdatenfelder-cg`.
- `xdatenfelder`: The code generated by `xdatenfelder-cg` from the files in [harmonisierte Baukastenelemente Version 2.1](https://fimportal.de/fim-haus)

## Getting Started (`xdatenfelder`)

### Validate User Input

```js
import { Familienstand } from "xdatenfelder";

const input = "x";

// throws for invalid input
const familienstand = Familienstand.fromString(input);

// or alternatively:
Familienstand.isValid(input);
```

### List All Available Variants

```js
import { Familienstand } from "./src";

for (const entry of Object.entries(Familienstand.Variants)) {
  const [value, label] = entry;
  console.log(value, label);
}
```

Output:

```bash
EA Ehe aufgehoben
GS geschieden
LA aufgehobene Lebenspartnerschaft
LD ledig
LE durch Todeserklärung aufgelöste Lebenspartnerschaft
LP in eingetragener Lebenspartnerschaft
LV durch Tod aufgelöste Lebenspartnerschaft
NB nicht bekannt
VH verheiratet
VW verwitwet
```

## Example: React Select

See `./modules/xdatenfelder-react` for the source code of the `Select` component.

```ts
import * as React from "react";

import { Augenfarbe, Familienstand } from "xdatenfelder";
import { Select } from "xdatenfelder-react";

export function Example() {
  const [familienstand, setFamilienstand] = React.useState<Familienstand>(
    new Familienstand("LD")
  );

  const [augenfarbe, setAugenfarbe] = React.useState<Augenfarbe>(
    new Augenfarbe("22")
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
    </div>
  );
}
```
