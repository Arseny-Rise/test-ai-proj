import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "session";
const EXPIRY = "30d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, getSecret());
  const userId = payload.userId;
  if (typeof userId !== "string") {
    return null;
  }
  return { userId };
}

export { COOKIE_NAME };
