import mongoose from 'mongoose'

const popupMessageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    content: { type: String, required: true, minlength: 1, maxlength: 4000 },
    postedAt: { type: Date, required: true, default: Date.now },
    isDraft: { type: Boolean, required: true, default: false },
    visibleToTeachers: { type: Boolean, required: true, default: true },
    visibleToStudents: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
)

const PopupMessage = mongoose.model('PopupMessage', popupMessageSchema)

export default PopupMessage
