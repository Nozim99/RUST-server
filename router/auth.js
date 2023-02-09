"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_KEY;
router.get('/', (req, res) => {
    return res.json({ message: `JWT_SECRET: ${JWT_SECRET}` });
});
// SIGNUP
router.post("/signup", (req, res) => {
    const { name, password } = req.body;
    if (!name)
        return res.status(401).json({ error: "Must enter a name" });
    if (!password)
        return res.status(401).json({ error: "Must enter a password" });
    const { error } = (0, User_1.validate)(req.body);
    if (error)
        return res.status(401).json({ error: error.details[0].message });
    User_1.User.findOne({ name: { $regex: name, $options: 'i' } })
        .then(saveUser => {
        if (saveUser)
            return res.status(401).json({ error: "This username already exists" });
        // password hashing
        bcrypt_1.default.hash(password, 10)
            .then(hashPas => {
            const user = new User_1.User({
                name,
                password: hashPas
            });
            user.save()
                .then(user => {
                if (JWT_SECRET) {
                    const token = jsonwebtoken_1.default.sign({ _id: user._id }, JWT_SECRET);
                    res.json({ token, name });
                }
                else {
                    throw new Error("JWT key is not defined");
                }
            })
                .catch(err => {
                throw new Error(err);
            });
        });
    });
});
// SIGNIN
router.post("/signin", (req, res) => {
    const { name, password } = req.body;
    if (!name)
        return res.status(401).json({ error: "Must enter a name" });
    if (!password)
        return res.status(401).json({ error: "Must enter a password" });
    User_1.User.findOne({ name: { $regex: name, $options: "i" } })
        .then(user => {
        if (!JWT_SECRET)
            return res.status(500).json({ error: "Server error. Try later" });
        if (!user)
            return res.status(401).json({ error: "Name is wrong!" });
        bcrypt_1.default.compare(password, user.password)
            .then(doMatch => {
            if (!doMatch)
                return res.status(401).json({ error: "Password is wrong?" });
            const token = jsonwebtoken_1.default.sign({ _id: user._id }, JWT_SECRET);
            res.json({ token, name: user.name });
        });
    })
        .catch(err => {
        throw new Error(err);
    });
});
exports.default = router;
