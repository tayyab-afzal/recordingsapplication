import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import {
  getUserByEmail,
  createResetToken,
  deleteResetToken,
} from "@/lib/dynamodb";
import { getSecret } from "@/lib/secrets";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: "If an account exists, a reset link has been sent" },
        { status: 200 }
      );
    }

    const secret = await getSecret(process.env.SECRETS_ARN);
    const resetToken = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(resetToken, 12);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await deleteResetToken(email);
    await createResetToken(email, tokenHash, expiresAt);

    const resetUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/forgot/reset?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const transporter = nodemailer.createTransport({
      host: secret.SES_SMTP_EP,
      port: 465,
      secure: true,
      auth: { user: secret.SES_SMTP_USER, pass: secret.SES_SMTP_PASS },
    });

    await transporter.sendMail({
      from: secret.EMAIL_FROM,
      to: email,
      subject: "Recordings Application - Password Reset Request",
      html: `<p>Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p>`,
    });

    return NextResponse.json(
      { message: "If an account exists, a reset link has been sent" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
