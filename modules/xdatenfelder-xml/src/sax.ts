import sax from "sax";
import { DataField, DataGroup, Rule } from "./schema-3";

export class ParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParserError";
  }
}

export class UnexpectedTagError extends ParserError {
  constructor(got: string, expected: string | undefined = undefined) {
    if (expected === undefined) {
      super(`Unexpected Tag: ${got}`);
    } else {
      super(`Expected "${expected}", got: ${got}`);
    }

    this.name = "UnexpectedTagError";
  }
}

export class MissingChildNodeError extends ParserError {
  constructor(name: string) {
    super(`Missing child node: ${name}`);
    this.name = "MissingChildNodeError";
  }
}

export class MissingContentError extends ParserError {
  constructor(parentName: string) {
    super(`Missing content in node ${parentName}`);
    this.name = "MissingContentError";
  }
}

export class DuplicateTagError extends ParserError {
  constructor(tagName: string) {
    super(`Duplicate <${tagName}>`);
    this.name = "DuplicateTagError";
  }
}

export interface Context {
  dataGroups: Record<string, DataGroup>;
  dataFields: Record<string, DataField>;
  rules: Record<string, Rule>;
}

export class Value<T> {
  private content:
    | { filled: false; value: undefined }
    | { filled: true; value: T };

  public readonly tagName: string;

  constructor(tagName: string) {
    this.tagName = tagName;
    this.content = { filled: false, value: undefined };
  }

  public set(value: T) {
    if (this.content.filled) {
      throw new DuplicateTagError(this.tagName);
    }

    this.content = { filled: true, value };
  }

  public get(): T | undefined {
    return this.content.value;
  }

  public unwrap(): T {
    if (!this.content.filled) {
      throw new MissingChildNodeError(this.tagName);
    }

    return this.content.value;
  }
}

export type FinishFn<T> = (value: T) => void;

export function expectTag(got: string, expected: string) {
  if (got !== expected) {
    throw new ParserError(`Expect "${expected}", got: ${got}`);
  }
}

export abstract class State {
  public onText(text: string): void {
    throw new ParserError(`Got unexpected text block: ${text}`);
  }

  public abstract onOpenTag(
    tag: sax.QualifiedTag | sax.Tag,
    context: Context
  ): State;

  public abstract onCloseTag(tagName: string, context: Context): State;
}

export class ValueNodeState extends State {
  private parent: State;
  private value: Value<string>;

  constructor(parent: State, value: Value<string>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onText(text: string) {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, _context: Context): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string, _context: Context): State {
    expectTag(tagName, this.value.tagName);

    return this.parent;
  }
}

export class OptionalValueNodeState extends State {
  private parent: State;
  private value: Value<string | undefined>;

  constructor(parent: State, value: Value<string | undefined>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onText(text: string) {
    this.value.set(text);
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, _context: Context): State {
    throw new UnexpectedTagError(tag.name, "<None>");
  }

  public onCloseTag(tagName: string, _context: Context): State {
    expectTag(tagName, this.value.tagName);

    return this.parent;
  }
}

export class CodeNodeState extends State {
  private parent: State;

  private value: Value<string>;
  private childValue: Value<string> = new Value("code");

  constructor(parent: State, value: Value<string>) {
    super();

    this.parent = parent;
    this.value = value;
  }

  public onOpenTag(tag: sax.QualifiedTag | sax.Tag, _context: Context): State {
    expectTag(tag.name, "code");

    return new ValueNodeState(this, this.childValue);
  }

  public onCloseTag(tagName: string, _context: Context): State {
    expectTag(tagName, this.value.tagName);

    const value = this.childValue.unwrap();
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

  public onText(text: string) {}

  public onOpenTag(
    _tag: sax.QualifiedTag | sax.Tag,
    _context: Context
  ): NoOpState {
    return new NoOpState(this);
  }

  public onCloseTag(_tagName: string, _context: Context): State {
    return this.parent;
  }
}

export class StateParser {
  private state: State;
  private context: Context;
  private xmlParser: sax.SAXParser;

  constructor(rootState: State) {
    this.state = rootState;
    this.context = {
      dataFields: {},
      dataGroups: {},
      rules: {},
    };
    this.xmlParser = sax.parser(true, { trim: true });

    this.xmlParser.onerror = (error) => {
      throw error;
    };

    this.xmlParser.ontext = (text) => {
      this.state.onText(text);
    };
    this.xmlParser.onopentag = (tag) => {
      this.state = this.state.onOpenTag(tag, this.context);
    };
    this.xmlParser.onclosetag = (tagName) => {
      this.state = this.state.onCloseTag(tagName, this.context);
    };
  }

  public write(data: string) {
    this.xmlParser.write(data);
  }

  public finish(): State {
    this.xmlParser.close();
    return this.state;
  }
}
