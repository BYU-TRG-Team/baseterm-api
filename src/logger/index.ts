import winston from "winston";
import RollbarTransport from "winston-transport-rollbar-3";
import { AppEnv } from "../types";

const {
  combine, errors, colorize, timestamp, prettyPrint,
} = winston.format;

const transports: winston.transport[] = [];

// Add transports
if (process.env.ROLLBAR_API_TOKEN !== undefined) {
  transports.push(
    new RollbarTransport({
      rollbarConfig: {
        accessToken: process.env.ROLLBAR_API_TOKEN as string,
      },
      level: "error",
    }
    )
  );
}

if (process.env.APP_ENV === AppEnv.Dev) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default winston.createLogger({
  transports,
  format: combine(
    errors({ stack: true }), // <-- use errors format
    colorize(),
    timestamp(),
    prettyPrint(),
  ),
});
