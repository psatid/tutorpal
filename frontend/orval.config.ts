import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "http://localhost:3000/v1/docs/open-api",
    },
    output: {
      mode: "split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/models",
      client: "axios",
    },
  },
});
