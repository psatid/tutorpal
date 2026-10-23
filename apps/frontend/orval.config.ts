import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "../backend/openapi/openapi.json",
    },
    output: {
      mode: "split",
      target: "./src/api/generated",
      schemas: "./src/api/generated/models",
      client: "axios",
    },
  },
});
