"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        set: (value) => value.toLowerCase(),
    },
    gender: {
        type: String,
        required: true,
        enum: ["male", "female", "others"],
    },
    password: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    token: {
        type: String,
    },
}, {
    timestamps: true,
});
const UserModel = mongoose_1.default.model("user", userSchema);
exports.default = UserModel;
