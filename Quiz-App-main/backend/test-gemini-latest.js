import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testLatest() {
    try {
        console.log("Testing with gemini-flash-latest...");
        // This alias usually points to the current stable Flash version (likely 1.5)
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello, are you available?");
        const response = await result.response;
        console.log("✅ Custom test SUCCESS!");
        console.log(response.text());
    } catch (error) {
        console.log("❌ Custom test FAILED!");
        console.log(`Error with gemini-flash-latest: ${error.message}`);
    }
}

testLatest();
