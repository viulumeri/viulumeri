import type { Request } from 'express'
import express from 'express'
import multer from 'multer'
import { Faq } from '../models/FAQ'

const adminFaqRouter = express.Router()

const upload = multer({ dest: 'uploads/' })

adminFaqRouter.post(
  '/',
  upload.single('image'),
  async (req: Request & { file?: Express.Multer.File }, res) => {
    const faq = new Faq({
      question: req.body.question,
      answer: req.body.answer,
      order: Number(req.body.order),
      imageUrl: req.file
        ? `/uploads/${req.file.filename}`
        : ''
    })

    const saved = await faq.save()

    res.status(201).json(saved)
  }
)

adminFaqRouter.put(
  '/:id',
  upload.single('image'),
  async (req: Request & { file?: Express.Multer.File }, res) => {
    const updateData: {
      question: string
      answer: string
      imageUrl?: string
    } = {
      question: req.body.question,
      answer: req.body.answer
    }

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`
    }

    if (req.body.removeImage === 'true') {
      updateData.imageUrl = ''
    }

    const updated = await Faq.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )

    res.json(updated)
  }
)

adminFaqRouter.delete('/:id', async (req, res) => {
  await Faq.findByIdAndDelete(req.params.id)

  res.status(204).end()
})

export default adminFaqRouter