import knex from "knex";
import { attachPaginate } from "knex-paginate";
import { AppEnv } from "@typings";

const { DATABASE_URL, APP_ENV, MAX_CONNECTION_POOL = 20 } = process.env;

const dbClient = knex({
  client: "pg",
  version: "13.6",
  pool: { min: 0, max: Number(MAX_CONNECTION_POOL) },
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

