import { DBField } from "./db/types";
import { TBXAttribute } from "./types";
import { FileServiceSession } from "./types/sessions";

export const isDefined = (value: any) => {
  return value !== undefined;
};

export function describe<T = void>(_message: string, callback: () => Promise<T>, condition = true): Promise<T | undefined> {
  if (condition) return callback();
  return new Promise((resolve) => resolve(undefined));
}

export const TbxDbFieldToAttribute = (attribute: DBField) => {
  switch(attribute) {
  case DBField.datatype:
    return TBXAttribute.datatype;
    break;
  case DBField.id:
    return TBXAttribute.id;
    break;
  case DBField.style:
    return TBXAttribute.style;
    break;
  case DBField.target:
    return TBXAttribute.target;
    break;
  case DBField.type:
    return TBXAttribute.type;
    break;
  case DBField.xmlLang:
    return TBXAttribute.xmlLang;
    break;
  case DBField.xmlns:
    return TBXAttribute.xmlns;
    break;
  }
};

export const eventConstructor = (
  event: FileServiceSession
) => (
  `data: ${JSON.stringify(event)}\n\n`
);

export const isValidUUID = (
  val: string
) => {
  const uuidRegexExp = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi;
  return uuidRegexExp.test(val);
};

export class TransactionMessage {
  private message: string;

  constructor() {
    this.message = "";
  }

  addChange(
    message: string,
  ) {
    if (
      this.message.length !== 0
    ) {
      this.message += ";"
    }

    this.message += message
  }

  toString() {
    return this.message.toString();
  }
}