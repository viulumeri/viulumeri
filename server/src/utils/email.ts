import { Resend } from 'resend'
import logger from './logger'

const isTestEnv = process.env.NODE_ENV === 'test'
const emailMode = process.env.E2E_EMAIL_MODE || (isTestEnv ? 'skip' : 'real')
let resend: Resend | null = null

const getResendClient = () => {
  if (resend) return resend

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY')
  }

  resend = new Resend(apiKey)
  return resend
}

interface SendEmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export const sendEmail = async ({ to, subject, text, html }: SendEmailOptions) => {
  if (emailMode !== 'real') {
    logger.info('Email send skipped', { to, subject, emailMode })
    return { id: 'test-email' }
  }

  try {
    const client = getResendClient()
    const { data, error } = await client.emails.send({
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