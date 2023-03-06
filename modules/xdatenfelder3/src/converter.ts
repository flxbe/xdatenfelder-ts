import sax from "sax";
import { assert } from "./util";
import { Value } from "./sax";
import {
  DataField,
  DataGroup,
  Rule,
  Schema,
  FreigabeStatus,
  SchemaContainer,
  parseDate,
} from "./schema";
import {
  ParserError,
  UnexpectedTagError,
  UnknownNamespaceError,
  MissingContentError,
} from "./errors";
import { InternalParserError } from "./errors";
import { BaseContainer, createBaseContainer, parseBaseData } from "./v3-parser";

export interface ParseResult {
  messageId: string;
  createdAt: Date;
  schemaContainer: SchemaContainer;
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
  value: Value<string | undefined>;
}

function createOptionalStringNodeState(
  parent: State<unknown>,
  value: Value<string | undefined>
): OptionalStringNodeState {
  return {
    type: "opt_string",
    parent,
    value,
  };
}

interface RootState {
  type: "root";
  value: Value<[string, Date, Schema]>;
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
  schema: Value<Schema>;
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
  baseContainer: BaseContainer;
  label: Value<string | undefined>;
}

function createSchemaState(parent: MessageState): SchemaState {
  return {
    type: "schema",
    parent,
    baseContainer: createBaseContainer(),
    label: new Value(),
  };
}

interface IdentificationState {
  type: "identification";
  parent: SchemaState;
  id: Value<string>;
  version: Value<string>;
}

function createIdentificationState(parent: SchemaState): IdentificationState {
  return {
    type: "identification",
    parent,
    id: new Value(),
    version: new Value(),
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
  | ValueNodeState<T>;

function handleText(state: State<unknown>, text: string) {
  switch (state.type) {
    case "string":
    case "opt_string":
      state.value.set(text);
      break;

    case "value":
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
      switch (tag.name) {
        case "xdf:identifikation":
          return createIdentificationState(state);
        case "xdf:bezeichnungEingabe":
          return createOptionalStringNodeState(state, state.label);
        case "xdf:name":
          return createStringNodeState(state, state.baseContainer.name);
        case "xdf:beschreibung":
          return createOptionalStringNodeState(
            state,
            state.baseContainer.description
          );
        case "xdf:definition":
          return createOptionalStringNodeState(
            state,
            state.baseContainer.definition
          );
        default:
          return createNoOpState(state);
      }
    }

    case "identification": {
      switch (tag.name) {
        case "xdf:id":
          return createStringNodeState(state, state.id);
        case "xdf:version":
          return createStringNodeState(state, state.version);
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

function handleCloseTag(state: State<unknown>): State<unknown> {
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
      // TODO: find better way to handle this
      state.baseContainer.lastChangedAt.set(new Date(0));
      state.baseContainer.releaseState.set(FreigabeStatus.Inaktiv);

      const baseData = parseBaseData(state.baseContainer);
      const label = state.label.get() ?? baseData.name;

      state.parent.schema.set({
        ...baseData,
        label,
        rules: [],
        children: [],
      });
      return state.parent;
    }

    case "identification": {
      const id = state.id.expect("Missing <id>");
      const version = state.version.expect("Missing <version>");

      state.parent.baseContainer.identification.set([id, version]);
      return state.parent;
    }

    case "opt_string": {
      return state.parent;
    }

    case "string": {
      if (!state.value.isFilled()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "value": {
      if (!state.value.isFilled()) {
        throw new MissingContentError();
      }
      return state.parent;
    }

    case "noOp":
      return state.parent;

    default:
      throw new Error("Unknown state");
  }
}

export class SchemaConverter {
  private xmlParser: sax.SAXParser;
  private state: State<unknown> = createRootState();

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
      this.state = handleCloseTag(this.state);
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

      dataFields: {},
      dataGroups: {},
      rules: {},
    };

    return {
      messageId,
      createdAt,
      schemaContainer: container,
    };
  }
}
