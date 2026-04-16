import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tsconfigPaths(),
		tailwindcss(),
		tanstackStart(),
		// tanstackRouter(),
		viteReact(),
		// devtools(),
		svgr(),
	],
});

export default config;
