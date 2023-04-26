import { DBField } from "@db/types";
import { TBXAttribute } from "@typings";
import { FileServiceSession } from "@typings/sessions";

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

  case DBField.id:
    return TBXAttribute.id;

  case DBField.style:
    return TBXAttribute.style;

  case DBField.target:
    return TBXAttribute.target;

  case DBField.type:
    return TBXAttribute.type;

  case DBField.xmlLang:
    return TBXAttribute.xmlLang;

  case DBField.xmlns:
    return TBXAttribute.xmlns;   
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
      this.message += ";";
    }

    this.message += message;
  }

  toString() {
    return this.message.toString();
  }
}