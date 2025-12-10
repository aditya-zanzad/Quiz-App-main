import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log(`Using API Key: ${apiKey?.substring(0, 5)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testFlash() {
    try {
        console.log("Testing with gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("✅ Custom test SUCCESS!");
        console.log(response.text());
    } catch (error) {
        console.log("❌ Custom test FAILED!");
        console.log(error.message);
    }
}

testFlash();
