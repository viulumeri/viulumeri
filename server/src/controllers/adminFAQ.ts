import type { Request, Response, NextFunction } from 'express'
import express from 'express'
import multer from 'multer'
import { Faq } from '../models/FAQ'

const adminFaqRouter = express.Router()
const upload = multer()

type FaqBlockInput = {
  type: 'text' | 'image'
  content?: string
  fileKey?: string
  imageUrl?: string
  order?: number
}

const maybeUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.is('multipart/form-data')) {
    return upload.any()(req, res, next)
  }

  next()
}

const parseBlocks = (blocks: unknown): FaqBlockInput[] => {
  if (!blocks) return []

  if (typeof blocks === 'string') {
    const parsed = JSON.parse(blocks)
    return Array.isArray(parsed) ? parsed : []
  }

  return Array.isArray(blocks) ? (blocks as FaqBlockInput[]) : []
}

const buildBlocks = (
  rawBlocks: FaqBlockInput[],
  files: Express.Multer.File[]
) => {
  return rawBlocks.map(block => {
    if (block.type === 'text') {
      return {
        type: 'text',
        content: block.content ?? '',
        order: Number(block.order ?? 0)
      }
    }

    const file = files.find(
      uploadedFile => uploadedFile.fieldname === block.fileKey
    )

                return {
          type: 'image',
          imageUrl: file
            ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
            : block.imageUrl ?? '',
          order: Number(block.order ?? 0)
        }
  })
}

adminFaqRouter.post('/', maybeUpload, async (req: Request, res: Response) => {
  try {
    const files = Array.isArray(req.files) ? req.files : []
    const blocks = buildBlocks(parseBlocks(req.body.blocks), files)

    const saved = await Faq.create({
      question: req.body.question,
      order: Number(req.body.order ?? 1),
      blocks
    })

    res.status(201).json(saved)
  } catch (error) {
    console.error('FAQ create failed:', error)
    res.status(500).json({ error: 'FAQ create failed' })
  }
})

adminFaqRouter.put('/:id', maybeUpload, async (req: Request, res: Response) => {
  try {
    const files = Array.isArray(req.files) ? req.files : []

    const update: {
      question?: string
      order?: number
      blocks?: ReturnType<typeof buildBlocks>
    } = {}

    if (req.body.question !== undefined) {
      update.question = req.body.question
    }

    if (req.body.order !== undefined) {
      update.order = Number(req.body.order)
    }

    if (req.body.blocks !== undefined) {
      update.blocks = buildBlocks(parseBlocks(req.body.blocks), files)
    }

    const updated = await Faq.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    })

    if (!updated) {
      return res.status(404).json({ error: 'FAQ not found' })
    }

    res.status(200).json(updated)
  } catch (error) {
    console.error('FAQ update failed:', error)
    res.status(500).json({ error: 'FAQ update failed' })
  }
})

adminFaqRouter.delete('/:id', async (req, res) => {
  await Faq.findByIdAndDelete(req.params.id)
  res.status(204).end()
})

export default adminFaqRouter