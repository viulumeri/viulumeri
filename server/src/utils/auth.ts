import { betterAuth } from 'better-auth'
import { mongodbAdapter } from 'better-auth/adapters/mongodb'
import { client } from '../db'

export const auth = betterAuth({
  database: mongodbAdapter(client.db('viulumeri') as any),
  emailAndPassword: {
    enabled: true
  }
})
