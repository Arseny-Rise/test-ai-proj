import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./jwt";

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUserId() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session.userId;
}
