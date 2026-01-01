import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  getUserByEmail,
  getResetToken,
  deleteResetToken,
  updateUser,
} from "@/lib/dynamodb";

export async function POST(request) {
  try {
    const { email, token, password } = await request.json();

    if (!email || !token || !password) {
      return NextResponse.json(
        { error: "Email, token, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 }
      );
    }

    const resetRecord = await getResetToken(email);
    if (!resetRecord) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    if (new Date(resetRecord.expiresAt) < new Date()) {
      await deleteResetToken(email);
      return NextResponse.json(
        { error: "Reset link has expired" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(token, resetRecord.tokenHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid reset link" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await updateUser(user.id, { passwordHash });
    await deleteResetToken(email);

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
