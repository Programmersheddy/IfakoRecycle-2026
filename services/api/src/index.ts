import "dotenv/config";
import { env } from "./env";
import app from "./app";

const port = env.PORT;

app.listen(port, () => {
   
  console.log(`[eas-api] listening on http://localhost:${port} (${env.NODE_ENV})`);
});
