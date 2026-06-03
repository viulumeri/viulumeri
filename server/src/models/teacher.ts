import mongoose from 'mongoose'

const teacherSchema = new mongoose.Schema({
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
  students: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    default: []
  }
})

teacherSchema.set('toJSON', {
  transform: (_document: unknown, returnedObject: Record<string, unknown>) => {
    returnedObject.id = String(returnedObject._id)
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Teacher', teacherSchema)
