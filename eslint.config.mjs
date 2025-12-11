// eslint.config.mjs

import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  // JavaScript 基本規則
  js.configs.recommended,

  // Next.js 官方規則
  nextPlugin.configs.recommended,

  // TypeScript 官方規則
  ...tseslint.configs.recommended,

  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
    ],
  },
];
