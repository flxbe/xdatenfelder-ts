import sax from "sax";
import { assert, parseDate, Value } from "../util";
import {
  ParserError,
  UnexpectedTagError,
  UnknownNamespaceError,
  MissingContentError,
  MissingValueError,
  InternalParserError,
} from "../errors";
import {
  Datenfeld,
  Datenfeldgruppe,
  ElementReference,
  SchemaContainer,
  Stammdatenschema,
  Feldart,
  Datentyp,
  Regel,
  SchemaElementArt,
  BaseData,
  ElementData,
  ElementStatus,
  parseElementStatus,
  parseSchemaElementArt,
  CodelisteReferenz,
  AbleitungsmodifikationenRepraesentation,
  AbleitungsmodifikationenStruktur,
  parseDatentyp,
  parseFeldart,
  parseAbleitungsmodifikationenRepraesentation,
  parseAbleitungsmodifikationenStruktur,
  GenericodeIdentification,
} from "./schema";
import { Table } from "../table";

export interface ParseResult {
  messageId: string;
  createdAt: Date;
  schemaContainer: SchemaContainer;
}

interface Context {
  datenfeldgruppen: Table<Datenfeldgruppe>;
  datenfelder: Table<Datenfeld>;
  regeln: Table<Regel>;
}

interface NoOpState {
  type: "noOp";
  parent: State<unknown>;
}

function createNoOpState(parent: State<unknown>): NoOpState {
  return { type: "noOp", parent };
}

interface ValueNodeState<T> {
  type: "value";
  parent: State<unknown>;
  value: Value<T>;
  parse: (raw: string) => T;
}

function createValueNodeState<T>(
  parent: State<unknown>,
  value: Value<T>,
  parse: (raw: string) => T
): ValueNodeState<T> {
  return {
    type: "value",
    parent,
    value,
    parse,
  };
}

interface OptionalValueNodeState<T> {
  type: "opt_value";
  parent: State<unknown>;
  value: Value<T>;
  parse: (raw: string) => T;
}

function createOptionalValueNodeState<T>(
  parent: State<unknown>,
  value: Value<T>,
  parse: (raw: string) => T
): OptionalValueNodeState<T> {
  return {
    type: "opt_value",
    parent,
    value,
    parse,
  };
}

interface CodeNodeState<T> {
  type: "code";
  parent: State<unknown>;
  value: Value<T>;
  parse: (raw: string) => T;
}

function createCodeNodeState<T>(
  parent: State<unknown>,
  value: Value<T>,
  parse: (raw: string) => T
): CodeNodeState<T> {
  return {
    type: "code",
    parent,
    value,
    parse,
  };
}

interface StringNodeState {
  type: "string";
  parent: State<unknown>;
  value: Value<string>;
}

function createStringNodeState(
  parent: State<unknown>,
  value: Value<string>
): StringNodeState {
  return {
    type: "string",
    parent,
    value,
  };
}

interface OptionalStringNodeState {
  type: "opt_string";
  parent: State<unknown>;
  value: Value<string>;
}

function createOptionalStringNodeState(
  parent: State<unknown>,
  value: Value<string>
): OptionalStringNodeState {
  return {
    type: "opt_string",
    parent,
    value,
  };
}

interface RootState {
  type: "root";
  value: Value<[string, Date, Stammdatenschema]>;
}

function createRootState(): RootState {
  return {
    type: "root",
    value: new Value(),
  };
}

interface MessageState {
  type: "message";
  parent: RootState;
  header: Value<[string, Date]>;
  schema: Value<Stammdatenschema>;
}

function createMessageState(parent: RootState): MessageState {
  return {
    type: "message",
    parent,
    header: new Value(),
    schema: new Value(),
  };
}

interface HeaderState {
  type: "header";
  parent: MessageState;
  messageId: Value<string>;
  createdAt: Value<Date>;
}

function createHeaderState(parent: MessageState): HeaderState {
  return {
    type: "header",
    parent,
    messageId: new Value(),
    createdAt: new Value(),
  };
}

