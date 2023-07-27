"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userLearning = exports.getUser = exports.loginUser = exports.checkMail = exports.createUser = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const node_nlp_1 = require("node-nlp");
const user_validation_1 = require("../util/user.validation");
const createUser = async (req, res) => {
    const { firstName, lastName, email, password, gender } = req.body;
    const signupData = { firstName, lastName, email, password, gender };
    const validation = user_validation_1.signupUserValidation.safeParse(signupData);
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
        const userExist = await user_model_1.default.findOne({ email });
        if (userExist) {
            return res.json({
                message: `User already exist with the given email ${email}`,
            });
        }
        //Hash the password
        const hashPassword = await bcrypt_1.default.hash(password, 12);
        const user = new user_model_1.default({
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
    }
    catch (error) {
        res.status(500).send({
            status: "error",
            path: req.url,
            message: "Something went wrong",
            error: error.message,
        });
    }
};
exports.createUser = createUser;
const checkMail = async (req, res) => {
    const { email } = req.body;
    try {
        const userExist = await user_model_1.default.findOne({ email });
        if (userExist) {
            return res.json({
                exists: true,
                message: `email already in use`,
            });
        }
        else {
            return res.json({
                exists: false,
                message: `Email is available`,
            });
        }
    }
    catch (error) {
        console.error(error);
        return res
            .status(500)
            .json({ message: "Error checking email availability" });
    }
};
exports.checkMail = checkMail;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const signupData = { email, password };
    const validation = user_validation_1.loginUserValidation.safeParse(signupData);
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
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            return res.json({ message: "Wrong credentials" });
        }
        // Check password match
        const isPasswordMatched = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordMatched) {
            return res.json({ message: "incorrect password" });
        }
        // Generate access token
        const accessToken = jsonwebtoken_1.default.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong",
            error: error.message,
        });
    }
};
exports.loginUser = loginUser;
//Creating user controller to fetch users data
const getUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "User not logged in" });
        }
        // Access user information from req.user
        res.status(200).json(`user ${req.user.email}`);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
};
exports.getUser = getUser;
const manager = new node_nlp_1.NlpManager({ languages: ["en"] });
const userLearning = async (req, res) => {
    const userInput = req.body.query; // Access query from req.body
    if (!userInput) {
        res.status(400).json({ error: "Missing query parameter." });
        return;
    }
    try {
        // Fetch learning content through web scraping
        const learningContent = await fetchLearningContentFromOpenStax(userInput);
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Something went wrong." });
    }
};
exports.userLearning = userLearning;
async function fetchLearningContentFromOpenStax(query) {
    try {
        const searchUrl = `https://openstax.org/search?q=${encodeURIComponent(query)}`;
        const response = await axios_1.default.get(searchUrl);
        const learningContent = {};
        const $ = cheerio_1.default.load(response.data);
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
    }
    catch (error) {
        console.error("Error fetching learning content from OpenStax:", error);
        return null;
    }
}
