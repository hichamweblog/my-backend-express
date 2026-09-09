import app from "./app";
import env from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`Server is running on port ${env.PORT}`);
});