interface SchemaState {
  type: "schema";
  parent: MessageState;
  dataContainer: BaseContainer;
  hilfetext: Value<string>;
  ableitungsmodifikationenStruktur: Value<AbleitungsmodifikationenStruktur>;
  ableitungsmodifikationenRepraesentation: Value<AbleitungsmodifikationenRepraesentation>;
  regeln: string[];
  elemente: ElementReference[];
}

function createSchemaState(parent: MessageState): SchemaState {
  return {
    type: "schema",
    parent,
    dataContainer: createBaseContainer(),
    hilfetext: new Value(),
    ableitungsmodifikationenStruktur: new Value(),
    ableitungsmodifikationenRepraesentation: new Value(),
    regeln: [],
    elemente: [],
  };
}

interface IdentificationState {
  type: "identification";
  parent: State<unknown>;
  parentValue: Value<[string, string?]>;
  id: Value<string>;
  version: Value<string>;
}

function createIdentificationState(
  parent: State<unknown>,
  value: Value<[string, string?]>
): IdentificationState {
  return {
    type: "identification",
    parent,
    parentValue: value,
    id: new Value(),
    version: new Value(),
  };
}

type Element =
  | { type: "dataGroup"; dataGroup: Datenfeldgruppe }
  | { type: "dataField"; dataField: Datenfeld };

interface StructState {
  type: "struct";
  parent: SchemaState | DataGroupState;
  anzahl: Value<string>;
  bezug: Value<string>;
  element: Value<Element>;
}

function createStructState(parent: SchemaState | DataGroupState): StructState {
  return {
    type: "struct",
    parent,
    anzahl: new Value(),
    bezug: new Value(),
    element: new Value(),
  };
}

interface ContainsState {
  type: "contains";
  parent: StructState;
}

interface DataGroupState {
  type: "dataGroup";
  parent: ContainsState;
  dataContainer: ElementContainer;
  elemente: ElementReference[];
  regeln: string[];
}

function createDataGroupState(parent: ContainsState): DataGroupState {
  return {
    type: "dataGroup",
    parent,
    dataContainer: createElementContainer(),
    elemente: [],
    regeln: [],
  };
}

interface DataFieldState {
  type: "dataField";
  parent: ContainsState;
  dataContainer: ElementContainer;
  feldart: Value<Feldart>;
  datentyp: Value<Datentyp>;
  praezisierung: Value<string>;
  inhalt: Value<string>;
  codelisteReferenz: Value<CodelisteReferenz>;
  regeln: string[];
}

function createDataFieldState(parent: ContainsState): DataFieldState {
  return {
    type: "dataField",
    parent,
    dataContainer: createElementContainer(),
    feldart: new Value(),
    datentyp: new Value(),
    praezisierung: new Value(),
    inhalt: new Value(),
    codelisteReferenz: new Value(),
    regeln: [],
  };
}

interface RuleState {
  type: "rule";
  parent: State<unknown>;
  regeln: string[];
  dataContainer: BaseContainer;
  script: Value<string>;
}

function createRuleState(parent: State<unknown>, regeln: string[]): RuleState {
  return {
    type: "rule",
    parent,
    regeln,
    dataContainer: createBaseContainer(),
    script: new Value(),
  };
}

interface CodeListState {
  type: "codeList";
  parent: DataFieldState;
  identification: Value<[string, string?]>;
  genericode: Value<GenericodeIdentification>;
}

function createCodeListState(parent: DataFieldState): CodeListState {
  return {
    type: "codeList",
    parent,
    identification: new Value(),
    genericode: new Value(),
  };
}

interface GenericodeState {
  type: "genericode";
  parent: CodeListState;
  canonicalIdentification: Value<string>;
  version: Value<string>;
  canonicalVersionUri: Value<string>;
}

function createGenericodeState(parent: CodeListState): GenericodeState {
  return {
    type: "genericode",
    parent,
    canonicalIdentification: new Value(),
    version: new Value(),
    canonicalVersionUri: new Value(),
  };
}

