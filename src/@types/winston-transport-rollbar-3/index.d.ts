/// <reference types="node" />

declare module "winston-transport-rollbar-3" {
  import TransportStream from "winston-transport";

  interface WinstonRollbarTransportOptions {
    rollbarConfig: {
      accessToken: string;
    },
    level: "error" | "warn"
  }

  class WinstonRollbarTransport extends TransportStream  {
    constructor(
      options: WinstonRollbarTransportOptions
    )
  }

  export default WinstonRollbarTransport;
}