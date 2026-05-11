import { createHmac } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const ContactSchema = z.object({
  nom: z.string().min(1).max(100),
  prenom: z.string().min(1).max(100),
  email: z.string().email(),
  telephone: z.string().max(20).optional(),
  message: z.string().min(10).max(2000),
  captchaAnswer: z.string().min(1),
  captchaToken: z.string().min(1),
});

function verifyCaptcha(answer: string, token: string): boolean {
  const secret = process.env.AUTH_SECRET ?? "fallback-secret";
  const expected = createHmac("sha256", secret).update(answer.trim()).digest("hex");
  return expected === token;
}

export async function POST(req: NextRequest) {
  const body: unknown = await req.json();
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_DATA" }, { status: 400 });
  }

  const { nom, prenom, email, telephone, message, captchaAnswer, captchaToken } = parsed.data;

  if (!verifyCaptcha(captchaAnswer, captchaToken)) {
    return NextResponse.json({ error: "CAPTCHA_INVALID" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "noreply@example.com";
  const to = process.env.ADMIN_EMAIL ?? "admin@example.com";

  if (apiKey && !apiKey.startsWith("re_placeholder")) {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject: `Message de contact — ${prenom} ${nom}`,
      text: [
        `Nom : ${prenom} ${nom}`,
        `Email : ${email}`,
        telephone ? `Téléphone : ${telephone}` : null,
        ``,
        `Message :`,
        message,
      ]
        .filter((l) => l !== null)
        .join("\n"),
    });
  } else {
    console.log("[contact] Email non envoyé (Resend non configuré) :", {
      from: email,
      nom: `${prenom} ${nom}`,
      telephone,
      message,
    });
  }

  return NextResponse.json({ success: true });
}
