import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Prevent Next.js from inferring an incorrect workspace root when multiple lockfiles exist.
    root: __dirname,
  },
};

export default nextConfig;

