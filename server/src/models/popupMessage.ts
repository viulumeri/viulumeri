import mongoose from 'mongoose'

const popupMessageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    content: { type: String, required: true, minlength: 1, maxlength: 4000 },
    postedAt: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
)

const PopupMessage = mongoose.model('PopupMessage', popupMessageSchema)

export default PopupMessage
