import knex from "knex";
import { attachPaginate } from "knex-paginate";

const { DATABASE_URL } = process.env;

const dbClient = knex({
  client: "pg",
  version: "13.6",
  pool: {min: 0, max: 100},
  connection: DATABASE_URL
});

attachPaginate();

export default dbClient;

