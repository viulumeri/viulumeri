import mongoose, { Schema } from 'mongoose'

const homeworkSchema = new Schema({
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
    index: true
  },
  songs: {
    type: [String],
    default: []
  },
  comment: {
    type: String,
    default: ''
  },
  practiceCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

homeworkSchema.set('toJSON', {
  transform: (_document: any, returnedObject: any) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

export default mongoose.model('Homework', homeworkSchema)
