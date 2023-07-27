import { Request, Response } from "express";
import UserModel from "../model/user.model";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import cheerio from "cheerio";
import { NlpManager } from "node-nlp";
import {
  signupUserValidation,
  loginUserValidation,
} from "../util/user.validation";

interface AuthenticatedRequest extends Request {
  user?: { email: string };
}

export const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, gender } = req.body;
  const signupData = { firstName, lastName, email, password, gender };
  const validation: any = signupUserValidation.safeParse(signupData);
  try {
    //Check emptyness of the incoming data
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        path: req.url,
        message: validation.error.issues[0].message,
      });
    }

    //Check if the user already exist or not
    const userExist = await UserModel.findOne({ email });
    if (userExist) {
      return res.json({
        message: `User already exist with the given email ${email}`,
      });
    }

    //Hash the password
    const hashPassword = await bcrypt.hash(password, 12);
    const user = new UserModel({
      firstName,
      lastName,
      email,
      password: hashPassword,
      gender,
    });
    await user.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      path: req.url,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export const checkMail = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const userExist = await UserModel.findOne({ email });
    if (userExist) {
      return res.json({
        exists: true,
        message: `email already in use`,
      });
    } else {
      return res.json({
        exists: false,
        message: `Email is available`,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Error checking email availability" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const signupData = { email, password };
  const validation: any = loginUserValidation.safeParse(signupData);

  try {
    // Check if there are validation errors
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        path: req.url,
        message: validation.error.issues[0].message,
      });
    }

    // Check if the user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.json({ message: "Wrong credentials" });
    }

    // Check password match
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.json({ message: "incorrect password" });
    }

    // Generate access token
    const accessToken = jwt.sign(
      { email: user.email },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "24h" }
    );

    // Set the access token as a cookie
    res.cookie("accesstoken", accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: true,
      sameSite: "strict",
    });
    user.isVerified = true;

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      accessToken,
      user,
    });

    //return res.json({ success: true, message: "Logged in successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//Creating user controller to fetch users data
export const getUser = async (req: Request, res: Response) => {
  try {
    if (!(req as AuthenticatedRequest).user) {
      return res.status(401).json({ message: "User not logged in" });
    }
    // Access user information from req.user
    res.status(200).json(`user ${(req as AuthenticatedRequest).user.email}`);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const manager = new NlpManager({ languages: ["en"] });

export const userLearning = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userInput: string = req.body.query; // Access query from req.body
  if (!userInput) {
    res.status(400).json({ error: "Missing query parameter." });
    return;
  }

  try {
    // Fetch learning content through web scraping
    const learningContent: LearningContent | null =
      await fetchLearningContentFromOpenStax(userInput);
    if (!learningContent || Object.keys(learningContent).length === 0) {
      res.json({ answer: ["I couldn't find any information on that topic."] });
      return;
    }

    // Get the AI-guided answer for the user query
    const response = await manager.process("en", userInput);
    response.answer = response.answer || [];

    // If the model couldn't match the query to any specific topic, provide a fallback response
    if (response.intent === "None") {
      response.answer.push("I couldn't find any information on that topic.");
    }

    res.json({ answer: response.answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
};

interface LearningContent {
  [topic: string]: string;
}

async function fetchLearningContentFromOpenStax(
  query: string
): Promise<LearningContent | null> {
  try {
    const searchUrl = `https://openstax.org/search?q=${encodeURIComponent(
      query
    )}`;
    const response = await axios.get(searchUrl);

    const learningContent: LearningContent = {};
    const $ = cheerio.load(response.data);

    // Example: Extract the title and description of the first search result
    const firstSearchResult = $("a.result-link").first();
    const title = firstSearchResult.text().trim();
    const description = firstSearchResult
      .find("p.result-description")
      .text()
      .trim();
    learningContent[title] = description;

    // Train the NLP manager with the fetched learning content
    Object.keys(learningContent).forEach((topic) => {
      manager.addDocument("en", `Tell me about ${topic}`, topic);
      manager.addAnswer("en", topic, learningContent[topic]);
    });

    // Train the NLP manager
    await manager.train();
    manager.save();
    console.log("Model trained and saved");

    return learningContent;
  } catch (error) {
    console.error("Error fetching learning content from OpenStax:", error);
    return null;
  }
}
