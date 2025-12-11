import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test20() {
    try {
        console.log("Testing with gemini-2.0-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Hello 2.0");
        const response = await result.response;
        console.log("✅ Custom test SUCCESS!");
        console.log(response.text());
    } catch (error) {
        console.log("❌ Custom test FAILED!");
        console.log(error.message);
    }
}

test20();
