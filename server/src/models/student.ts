import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  playedSongs: {
    type: [String],
    default: []
  }
})

studentSchema.set('toJSON', {
  transform: (_document: unknown, returnedObject: Record<string, unknown>) => {
    returnedObject.id = String(returnedObject._id)
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Student', studentSchema)
