import type { NextConfig } from "next";

// Old site URLs (docs/ARCHITECTURE.md, Redirects): /projects and /project?<slug>.
const SLUGS = ["andrew-callaghan", "barker-wellness", "airly", "sophie-brussaux", "think-apollo", "dymatize"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/projects", destination: "/work", permanent: true },
      ...SLUGS.map((slug) => ({ source: "/project", has: [{ type: "query" as const, key: slug }], destination: `/work/${slug}`, permanent: true })),
      { source: "/project", destination: "/work", permanent: true },
    ];
  },
};

export default nextConfig;
