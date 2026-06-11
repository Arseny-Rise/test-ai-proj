import { NextResponse } from "next/server";
import { COOKIE_NAME, signToken } from "@/lib/auth/jwt";
import { validatePassword } from "@/lib/auth/user";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password?.trim();

  if (!password) {
    return NextResponse.json({ error: "Введите пароль" }, { status: 400 });
  }

  const user = await validatePassword(password);
  if (!user) {
    return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
  }

  const token = await signToken(user.id);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
