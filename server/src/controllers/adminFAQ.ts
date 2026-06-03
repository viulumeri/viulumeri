
import express from 'express'
import { Faq } from '../models/FAQ'

const adminFaqRouter = express.Router()

adminFaqRouter.post('/', async (req, res) => {
  const faq = new Faq(req.body)

  const saved = await faq.save()

  res.status(201).json(saved)
})

adminFaqRouter.put('/:id', async (req, res) => {
  const updated = await Faq.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  )

  res.json(updated)
})

adminFaqRouter.delete('/:id', async (req, res) => {
  await Faq.findByIdAndDelete(req.params.id)

  res.status(204).end()
})

export default adminFaqRouter