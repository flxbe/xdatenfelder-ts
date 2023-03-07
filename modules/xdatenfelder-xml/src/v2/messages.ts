import { SchemaContainer } from "./schema";
import { SchemaConverter } from "./parser";

export class SchemaMessage {
  public readonly messageId: string;
  public readonly createdAt: Date;
  public readonly schemaContainer: SchemaContainer;

  constructor(
    messageId: string,
    createdAt: Date,
    schemaContainer: SchemaContainer
  ) {
    this.messageId = messageId;
    this.createdAt = createdAt;
    this.schemaContainer = schemaContainer;
  }

  public static fromString(value: string): SchemaMessage {
    const converter = new SchemaConverter();

    converter.write(value);
    const { messageId, createdAt, schemaContainer } = converter.finish();

    return new SchemaMessage(messageId, createdAt, schemaContainer);
  }
}
