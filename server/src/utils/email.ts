import { Resend } from 'resend'
import logger from './logger'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>')
    })

    if (error) {
      logger.error('Email sending failed:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    logger.info('Email sent successfully:', { to, subject, id: data?.id })
    return data
  } catch (error) {
    logger.error('Email service error:', error)
    throw error
  }
}