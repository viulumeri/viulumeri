import mongoose from 'mongoose'

const faqBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'image'],
      required: true
    },

    content: {
      type: String
    },

    imageUrl: {
      type: String
    },

    order: {
      type: Number,
      required: true
    }
  },
  {
    _id: false
  }
)

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true
    },

    blocks: {
      type: [faqBlockSchema],
      default: []
    },

    order: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
)

export const Faq = mongoose.model('Faq', faqSchema)