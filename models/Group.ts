import mongoose from "mongoose";
import Joi from "joi"
const { Schema } = mongoose
const { ObjectId } = Schema.Types


const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
    minLenght: 3,
    maxLength: 60
  },
  createdBy: {
    type: ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  count: {
    type: Number,
    default: 0
  },
  status: String,
  codes: [{
    index: Number,
    code: String
  }],
  members: [
    {
      _id: {
        type: ObjectId,
        ref: "User"
      },
      status: {
        type: String,
        default: "player",
        enum: ["player", "leader"]
      },
      codes: [{
        index: Number,
        code: String
      }]
    }
  ]
})
const Group = mongoose.model("Group", groupSchema)

const validate = (group: object) => {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(60)
  })

  return schema.validate(group)
}

export { Group, validate };
