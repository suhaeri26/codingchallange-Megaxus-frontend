import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: `http://localhost:3030/openapi.json`,
    output: {
      mode: "tags-split",
      target: "./generated/service",
      schemas: "./generated/model",
      client: "react-query",
      override: {
        mutator: {
          path: "./api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});