import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { withPayload } = require("@payloadcms/next/withPayload");

const nextConfig: NextConfig = {
  // Lint vẫn bỏ qua khi build để tránh nhiễu (img element, any...); chạy `npm run lint` riêng.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // KHÔNG bỏ qua lỗi TypeScript nữa — lỗi type sẽ làm build thất bại để không bị che giấu.
};

export default withPayload(nextConfig);
