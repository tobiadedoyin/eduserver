import express from "express";
import {
  createUser,
  loginUser,
  getUser,
  checkMail,
} from "../controller/user.controller";
import isAuthenticated from "../middleware/user.authentication";

const router = express.Router();

router.post("/signup", createUser);
router.post("/checkEmail", checkMail);
router.post("/login", loginUser);
router.get("/getUser", isAuthenticated, getUser);

export default router;
