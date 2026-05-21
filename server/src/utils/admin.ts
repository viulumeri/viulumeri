import logger from './logger'
import { auth } from './auth'

export const ensureAdminUser = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@example.com'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const name = process.env.ADMIN_NAME || 'Administrator'

  const authContext = (auth as any).$context
  if (!authContext?.internalAdapter || !authContext?.password) {
    throw new Error('Unable to access Better Auth internal adapter or password helper')
  }

  const adapter = authContext.internalAdapter as any
  const passwordHelper = authContext.password as any

  const existingUser = await adapter.findUserByEmail(email, { includeAccounts: true })

  if (existingUser?.user) {
    if (existingUser.user.userType !== 'admin') {
      logger.warn('Existing user found with ADMIN_EMAIL but userType is not admin', {
        email,
        userType: existingUser.user.userType
      })
    }

    if (!existingUser.user.emailVerified && adapter.updateUserByEmail) {
      await adapter.updateUserByEmail(email, { emailVerified: true })
      logger.info('Marked existing admin email as verified', { email })
    }

    const hasCredentialAccount = Array.isArray(existingUser.accounts)
      ? existingUser.accounts.some((account: any) => account.providerId === 'credential')
      : false

    if (!hasCredentialAccount) {
      const passwordHash = await passwordHelper.hash(password)
      await adapter.createAccount({
        userId: existingUser.user.id,
        providerId: 'credential',
        accountId: existingUser.user.id,
        password: passwordHash
      })
      logger.info('Created missing credential account for existing admin user', { email })
    }

    return
  }

  const user = await adapter.createUser({
    email: email.toLowerCase(),
    name,
    userType: 'admin',
    emailVerified: true
  })

  const passwordHash = await passwordHelper.hash(password)
  await adapter.createAccount({
    userId: user.id,
    providerId: 'credential',
    accountId: user.id,
    password: passwordHash
  })

  logger.info('Created admin user', { email })
}
