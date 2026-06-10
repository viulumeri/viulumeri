import mongoose from 'mongoose'

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true
    },

    answer: {
      type: String,
      required: true,
      trim: true
    },

    order: {
      type: Number,
      default: 0
    },

    imageUrl: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

export const Faq = mongoose.model('Faq', faqSchema)