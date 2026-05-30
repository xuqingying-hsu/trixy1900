import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "lenormand_admin";

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function sessionSecret() {
  return process.env.SESSION_SECRET || adminPassword();
}

export function isUsingDefaultAdminPassword() {
  return !process.env.ADMIN_PASSWORD;
}

function sessionToken() {
  return createHmac("sha256", sessionSecret()).update(adminPassword()).digest("hex");
}

export async function verifyPassword(password: string) {
  return password === adminPassword();
}

export async function createAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });
}

export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) {
    return false;
  }

  const expected = Buffer.from(sessionToken());
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
