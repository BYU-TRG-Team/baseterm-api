/* eslint-disable @typescript-eslint/no-explicit-any */
import { TbxDbFieldToAttribute } from "../utils";
import * as dbTypes from "@db/types";
import * as types from "@typings";
import xmlFormatter from "xml-formatter";

interface TbxTableDependencies {
  schema: dbTypes.Schema;
  tableName: string;
}

interface TbxEntityDependencies extends TbxTableDependencies {
  uuid: string;
}

export class TbxTable {
  public tableName: string;
  public schema: dbTypes.Schema;

  constructor({ schema, tableName}: TbxTableDependencies ) {
    this.tableName  = tableName;
    this.schema = schema;
  }

  get fullTableName() {
    return `${this.schema}.${this.tableName}`;
  }
}

export class TbxEntity extends TbxTable {
  public uuid: string;

  constructor({ tableName, schema, uuid }: TbxEntityDependencies) {
    super({ schema, tableName });
    this.uuid = uuid;
  }
}

// TODO: Clean up and refactor some logic out to utils
export class TbxElement {
  private attributes: { [key: string]: string};
  private name: string;
  private children: TbxElement[];
  private value: string;
  private isRoot: boolean;
  public order: number;

  constructor(name: types.TbxElement, dbRow: any, isRoot = false) {
    // Escape characters for XML
    Object.keys(dbRow).forEach((key) => {
      if (typeof dbRow[key] !== "string") return;
      dbRow[key] = dbRow[key]
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    });

    
    this.name = name;
    this.children = [];
    this.attributes = {};
    this.value = dbRow.value ? dbRow.value : "";
    this.isRoot = isRoot;
    this.order = dbRow.order ? Number(dbRow.order) : 0;
   
    // Add attributes from passed db row
    for (const dbField of dbTypes.DBFields) {
      if ([undefined, null].includes(dbRow[dbField])) continue;
      const attributeName = TbxDbFieldToAttribute(dbField);  
      if (attributeName === undefined) continue;

      this.attributes[attributeName] = dbRow[dbField];
    }
  }

  public addChild(...childElements: TbxElement[]) {
    this.children.push(...childElements);
  }

  public setValue(val: string) {
    this.value = val;
  }

  public toString(): string {
    const attributes = 
      Object.keys(this.attributes)
        .map(key => `${key}="${this.attributes[key]}"`)
        .join(" ");

    const xmlAsString = 
    `<${this.name}` +
    `${
      attributes.length > 0 ?
        ` ${attributes}` :
        ""
    }` +
    ">" +
    `${
      this.value.length > 0 ?
        this.value
        :
        ""
    }` +
    `${
      this.children.length > 0 ?
        this.children.map(child => child.toString()).join("")
        :
        ""
    }` +
    `</${this.name}>`
    ;
      
    return this.isRoot ?
      xmlFormatter(
        "<?xml version=\"1.0\"?>" + xmlAsString,
        {
          lineSeparator: "\n",
        }
      )
      :
      xmlAsString;
  }
}