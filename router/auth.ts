import { Router } from "express";
import { User, validate } from "../models/User";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

const router = Router()
const JWT_SECRET = process.env.JWT_KEY

interface userBody {
  name: string,
  password: string
}

router.get('/', (req, res) => {
  return res.json({ message: `JWT_SECRET: ${JWT_SECRET}` })
})

// SIGNUP
router.post("/signup", (req, res) => {
  const { name, password }: userBody = req.body

  if (!name) return res.status(401).json({ error: "Must enter a name" })
  if (!password) return res.status(401).json({ error: "Must enter a password" })

  const { error } = validate(req.body)
  if (error) return res.status(401).json({ error: error.details[0].message })

  User.findOne({ name: { $regex: name, $options: 'i' } })
    .then(saveUser => {
      if (saveUser) return res.status(401).json({ error: "This username already exists" })

      // password hashing
      bcrypt.hash(password, 10)
        .then(hashPas => {
          const user = new User({
            name,
            password: hashPas
          })
          user.save()
            .then(user => {
              if (JWT_SECRET) {
                const token = jwt.sign({ _id: user._id }, JWT_SECRET)
                res.json({ token, name })
              } else {
                throw new Error("JWT key is not defined")
              }
            })
            .catch(err => {
              throw new Error(err)
            })
        })
    })
})

// SIGNIN
router.post("/signin", (req, res) => {
  const { name, password }: userBody = req.body;
  if (!name) return res.status(401).json({ error: "Must enter a name" })
  if (!password) return res.status(401).json({ error: "Must enter a password" })

  User.findOne({ name: { $regex: name, $options: "i" } })
    .then(user => {
      if (!JWT_SECRET) return res.status(500).json({ error: "Server error. Try later" })
      if (!user) return res.status(401).json({ error: "Name is wrong!" })

      bcrypt.compare(password, user.password)
        .then(doMatch => {
          if (!doMatch) return res.status(401).json({ error: "Password is wrong?" })

          const token = jwt.sign({ _id: user._id }, JWT_SECRET)
          res.json({ token, name: user.name })
        })
    })
    .catch(err => {
      throw new Error(err)
    })
})

export default router