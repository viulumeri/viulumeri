import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    userType: { type: String, required: true },
    title: { type: String, required: true, maxlength: 200 },
    category: {
      type: String,
      required: true,
      enum: ['bug', 'feature', 'other']
    },
    isRead: { type: Boolean, required: true, default: false, index: true },
    message: { type: String, required: true, minlength: 5, maxlength: 4000 },
    ip: { type: String, required: false },
    userAgent: { type: String, required: false }
  },
  { timestamps: true }
)

const Feedback = mongoose.model('Feedback', feedbackSchema)

export default Feedback
