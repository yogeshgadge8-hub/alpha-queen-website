import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RowDataPacket } from "mysql2/promise";
import { database, ensureSchema } from "@/db/mysql";

const COOKIE_NAME = "aq_admin_session";
const SESSION_DAYS = 7;

type AdminRow = RowDataPacket & { id: number; username: string; password_hash: string };
type SessionRow = RowDataPacket & { id: number; username: string };

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [scheme, salt, expectedHex] = encoded.split(":");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function adminExists() {
  await ensureSchema();
  const [rows] = await database().query<(RowDataPacket & { count: number })[]>("SELECT COUNT(*) AS count FROM admins");
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function setupAdmin(username: string, password: string) {
  await ensureSchema();
  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{4,40}$/.test(cleanUsername)) throw new Error("Username must be 4–40 letters, numbers, dots, dashes or underscores");
  if (password.length < 12) throw new Error("Password must contain at least 12 characters");
  const db = database();
  const connection = await db.getConnection();
  try {
    const [lockRows] = await connection.query<(RowDataPacket & { acquired: number })[]>("SELECT GET_LOCK('alpha_queen_admin_setup', 5) AS acquired");
    if (Number(lockRows[0]?.acquired ?? 0) !== 1) throw new Error("Admin setup is busy; please try again");
    const [rows] = await connection.query<(RowDataPacket & { count: number })[]>("SELECT COUNT(*) AS count FROM admins");
    if (Number(rows[0]?.count ?? 0) > 0) throw new Error("Admin account is already configured");
    const now = new Date();
    await connection.execute("INSERT INTO admins (username, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?)", [cleanUsername, hashPassword(password), now, now]);
  } finally {
    await connection.query("SELECT RELEASE_LOCK('alpha_queen_admin_setup')").catch(() => undefined);
    connection.release();
  }
  return loginAdmin(cleanUsername, password);
}

export async function loginAdmin(username: string, password: string) {
  await ensureSchema();
  const [rows] = await database().execute<AdminRow[]>("SELECT id, username, password_hash FROM admins WHERE username = ? LIMIT 1", [username.trim().toLowerCase()]);
  const admin = rows[0];
  if (!admin || !verifyPassword(password, admin.password_hash)) throw new Error("Invalid username or password");
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await database().execute("DELETE FROM admin_sessions WHERE expires_at < NOW(3)");
  await database().execute("INSERT INTO admin_sessions (token_hash, admin_id, expires_at, created_at) VALUES (?, ?, ?, ?)", [tokenHash(token), admin.id, expires, new Date()]);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires });
  return { id: admin.id, username: admin.username };
}

export async function currentAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  await ensureSchema();
  const [rows] = await database().execute<SessionRow[]>(`SELECT admins.id, admins.username FROM admin_sessions
    INNER JOIN admins ON admins.id = admin_sessions.admin_id
    WHERE admin_sessions.token_hash = ? AND admin_sessions.expires_at > NOW(3) LIMIT 1`, [tokenHash(token)]);
  return rows[0] ? { id: Number(rows[0].id), username: rows[0].username } : null;
}

export async function requireAdmin(returnTo: string) {
  const admin = await currentAdmin();
  if (!admin) redirect(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
  return admin;
}

export async function logoutAdmin() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await ensureSchema();
    await database().execute("DELETE FROM admin_sessions WHERE token_hash = ?", [tokenHash(token)]);
  }
  jar.set(COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function changeAdminPassword(adminId: number, currentPassword: string, nextPassword: string) {
  if (nextPassword.length < 12) throw new Error("New password must contain at least 12 characters");
  await ensureSchema();
  const [rows] = await database().execute<AdminRow[]>("SELECT id, username, password_hash FROM admins WHERE id = ? LIMIT 1", [adminId]);
  const admin = rows[0];
  if (!admin || !verifyPassword(currentPassword, admin.password_hash)) throw new Error("Current password is incorrect");
  await database().execute("UPDATE admins SET password_hash = ?, updated_at = ? WHERE id = ?", [hashPassword(nextPassword), new Date(), adminId]);
  await database().execute("DELETE FROM admin_sessions WHERE admin_id = ?", [adminId]);
}

export function safeReturnTo(value: FormDataEntryValue | null) {
  const path = String(value ?? "/admin/orders");
  return path.startsWith("/admin/") && !path.startsWith("//") ? path : "/admin/orders";
}
