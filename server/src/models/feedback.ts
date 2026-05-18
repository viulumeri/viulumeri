import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userType: { type: String, required: true },
    title: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['bug', 'feature', 'other']
    },
    message: { type: String, required: true },
    ip: { type: String, required: false },
    userAgent: { type: String, required: false }
  },
  { timestamps: true }
)

const Feedback = mongoose.model('Feedback', feedbackSchema)

export default Feedback
