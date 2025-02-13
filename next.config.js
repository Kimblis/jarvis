const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});
module.exports = withBundleAnalyzer({
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.algebrakit.com",
        port: "",
        pathname: "/asset/cms/**",
        search: "",
      },
    ],
  },
});
