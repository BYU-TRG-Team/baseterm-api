import knex from "knex";
import { attachPaginate } from "knex-paginate";

const { DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_PORT, DB_NAME } = process.env;

const dbClient = knex({
  client: "pg",
  version: "13.6",
  pool: {min: 0, max: 100},
  connection: {
    host: DB_HOSTNAME,
    port: Number(DB_PORT),
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
  }
});

attachPaginate();

export default dbClient;

