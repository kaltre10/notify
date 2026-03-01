import js from "@eslint/js";
import globals from "globals";

export default [
  // 1. Configuración para archivos JavaScript
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // Reconoce 'process', 'Buffer', etc.
        ...globals.browser, // Reconoce 'window', 'navigator', etc.
        ...globals.serviceworker
      },
    },
    rules: {
      ...js.configs.recommended.rules, // Reglas base recomendadas
      "no-unused-vars": "warn", // Avisa si hay variables sin usar
      "no-console": "off", // Permite usar console.log
      "no-undef": "error", // Error si usas variables no definidas
    },
  },
  // 2. Ignorar carpetas innecesarias (Reemplaza al .eslintignore)
  {
    ignores: ["node_modules/", "dist/", ".env"],
  },
];
