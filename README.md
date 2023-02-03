# xdatenfelder-ts

An experimental and type-safe implementation of the data-fields defined in [xDatenfelder](https://www.xrepository.de/details/urn:xoev-de:fim:standard:xdatenfelder).

## Getting Started

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
