import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Korvi <onboarding@resend.dev>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }
  return new Resend(apiKey);
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const resend = getClient();
  await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Redefinir sua senha — Korvi",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
        <h1 style="font-size: 20px;">Redefinir sua senha</h1>
        <p>Olá, ${params.name}.</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta na Korvi. Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.</p>
        <p style="margin: 24px 0;">
          <a href="${params.resetUrl}" style="background:#0d2b4e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block;">
            Redefinir senha
          </a>
        </p>
        <p>Se você não pediu essa redefinição, pode ignorar este e-mail com segurança.</p>
      </div>
    `,
  });
}
