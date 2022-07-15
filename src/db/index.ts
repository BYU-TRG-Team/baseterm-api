import knex from "knex";
import { attachPaginate } from "knex-paginate";
import { AppEnv } from "../types";

const { DATABASE_URL, APP_ENV } = process.env;

const dbClient = knex({
  client: "pg",
  version: "13.6",
  pool: { min: 0, max: 100 },
  connection: {
    connectionString: DATABASE_URL,
    ssl: 
      APP_ENV === AppEnv.Prod ?
      {
        rejectUnauthorized: false
      } :
      false,
  }
});

attachPaginate();

export default dbClient;

