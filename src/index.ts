import "dotenv/config";
import express from "express";
import constructServer from "./app";

const initialize = async () => {
  const app = express();

  constructServer(app);
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`App listening on port ${port}`);
  });
}

initialize()
