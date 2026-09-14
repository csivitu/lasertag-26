import nodemailer, { type SendMailOptions, type Transporter } from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../../env";
import { MAILER_CONFIG, type EmailTemplateName } from "./config";

export { MAILER_CONFIG, type EmailTemplateName } from "./config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailOptions extends SendMailOptions {
  template?: EmailTemplateName | string;
  variables?: TemplateVariables;
}

export interface SendEmailResult {
  messageId: string | null;
  previewUrl?: string | false;
}

let cachedTransporter: Transporter | null = null;
let isEthereal = false;

/**
 * Returns a configured nodemailer transporter.
 * If valid SMTP credentials are provided, uses the configured custom SMTP server.
 * If running in development without credentials, automatically provisions an
 * Ethereal test account so emails can be previewed without crashing.
 */
async function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const hasRealCredentials =
    Boolean(env.SMTP_USER) &&
    env.SMTP_USER !== "dev_user" &&
    Boolean(env.SMTP_PASS) &&
    env.SMTP_PASS !== "dummy_pass";

  if (hasRealCredentials) {
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    isEthereal = false;
    return cachedTransporter;
  }

  // Development fallback: Disposable Ethereal test account
  console.info("[Mailer] Real SMTP credentials not detected. Provisioning Ethereal test account...");
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    isEthereal = true;
    console.info(`[Mailer] Ethereal test account initialized (${testAccount.user})`);
    return cachedTransporter;
  } catch (err) {
    console.warn("[Mailer] Failed to initialize Ethereal test account, falling back to configured host:", err);
    cachedTransporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
    isEthereal = false;
    return cachedTransporter;
  }
}

/**
 * Replaces {{variableName}} with values provided in the variables map.
 */
export const replaceVariables = (
  templateContent: string,
  variables: TemplateVariables = {},
): string => {
  return templateContent.replace(
    /\{\{(\w+)\}\}/g,
    (match, variableName: string) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match;
    },
  );
};

/**
 * Reads an HTML template file from disk.
 */
export const loadTemplate = async (templateName: string): Promise<string> => {
  const templatePath = path.join(
    __dirname,
    "templates",
    `${templateName}.html`,
  );

  try {
    return await fs.readFile(templatePath, "utf-8");
  } catch {
    throw new Error(
      `Email template "${templateName}" not found at ${templatePath}`,
    );
  }
};

/**
 * Sends an email using nodemailer with HTML template rendering and error resilience.
 * Returns the messageId if sent successfully, or null if an error occurred.
 */
export const sendEmail = async (
  options: EmailOptions,
): Promise<string | null> => {
  const { template, variables = {}, ...nodemailerOptions } = options;

  try {
    let htmlBody = options.html as string | undefined;

    if (template) {
      const templateFile =
        template in MAILER_CONFIG
          ? MAILER_CONFIG[template as keyof typeof MAILER_CONFIG]
          : template;

      const rawTemplate = await loadTemplate(templateFile);
      htmlBody = replaceVariables(rawTemplate, variables);
    }

    const mailOptions: SendMailOptions = {
      from: env.MAIL_FROM || `"LaserTag 2026" <${env.SMTP_USER}>`,
      ...nodemailerOptions,
      html: htmlBody,
    };

    const transporter = await getTransporter();
    const info = await transporter.sendMail(mailOptions);

    console.info(`[Mailer] Email sent successfully to ${options.to} (Message ID: ${info.messageId})`);

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.info(`[Mailer] ✉️  Preview Ethereal Email: ${previewUrl}`);
      }
    }

    return info.messageId;
  } catch (error) {
    console.error(`[Mailer] Failed to send email to ${options.to}:`, error);
    return null;
  }
};
