import mongoose from 'mongoose'

const popupMessageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    content: { type: String, required: true, minlength: 1, maxlength: 4000 },
    images: {
      type: [
        {
          data: { type: String, required: true },
          name: { type: String, required: true, maxlength: 200 },
          type: { type: String, required: true, maxlength: 100 }
        }
      ],
      default: []
    },
    postedAt: { type: Date, required: true, default: Date.now },
    isDraft: { type: Boolean, required: true, default: false },
    visibleToTeachers: { type: Boolean, required: true, default: true },
    visibleToStudents: { type: Boolean, required: true, default: true },
    visibleFrom: { type: String, required: false },
    visibleUntil: { type: String, required: false }
  },
  { timestamps: true }
)

const PopupMessage = mongoose.model('PopupMessage', popupMessageSchema)

export default PopupMessage
