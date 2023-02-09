"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.Group = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const joi_1 = __importDefault(require("joi"));
const { Schema } = mongoose_1.default;
const { ObjectId } = Schema.Types;
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
});
const Group = mongoose_1.default.model("Group", groupSchema);
exports.Group = Group;
const validate = (group) => {
    const schema = joi_1.default.object({
        name: joi_1.default.string().required().min(3).max(60)
    });
    return schema.validate(group);
};
exports.validate = validate;
