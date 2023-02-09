import express from "express"
import doorLock from "./router/doorLock"
import auth from "./router/auth"
import mongoose from "mongoose"

const mongoKey = process.env.mongoKey

const app = express()
mongoose.set("strictQuery", false)
mongoose.connect(`mongodb+srv://mezes:${mongoKey}@cluster0.sbplsjm.mongodb.net/RUST?retryWrites=true&w=majority`, { family: 4 })
// "mongodb://localhost/rustify"

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