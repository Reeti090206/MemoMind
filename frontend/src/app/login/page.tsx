"use client";

import GlassLoginWall from "@/components/GlassLoginWall";

/**
 * Standalone login page that renders without the authentication layout wrapper.
 * This ensures the login page is always accessible at /login.
 */
export default function LoginPage() {
  return <GlassLoginWall />;
}
