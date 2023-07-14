import "dotenv/config";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import express from "express";
import morgan from "morgan";

import connection from "./config/connectDB.js";
import { morganMiddleware, systemLogs } from "./utils/Logger.js";

await connection();

const app = express();

const NODE_ENV = process.env.NODE_ENV;
const PORT = process.env.PORT || 1997;

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(morganMiddleware);

app.get("/api/v1/test", (_, res) => {
  return res.json({ message: "Welcome to the Invoice App!!" });
});

app.listen(PORT, () => {
  console.log(
    `${chalk.green.bold("✔")} 👍 Server running in ${chalk.yellow.bold(
      NODE_ENV
    )} mode on port ${chalk.blue.bold(PORT)}`
  );
  systemLogs.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});
