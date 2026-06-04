import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      // Design uses literal `// label` text nodes (terminal aesthetic), not JSX comments.
      "react/jsx-no-comment-textnodes": "off",
      // next-themes mounted-check pattern requires setState in useEffect.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "public/**", "next-env.d.ts"]),
]);

export default eslintConfig;
