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
  transform: (document: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Teacher', teacherSchema)
