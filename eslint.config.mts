import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
    // Ignore generated and dependency files
    {
        ignores: [
            "**/node_modules/**",
            "**/.next/**",
            "**/dist/**",
            "**/build/**",
            "**/coverage/**",
        ],
    },

    // Base JavaScript / TypeScript configuration
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

        plugins: {
            js,
        },

        extends: ["js/recommended"],

        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },

    // TypeScript rules
    tseslint.configs.recommended,

    // React rules — ONLY for the web app
    {
        ...pluginReact.configs.flat.recommended,

        files: ["apps/web/**/*.{js,jsx,ts,tsx}"],

        settings: {
            react: {
                version: "detect",
            },
        },

        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },

        rules: {
            "react/react-in-jsx-scope": "off",
        },
    },
]);