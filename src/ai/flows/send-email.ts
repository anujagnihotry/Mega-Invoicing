'use server';

/**
 * @fileOverview An email sending utility flow.
 *
 * - sendEmail - A function that handles sending emails.
 * - SendEmailInput - The input type for the sendEmail function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as nodemailer from 'nodemailer';

const SendEmailInputSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  smtpConfig: z.object({
    host: z.string(),
    port: z.number(),
    user: z.string(),
    pass: z.string(),
  }),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded string
    encoding: z.literal('base64'),
  })).optional(),
});
export type SendEmailInput = z.infer<typeof SendEmailInputSchema>;

export async function sendEmail(input: SendEmailInput): Promise<void> {
  await sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { to, subject, html, smtpConfig, attachments } = input;

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.port === 465, // true for 465, false for other ports
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    try {
      await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'SwiftInvoice'}" <${smtpConfig.user}>`, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        html: html, // html body
        attachments: attachments,
      });
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Failed to send email:', error);
      // We might want to throw an error here to let the caller know it failed.
      // For now, we're just logging it.
      throw new Error(`Failed to send email: ${error}`);
    }
  }
);
