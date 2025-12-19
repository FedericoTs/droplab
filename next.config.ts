import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fix: Explicitly set project root to prevent Next.js from using parent directory
  // Resolves build timeout issue caused by multiple lockfiles in parent directories
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