type State<T> =
  | RootState
  | MessageState
  | HeaderState
  | SchemaState
  | NoOpState
  | OptionalStringNodeState
  | StringNodeState
  | IdentificationState
  | StructState
  | ContainsState
  | DataGroupState
  | DataFieldState
  | RuleState
  | CodeListState
  | GenericodeState
  | ValueNodeState<T>
  | OptionalValueNodeState<T>
  | CodeNodeState<T>;

function handleText(state: State<unknown>, text: string) {
  switch (state.type) {
    case "string":
    case "opt_string":
      state.value.set(text);
      break;

    case "value":
    case "opt_value":
      state.value.set(state.parse(text));
      break;

    case "noOp":
      break;

    default:
      throw new InternalParserError(`Got unexpected text block: ${text}`);
  }
}

function handleOpenTag(
  state: State<unknown>,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (state.type) {
    case "root": {
      switch (tag.name) {
        case "xdf:xdatenfelder.stammdatenschema.0102":
          return createMessageState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "message": {
      switch (tag.name) {
        case "xdf:header":
          return createHeaderState(state);
        case "xdf:stammdatenschema":
          return createSchemaState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "header": {
      switch (tag.name) {
        case "xdf:nachrichtID":
          return createStringNodeState(state, state.messageId);
        case "xdf:erstellungszeitpunkt":
          return createValueNodeState(state, state.createdAt, parseDate);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "schema": {
      switch (tag.local) {
        case "hilfetext":
          return createOptionalStringNodeState(state, state.hilfetext);
        case "ableitungsmodifikationenStruktur":
          return createCodeNodeState(
            state,
            state.ableitungsmodifikationenStruktur,
            parseAbleitungsmodifikationenStruktur
          );
        case "ableitungsmodifikationenRepraesentation":
          return createCodeNodeState(
            state,
            state.ableitungsmodifikationenRepraesentation,
            parseAbleitungsmodifikationenRepraesentation
          );
        case "regel":
          return createRuleState(state, state.regeln);
        case "struktur":
          return createStructState(state);
        default:
          return handleBaseData(state, tag);
      }
    }

    case "struct": {
      switch (tag.name) {
        case "xdf:anzahl":
          return createStringNodeState(state, state.anzahl);
        case "xdf:bezug":
          return createOptionalStringNodeState(state, state.bezug);
        case "xdf:enthaelt":
          return { type: "contains", parent: state };
        default:
          throw new UnexpectedTagError();
      }
    }

    case "contains": {
      switch (tag.name) {
        case "xdf:datenfeld":
          return createDataFieldState(state);
        case "xdf:datenfeldgruppe":
          return createDataGroupState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "dataGroup": {
      switch (tag.local) {
        case "struktur":
          return createStructState(state);
        case "regel":
          return createRuleState(state, state.regeln);
        default:
          return handleElementData(state, tag);
      }
    }

    case "dataField": {
      switch (tag.local) {
        case "feldart":
          return createCodeNodeState(state, state.feldart, parseFeldart);
        case "datentyp":
          return createCodeNodeState(state, state.datentyp, parseDatentyp);
        case "praezisierung":
          return createOptionalStringNodeState(state, state.praezisierung);
        case "inhalt":
          return createOptionalStringNodeState(state, state.inhalt);
        case "codelisteReferenz":
          return createCodeListState(state);
        case "regel":
          return createRuleState(state, state.regeln);
        default:
          return handleElementData(state, tag);
      }
    }

    case "rule": {
      switch (tag.local) {
        case "script":
          return createOptionalStringNodeState(state, state.script);
        default:
          return handleBaseData(state, tag);
      }
    }

    case "codeList": {
      switch (tag.local) {
        case "identifikation":
          return createIdentificationState(state, state.identification);
        case "genericodeIdentification":
          return createGenericodeState(state);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "identification": {
      switch (tag.local) {
        case "id":
          return createStringNodeState(state, state.id);
        case "version":
          return createOptionalStringNodeState(state, state.version);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "genericode": {
      switch (tag.local) {
        case "canonicalIdentification":
          return createStringNodeState(state, state.canonicalIdentification);
        case "version":
          return createStringNodeState(state, state.version);
        case "canonicalVersionUri":
          return createStringNodeState(state, state.canonicalVersionUri);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "code": {
      switch (tag.local) {
        case "code":
          return createValueNodeState(state, state.value, state.parse);
        default:
          throw new UnexpectedTagError();
      }
    }

    case "string":
      throw new UnexpectedTagError();

    case "noOp":
      return createNoOpState(state);

    default:
      throw new Error(`Unknown state: ${state.type}`);
  }
}

function handleCloseTag(
  state: State<unknown>,
  context: Context
): State<unknown> {
  switch (state.type) {
    case "root":
      throw new UnexpectedTagError();

    case "message": {
      const [messageId, createdAt] = state.header.expect("Missing <header>");
      const schema = state.schema.expect("Missing <stammdatenschema>");

      state.parent.value.set([messageId, createdAt, schema]);
      return state.parent;
    }

    case "header": {
      const messageId = state.messageId.expect("Missing <nachrichtID>");
      const createdAt = state.createdAt.expect(
        "Missing <erstellungszeitpunkt>"
      );

      state.parent.header.set([messageId, createdAt]);
      return state.parent;
    }

    case "schema": {
      const baseData = parseBaseData(state.dataContainer);

      const schema = {
        ...baseData,
        hilfetext: state.hilfetext.get(),
        ableitungsmodifikationenStruktur:
          state.ableitungsmodifikationenStruktur.expect(
            "Missing <ableitungsmodifikationenStruktur>"
          ),
        ableitungsmodifikationenRepraesentation:
          state.ableitungsmodifikationenRepraesentation.expect(
            "Missing <ableitungsmodifikationenRepraesentation>"
          ),
        regeln: state.regeln,
        elemente: state.elemente,
      };

      state.parent.schema.set(schema);
      return state.parent;
    }

    case "struct": {
      const anzahl = state.anzahl.expect("Missing <anzahl>");
      const bezug = state.bezug.get();
      const element = state.element.expect("Missing <enthaelt>");

      if (element.type === "dataGroup") {
        state.parent.elemente.push({
          type: "dataGroup",
          identifier: element.dataGroup.identifier,
          anzahl,
          bezug,
        });
      } else {
        state.parent.elemente.push({
          type: "dataField",
          identifier: element.dataField.identifier,
          anzahl,
          bezug,
        });
      }

      return state.parent;
    }

    case "contains": {
      if (state.parent.element.isEmpty()) {
        throw new MissingValueError("Missing <datenfeld> or <datenfeldgruppe>");
      }

      return state.parent;
    }

    case "dataGroup": {
      const elementData = parseElementData(state.dataContainer);

      const dataGroup: Datenfeldgruppe = {
        ...elementData,
        regeln: state.regeln,
        elemente: state.elemente,
      };

      context.datenfeldgruppen.insert(dataGroup);
      state.parent.parent.element.set({ type: "dataGroup", dataGroup });

      return state.parent;
    }

    case "dataField": {
      const elementData = parseElementData(state.dataContainer);

      const dataField: Datenfeld = {
        ...elementData,
        feldart: state.feldart.expect("Missing <feldart>"),
        datentyp: state.datentyp.expect("Missing <datentyp>"),
        praezisierung: state.praezisierung.get(),
        inhalt: state.inhalt.get(),
        codelisteReferenz: state.codelisteReferenz.get(),
        regeln: state.regeln,
      };

      context.datenfelder.insert(dataField);
      state.parent.parent.element.set({ type: "dataField", dataField });

      return state.parent;
    }

    case "rule": {
      const baseData = parseBaseData(state.dataContainer);

      const rule: Regel = {
        ...baseData,
        script: state.script.get(),
      };

      context.regeln.insert(rule);
      state.regeln.push(rule.identifier);

      return state.parent;
    }

    case "codeList": {
      const [id, version] = state.identification.expect(
        "Missing <identifikation>"
      );
      const genericode = state.genericode.expect(
        "Missing <genericodeIdentification"
      );

      state.parent.codelisteReferenz.set({ id, version, genericode });
      return state.parent;
    }

    case "identification": {
      const id = state.id.expect("Missing <id>");
      const version = state.version.get();

      state.parentValue.set([id, version]);
      return state.parent;
    }

    case "genericode": {
      const canonicalIdentification = state.canonicalIdentification.expect(
        "Missing <canonicalIdentification>"
      );
      const version = state.version.expect("Missing <version>");
      const canonicalVersionUri = state.canonicalVersionUri.expect(
        "Missing <canonicalVersionUri>"
      );

      state.parent.genericode.set({
        canonicalIdentification,
        version,
        canonicalVersionUri,
      });
      return state.parent;
    }

    case "string": {
      if (state.value.isEmpty()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "value": {
      if (state.value.isEmpty()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "code": {
      if (state.value.isEmpty()) {
        throw new MissingValueError("Missing <code>");
      }
      return state.parent;
    }

    case "opt_string":
    case "opt_value":
      if (state.value.isEmpty()) {
        state.value.set(undefined);
      }
      return state.parent;

    case "noOp":
      return state.parent;

    default:
      throw new Error("Unknown state");
  }
}

export class SchemaConverter {
  private xmlParser: sax.SAXParser;
  private state: State<unknown> = createRootState();
  private context: Context = {
    datenfeldgruppen: new Table(),
    datenfelder: new Table(),
    regeln: new Table(),
  };

  constructor() {
    this.xmlParser = sax.parser(true, {
      trim: true,
      xmlns: true,
    });

    this.xmlParser.onerror = (error) => {
      throw error;
    };

    this.xmlParser.ontext = (text) => {
      handleText(this.state, text);
    };

    this.xmlParser.onopennamespace = (ns) => {
      if (ns.prefix === "xdf") {
        if (ns.uri !== "urn:xoev-de:fim:standard:xdatenfelder_2") {
          throw new UnknownNamespaceError(ns.prefix, ns.uri);
        }
      }
    };

    this.xmlParser.onopentag = (tag) => {
      assert("ns" in tag);
      this.state = handleOpenTag(this.state, tag);
    };

    this.xmlParser.onclosetag = () => {
      this.state = handleCloseTag(this.state, this.context);
    };
  }

  public write(data: string) {
    try {
      this.xmlParser.write(data);
    } catch (error: unknown) {
      if (error instanceof InternalParserError) {
        throw ParserError.fromInternalError(error, this.xmlParser);
      } else {
        throw error;
      }
    }
  }

  public finish(): ParseResult {
    this.xmlParser.close();

    if (this.state.type !== "root") {
      throw new InternalParserError("Unexpected EOF");
    }

    const [messageId, createdAt, schema] = this.state.value.expect(
      "Missing <urn:xoev-de:fim:standard:xdatenfelder_2>"
    );

    const container: SchemaContainer = {
      schema,
      ...this.context,
    };

    return {
      messageId,
      createdAt,
      schemaContainer: container,
    };
  }
}

interface BaseContainer {
  identification: Value<[string, string]>;
  name: Value<string>;
  bezeichnungEingabe: Value<string>;
  bezeichnungAusgabe: Value<string>;
  beschreibung: Value<string>;
  definition: Value<string>;
  bezug: Value<string>;
  status: Value<ElementStatus>;
  gueltigAb: Value<Date>;
  gueltigBis: Value<Date>;
  fachlicherErsteller: Value<string>;
  versionshinweis: Value<string>;
  freigabedatum: Value<Date>;
  veroeffentlichungsdatum: Value<Date>;
}

function createBaseContainer(): BaseContainer {
  return {
    identification: new Value(),
    name: new Value(),
    bezeichnungEingabe: new Value(),
    bezeichnungAusgabe: new Value(),
    beschreibung: new Value(),
    definition: new Value(),
    bezug: new Value(),
    status: new Value(),
    gueltigAb: new Value(),
    gueltigBis: new Value(),
    fachlicherErsteller: new Value(),
    versionshinweis: new Value(),
    freigabedatum: new Value(),
    veroeffentlichungsdatum: new Value(),
  };
}

function parseBaseData(container: BaseContainer): BaseData {
  const [id, version] = container.identification.expect(
    "Missing <identifikation>"
  );
  const name = container.name.expect("Missing <name>");

  return {
    identifier: `${id}:${version}`,
    id,
    version,
    name,
    bezeichnungEingabe: container.bezeichnungEingabe.get() ?? name,
    bezeichnungAusgabe: container.bezeichnungAusgabe.get(),
    beschreibung: container.beschreibung.get(),
    definition: container.definition.get(),
    status: container.status.expect("Missing <status>"),
    bezug: container.bezug.get(),
    gueltigAb: container.gueltigAb.get(),
    gueltigBis: container.gueltigBis.get(),
    fachlicherErsteller: container.fachlicherErsteller.get(),
    versionshinweis: container.versionshinweis.get(),
    freigabedatum: container.freigabedatum.get(),
    veroeffentlichungsdatum: container.veroeffentlichungsdatum.get(),
  };
}

function handleBaseData(
  state: SchemaState | DataGroupState | DataFieldState | RuleState,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (tag.local) {
    case "identifikation":
      return createIdentificationState(
        state,
        state.dataContainer.identification
      );
    case "name":
      return createStringNodeState(state, state.dataContainer.name);
    case "bezeichnungEingabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.bezeichnungEingabe
      );
    case "bezeichnungAusgabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.bezeichnungAusgabe
      );
    case "beschreibung":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.beschreibung
      );
    case "definition":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.definition
      );
    case "bezug":
      return createOptionalStringNodeState(state, state.dataContainer.bezug);
    case "status":
      return createCodeNodeState(
        state,
        state.dataContainer.status,
        parseElementStatus
      );
    case "gueltigAb":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.gueltigAb,
        parseDate
      );
    case "gueltigBis":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.gueltigBis,
        parseDate
      );
    case "fachlicherErsteller":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.fachlicherErsteller
      );
    case "versionshinweis":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.versionshinweis
      );
    case "freigabedatum":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.freigabedatum,
        parseDate
      );
    case "veroeffentlichungsdatum":
      return createOptionalValueNodeState(
        state,
        state.dataContainer.veroeffentlichungsdatum,
        parseDate
      );
    default:
      throw new UnexpectedTagError();
  }
}

interface ElementContainer extends BaseContainer {
  schemaelementart: Value<SchemaElementArt>;
  hilfetextEingabe: Value<string>;
  hilfetextAusgabe: Value<string>;
}

function createElementContainer(): ElementContainer {
  return {
    ...createBaseContainer(),
    schemaelementart: new Value(),
    hilfetextEingabe: new Value(),
    hilfetextAusgabe: new Value(),
  };
}

function parseElementData(container: ElementContainer): ElementData {
  const baseData = parseBaseData(container);

  return {
    ...baseData,
    schemaelementart: container.schemaelementart.expect(
      "Missing <schemaelementart>"
    ),
    hilfetextEingabe: container.hilfetextEingabe.get(),
    hilfetextAusgabe: container.hilfetextAusgabe.get(),
  };
}

function handleElementData(
  state: DataGroupState | DataFieldState,
  tag: sax.QualifiedTag
): State<unknown> {
  switch (tag.local) {
    case "schemaelementart":
      return createCodeNodeState(
        state,
        state.dataContainer.schemaelementart,
        parseSchemaElementArt
      );
    case "hilfetextEingabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.hilfetextEingabe
      );
    case "hilfetextAusgabe":
      return createOptionalStringNodeState(
        state,
        state.dataContainer.hilfetextAusgabe
      );
    default:
      return handleBaseData(state, tag);
  }
}
