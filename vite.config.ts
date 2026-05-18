import { resolve } from "path";
import { defineConfig } from "viteburner";

export default defineConfig({
    build: {
        emptyOutDir: true,
        minify: false,
        outDir: "dist",
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
            "/src": resolve(__dirname, "src"),
        },
    },
    viteburner: {
        download: {
            server: ["home"],
            location: (file, server) =>
                file.endsWith(".txt") && file != "config.txt" ? `txt/${server}/${file}` : null,
        },
        ignoreInitial: false,
        port: 12525,
        sourcemap: "inline",
        timeout: 15000,
        watch: [
            { pattern: "src/**/*.{js,ts}", transform: true },
            { pattern: "src/**/*.{script,txt}" },
        ],
    },
});
