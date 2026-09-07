import nodemailer from "nodemailer";

export function hasSmtp(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_FROM &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: String(process.env.SMTP_SECURE ?? "0") === "1",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendMail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  if (!hasSmtp() || !input.to) {
    console.log("[mail] SMTP no configurado o sin destinatario; correo omitido:", input.to, "-", input.subject);
    return false;
  }
  try {
    await transporter().sendMail({
      from: process.env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return true;
  } catch (err) {
    console.error("[mail] error al enviar:", err);
    return false;
  }
}

export function publicBaseUrl(): string {
  return process.env.PUBLIC_BASE_URL ?? "http://localhost:3200";
}

function shell(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f8fa;font-family:Arial,Helvetica,sans-serif;color:#0a3b5c">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
  <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:14px;overflow:hidden">
    <tr><td style="background:#0a3b5c;color:#fff;padding:22px 26px;font-size:1.05rem;font-weight:700">${title}</td></tr>
    <tr><td style="padding:26px;font-size:0.95rem;line-height:1.6">${body}</td></tr>
  </table></td></tr></table></body></html>`;
}

function button(href: string, text: string): string {
  return `<p style="margin:22px 0"><a href="${href}" style="background:#f2b84b;color:#0a3b5c;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px">${text}</a></p>`;
}

export function mailWelcomeMember(tenantName: string): { subject: string; html: string } {
  return {
    subject: `Bienvenido a ${tenantName}`,
    html: shell(
      "¡Bienvenido!",
      `<p>Hola, gracias por unirte a la membresía de <b>${tenantName}</b>.</p>
       <p>Ya puedes ingresar a <b>Estudios bíblicos</b>, llevar tu progreso y
       desbloquear los niveles completando sus lecciones.</p>
       ${button(publicBaseUrl() + "/estudios", "Comenzar mis estudios")}`,
    ),
  };
}

export function mailNewDecision(payload: {
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
}): { subject: string; html: string } {
  return {
    subject: `Nueva decisión: ${payload.fullName}`,
    html: shell(
      "🧭 Nueva decisión de fe",
      `<p><b>${payload.fullName}</b> quiso seguir a Jesús.</p>
       <ul>
         <li>Correo: ${payload.email ?? "—"}</li>
         <li>Teléfono: ${payload.phone ?? "—"}</li>
         <li>Mensaje: ${payload.message ?? "—"}</li>
       </ul>
       <p>Entra al panel de <b>Decisiones</b> para hacer seguimiento.</p>
       ${button(publicBaseUrl() + "/admin/decisiones", "Ver decisiones")}`,
    ),
  };
}

export function mailNewDonation(payload: {
  fullName: string;
  amount: number;
  category: string;
  method: string;
}): { subject: string; html: string } {
  return {
    subject: `Nueva donación de ${payload.fullName}`,
    html: shell(
      "🤲 Nueva donación",
      `<p><b>${payload.fullName}</b> registró un aporte:</p>
       <ul>
         <li>Monto: <b>S/ ${payload.amount.toFixed(2)}</b></li>
         <li>Categoría: ${payload.category}</li>
         <li>Método: ${payload.method}</li>
       </ul>
       <p>Revisa Mayordomía para confirmar y dar gracias.</p>`,
    ),
  };
}

export function mailResetPassword(payload: {
  fullName: string;
  token: string;
}): { subject: string; html: string } {
  const link = `${publicBaseUrl()}/acceso?reset=${encodeURIComponent(payload.token)}`;
  return {
    subject: "Restablecer tu clave — Aguas Vivas",
    html: shell(
      "🔑 Restablecer clave",
      `<p>Hola <b>${payload.fullName}</b>, recibimos una solicitud para restablecer
       tu clave de acceso.</p>
       ${button(link, "Restablecer mi clave")}
       <p style="font-size:0.8rem;color:#718096">Este enlace es válido por 30 minutos.
       Si no lo pediste, ignora este correo.</p>`,
    ),
  };
}