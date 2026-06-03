
import express from 'express'
import { Faq } from '../models/FAQ'

const faqRouter = express.Router()

faqRouter.get('/', async (_req, res) => {
  const faqs = await Faq.find().sort({ order: 1 })

  res.json(faqs)
})

export default faqRouter