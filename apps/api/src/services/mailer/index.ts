import nodemailer, { type SendMailOptions } from "nodemailer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../../env";
import { MAILER_CONFIG, type EmailTemplateName } from "./config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TemplateVariables {
    [key: string]: string | number | boolean | undefined;
}

export interface EmailOptions extends SendMailOptions {
    template?: EmailTemplateName | string;
    variables?: TemplateVariables;
}

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

const replaceVariables = (
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

const loadTemplate = async (templateName: string): Promise<string> => {
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
            from: env.MAIL_FROM,
            ...nodemailerOptions,
            html: htmlBody,
        };

        const info = await transporter.sendMail(mailOptions);

        console.info(`Email sent successfully to ${options.to}`);

        return info.messageId;
    } catch (error) {
        console.error(`Failed to send email to ${options.to}:`, error);
        return null;
    }
};