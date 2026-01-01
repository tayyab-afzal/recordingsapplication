import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { getSecret } from "@/lib/secrets";

import {
  getUserByEmail,
  updateUser,
  createSession,
  deleteSessionByUserId,
  createLoginCode,
  getLoginCode,
  deleteLoginCode,
} from "@/lib/dynamodb";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(8).optional(),
  code: z.string().min(6).max(6).optional(),
});

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function getRuntimeSecrets() {
  if (!process.env.SECRETS_ARN) throw new Error("SECRETS_ARN not set");
  return await getSecret(process.env.SECRETS_ARN);
}

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 4 * 60 * 60,
  },
  jwt: {
    maxAge: 4 * 60 * 60,
  },

  pages: { signIn: "/sign-in" },

  providers: [
    Credentials({
      name: "Email + Password/Code",
      authorize: async (raw) => {
        const secret = await getRuntimeSecrets();

        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password, code } = parsed.data;
        const lower = email.toLowerCase();

        const user = await getUserByEmail(lower);
        if (!user) throw new Error("USER_NOT_FOUND");

        if (code) {
          const cleanCode = code.toString().trim();
          if (!/^\d{6}$/.test(cleanCode))
            throw new Error("INVALID_CODE_FORMAT");

          const record = await getLoginCode(lower);
          if (!record) throw new Error("NO_CODE_FOUND");

          if (new Date(record.expiresAt) < new Date()) {
            await deleteLoginCode(lower);
            throw new Error("CODE_EXPIRED");
          }

          const matches = await bcrypt.compare(cleanCode, record.tokenHash);
          if (!matches) throw new Error("INVALID_CODE");

          await deleteLoginCode(lower);

          return {
            id: user.id,
            email: user.email,
            name: user.name || null,
            role: user.role,
          };
        }

        if (!password || !user.passwordHash)
          throw new Error("PASSWORD_REQUIRED");

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) throw new Error("INVALID_PASSWORD");

        const oneTime = generateCode();
        const codeHash = await bcrypt.hash(oneTime, 12);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await createLoginCode(lower, codeHash, expiresAt);

        const transporter = nodemailer.createTransport({
          host: secret.SES_SMTP_EP,
          port: 465,
          secure: true,
          auth: { user: secret.SES_SMTP_USER, pass: secret.SES_SMTP_PASS },
        });

        await transporter.sendMail({
          from: secret.EMAIL_FROM,
          to: email,
          subject: "Recordings Application - Login code",
          html: `<p>Your login code is <b>${oneTime}</b>. The code will expire in 10 minutes.</p>`,
        });

        throw new Error("CODE_REQUIRED");
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;

        if (trigger === "signIn") {
          const secret = await getRuntimeSecrets();
          const sessionMaxAgeMs = parseInt(secret.SESSION_MAX_AGE, 10) * 1000;

          await updateUser(user.id, {
            isLoggedIn: true,
            lastLoginAt: new Date().toISOString(),
          });
          await createSession(user.id, new Date(Date.now() + sessionMaxAgeMs));
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (!session.user) session.user = {};
      if (token?.userId) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },

  events: {
    async signOut({ session }) {
      if (!session?.user?.id) return;
      const userId = session.user.id;

      await updateUser(userId, { isLoggedIn: false });
      await deleteSessionByUserId(userId);
    },
  },
};
