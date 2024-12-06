import path from "path";
import framework7 from "rollup-plugin-framework7";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./www");

export default async () => {
  return {
    plugins: [framework7({ emitCss: false })],
    root: SRC_DIR,
    base: "",
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
      },
    },
    resolve: {
      alias: {
        "@": SRC_DIR,
      },
    },
    server: {
      host: true,
      proxy: {
        "/api": {
          target: "http://localhost:3000", // Your Express backend
          changeOrigin: true,
          secure: false,
        },
      },
    },
    esbuild: {
      jsxFactory: "$jsx",
      jsxFragment: '"Fragment"',
    },
  };
};
