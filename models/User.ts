import mongoose, { ObjectId } from "mongoose";
import Joi from "joi";
const { ObjectId } = mongoose.Schema.Types

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
    minLength: 3,
    maxLength: 60
  },
  password: {
    type: String,
    required: true,
    minLength: 3,
    maxLength: 120
  },
  notification: [
    {
      groupId: {
        type: ObjectId,
        ref: "Group"
      },
      notificationBy: {
        type: ObjectId,
        ref: "User"
      }
    }
  ]
})

function validate(user: any) {
  const schema = Joi.object({
    name: Joi.string().required().min(3).max(60),
    password: Joi.string().required().min(3).max(120)
  })

  return schema.validate(user)
}

export type UserModel = mongoose.Document & {
  // _id: ObjectId,
  name: string;
  password: string;
  // __v: number,
  notification: { id?: mongoose.Types.ObjectId | undefined }[];
}

const User = mongoose.model("User", userSchema)

export { User, validate }