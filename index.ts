import express from "express"
import doorLock from "./router/doorLock"
import auth from "./router/auth"
import mongoose from "mongoose"

const app = express()
mongoose.set("strictQuery", false)
mongoose.connect("mongodb://localhost/rustify", { family: 4 })

app.use(express.json())

try {
  app.use("/door-lock", doorLock)
} catch (error) {
  console.log(error)
}
app.use("/login", auth)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log("Server has been started on port " + PORT);
})