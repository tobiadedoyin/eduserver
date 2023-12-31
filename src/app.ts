import express, { Request, Response } from "express";
import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import router from "./routes/user.route.js";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/users", router);

mongoose
  .connect(process.env.URI)
  .then((data) => {
    console.log(`Database connected to ${data.connection.host}`);
  })
  .catch((error) => console.log(error.message));

app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ message: "starting" });
});

export default app;
