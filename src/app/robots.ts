import { type MetadataRoute } from "next";

// Full robots.txt implemented in Story 1.10
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
