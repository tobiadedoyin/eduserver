"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = async (req, res, next) => {
    const accessToken = req.cookies["accesstoken"];
    if (!accessToken) {
        return res.status(400).json("user not logged in");
    }
    try {
        const access = jsonwebtoken_1.default.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = { email: access.email };
        if (access) {
            return next();
        }
    }
    catch (error) {
        return res
            .status(500)
            .json({ error: error.message, message: "token invalid" });
    }
};
exports.default = isAuthenticated;
