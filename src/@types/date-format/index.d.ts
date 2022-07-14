/// <reference types="node" />

declare module "date-format" {
  export function asString(
    format: string,
    date: Date
  ): string;
}