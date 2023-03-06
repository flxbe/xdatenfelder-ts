import sax from "sax";
import { Table, DataField, DataGroup, Rule } from "./schema";
import {
  DuplicateTagError,
  MissingChildNodeError,
  MissingContentError,
  InternalParserError,
  UnexpectedTagError,
  ParserError,
  UnknownNamespaceError,
  MissingValueError,
} from "./errors";
import { assert } from "./util";

export interface Context {
  dataGroups: Table<DataGroup>;
  dataFields: Table<DataField>;
  rules: Table<Rule>;
}

export class Value<T> {
  private content:
    | { filled: false; value: undefined }
    | { filled: true; value: T };

  constructor() {
    this.content = { filled: false, value: undefined };
  }

  public set(value: T) {
    if (this.content.filled) {
      throw new DuplicateTagError();
    }

    this.content = { filled: true, value };
  }

  public get(): T | undefined {
    return this.content.value;
  }

  public isFilled(): boolean {
    return this.content.filled;
  }

  public expect(errorMessage: string): T {
    if (!this.content.filled) {
      throw new MissingValueError(errorMessage);
    }

    return this.content.value;
  }
}

export type FinishFn<T> = (value: T) => void;

export abstract class State {
  public onText(text: string): void {
    throw new InternalParserError(`Got unexpected text block: ${text}`);
  }

  public abstract onOpenTag(tag: sax.QualifiedTag): State;

  public abstract onCloseTag(context: Context): State;
}

export class ValueNodeState<T> extends State {
  private parent: State;
  private value: Value<T>;
  private parseValue: (value: string) => T;

  constructor(
    parent: State,
    value: Value<T>,
    parseValue: (value: string) => T
  ) {
    super();

    this.parent = parent;
    this.value = value;
    this.parseValue = parseValue;
  }

  public onText(text: string) {
    const value = this.parseValue(text);
    this.value.set(value);
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError();
  }

  public onCloseTag(_context: Context): State {
    if (!this.value.isFilled()) {
      throw new MissingContentError();
    }

    return this.parent;
  }
}

export class OptionalValueNodeState<T> extends State {
  private parent: State;
  private value: Value<T | undefined>;
  private parseValue: (value: string) => T;

  constructor(
    parent: State,
    value: Value<T | undefined>,
    parseValue: (value: string) => T
  ) {
    super();

    this.parent = parent;
    this.value = value;
    this.parseValue = parseValue;
  }

  public onText(text: string) {
    const value = this.parseValue(text);
    this.value.set(value);
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    throw new UnexpectedTagError();
  }

  public onCloseTag(_context: Context): State {
    return this.parent;
  }
}

export class StringNodeState extends ValueNodeState<string> {
  constructor(parent: State, value: Value<string>) {
    super(parent, value, (value) => value);
  }
}

export class OptionalStringNodeState extends OptionalValueNodeState<string> {
  constructor(parent: State, value: Value<string | undefined>) {
    super(parent, value, (value) => value);
  }
}

export class CodeNodeState<T> extends State {
  private parent: State;
  private parseValue: (value: string) => T;

  private value: Value<T>;
  private childValue: Value<T> = new Value();

  constructor(
    parent: State,
    value: Value<T>,
    parseValue: (value: string) => T
  ) {
    super();

    this.parent = parent;
    this.value = value;
    this.parseValue = parseValue;
  }

  public onOpenTag(tag: sax.QualifiedTag): State {
    switch (tag.name) {
      case "code":
        return new ValueNodeState(this, this.childValue, this.parseValue);
      default:
        throw new UnexpectedTagError();
    }
  }

  public onCloseTag(_context: Context): State {
    const value = this.childValue.expect("Missing <code> node");
    this.value.set(value);

    return this.parent;
  }
}

export class NoOpState extends State {
  private parent: State;

  constructor(parent: State) {
    super();
    this.parent = parent;
  }

  public onText(_text: string) {}

  public onOpenTag(_tag: sax.QualifiedTag): NoOpState {
    return new NoOpState(this);
  }

  public onCloseTag(_context: Context): State {
    return this.parent;
  }
}

export class StateParser {
  private state: State;
  private namespace: string;
  private context: Context;
  private xmlParser: sax.SAXParser;

  constructor(rootState: State, namespace: string) {
    this.state = rootState;
    this.namespace = namespace;
    this.context = {
      dataGroups: Table.DataGroupTable(),
      dataFields: Table.DataFieldTable(),
      rules: Table.RuleTable(),
    };
    this.xmlParser = sax.parser(true, {
      trim: true,
      xmlns: true,
    });

    this.xmlParser.onerror = (error) => {
      throw error;
    };

    this.xmlParser.ontext = (text) => {
      this.state.onText(text);
    };

    this.xmlParser.onopennamespace = (ns) => {
      if (ns.prefix === "xdf") {
        if (ns.uri !== this.namespace) {
          throw new UnknownNamespaceError(ns.prefix, ns.uri);
        }
      }
    };

    this.xmlParser.onopentag = (tag) => {
      assert("ns" in tag);
      this.state = this.state.onOpenTag(tag);
    };

    this.xmlParser.onclosetag = () => {
      this.state = this.state.onCloseTag(this.context);
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

  public finish(): State {
    this.xmlParser.close();
    return this.state;
  }
}