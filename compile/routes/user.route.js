"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controller/user.controller");
const user_authentication_1 = __importDefault(require("../middleware/user.authentication"));
const router = express_1.default.Router();
router.post("/signup", user_controller_1.createUser);
router.post("/checkEmail", user_controller_1.checkMail);
router.post("/login", user_controller_1.loginUser);
router.post("/learn", user_controller_1.userLearning);
router.get("/getUser", user_authentication_1.default, user_controller_1.getUser);
exports.default = router;
