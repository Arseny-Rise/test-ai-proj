import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

export async function ensureUser() {
  const existing = await prisma.user.findFirst();
  if (existing) return existing;

  const password = process.env.APP_PASSWORD;
  if (!password) {
    throw new Error("APP_PASSWORD is not set");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({ data: { passwordHash } });
}

export async function validatePassword(password: string) {
  const user = await ensureUser();
  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
