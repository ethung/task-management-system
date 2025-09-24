import { dirname } from "path";
import { fileURLToPath } from "url";

import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      "web-bundles/**",
      ".bmad-core/**",
      "lib/generated/**",
      "prisma/generated/**",
    ],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "prefer-const": "warn",
      "no-var": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "log"] }],
      "react/jsx-key": "warn",
      "react/jsx-no-duplicate-props": "warn",
      "react/jsx-no-undef": "warn",
      "react/no-direct-mutation-state": "warn",
      "react/no-unescaped-entities": "warn",
      "react/self-closing-comp": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "import/order": "warn",
    },
  },
];

export default eslintConfig;
