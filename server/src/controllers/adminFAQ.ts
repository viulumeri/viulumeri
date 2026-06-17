import type { Request, Response } from 'express'
import express from 'express'
import multer from 'multer'
import { Faq } from '../models/FAQ'

const adminFaqRouter = express.Router()

const upload = multer({ dest: 'uploads/' })

adminFaqRouter.post(
  '/',
  upload.any(),
  async (req: Request, res: Response) => {
    const rawBlocks = req.body.blocks ? JSON.parse(req.body.blocks) : []
    const files = Array.isArray(req.files) ? req.files : []

    const blocks = rawBlocks.map((block: any) => {
      if (block.type === 'text') {
        return {
          type: 'text',
          content: block.content,
          order: block.order
        }
      }

      const file = files.find(
        uploadedFile => uploadedFile.fieldname === block.fileKey
      )

      return {
        type: 'image',
        imageUrl: file ? `/uploads/${file.filename}` : '',
        order: block.order
      }
    })

    const faq = new Faq({
      question: req.body.question,
      order: Number(req.body.order),
      blocks
    })

    const saved = await faq.save()

    res.status(201).json(saved)
  }
)

adminFaqRouter.put(
  '/:id',
  upload.any(),
  async (req: Request, res: Response) => {
    const rawBlocks = req.body.blocks ? JSON.parse(req.body.blocks) : []
    const files = Array.isArray(req.files) ? req.files : []

    const blocks = rawBlocks.map((block: any) => {
      if (block.type === 'text') {
        return {
          type: 'text',
          content: block.content,
          order: block.order
        }
      }

      const file = files.find(
        uploadedFile => uploadedFile.fieldname === block.fileKey
      )

      return {
        type: 'image',
        imageUrl: file
          ? `/uploads/${file.filename}`
          : block.imageUrl || '',
        order: block.order
      }
    })

    const updated = await Faq.findByIdAndUpdate(
      req.params.id,
      {
        question: req.body.question,
        blocks
      },
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