"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const { ObjectId } = mongoose_1.default.Schema.Types;
const userSchema = new mongoose_1.default.Schema({
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
});
function validate(user) {
    const schema = joi_1.default.object({
        name: joi_1.default.string().required().min(3).max(60),
        password: joi_1.default.string().required().min(3).max(120)
    });
    return schema.validate(user);
}
exports.validate = validate;
const User = mongoose_1.default.model("User", userSchema);
exports.User = User;
