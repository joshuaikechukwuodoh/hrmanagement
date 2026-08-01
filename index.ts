import "dotenv/config";
import app from "./src/app";

const port = Number(process.env.PORT ?? 3000);

console.log(`HR Management API listening on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
