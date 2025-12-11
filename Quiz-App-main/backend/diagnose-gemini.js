import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log(`API Key: ${apiKey?.substring(0, 20)}...`);
console.log(`API Key length: ${apiKey?.length}\n`);

const genAI = new GoogleGenerativeAI(apiKey);

async function testAPI() {
    try {
        console.log("Testing with gemini-pro...\n");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log("✅ SUCCESS!");
        console.log(`Response: ${text}`);
    } catch (error) {
        console.log("❌ FAILED!\n");
        console.log("Full error message:");
        console.log(error.message);
        console.log("\nError details:");
        console.log(JSON.stringify(error, null, 2));

        console.log("\n" + "=".repeat(70));
        console.log("TROUBLESHOOTING:");
        console.log("=".repeat(70));

        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
            console.log("\n❌ Your API key is invalid");
            console.log("\nSolutions:");
            console.log("1. Go to https://aistudio.google.com/app/apikey");
            console.log("2. Create a NEW API key");
            console.log("3. Make sure you copy the ENTIRE key");
            console.log("4. Update your .env file with the new key");
        } else if (error.message.includes("404") || error.message.includes("not found")) {
            console.log("\n❌ Model not found or API not enabled");
            console.log("\nSolutions:");
            console.log("1. Go to https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
            console.log("2. Make sure 'Generative Language API' is ENABLED");
            console.log("3. Wait a few minutes for it to activate");
            console.log("4. Try again");
        } else if (error.message.includes("403") || error.message.includes("permission")) {
            console.log("\n❌ Permission denied");
            console.log("\nSolutions:");
            console.log("1. Your API key might not have the right permissions");
            console.log("2. Create a new API key at https://aistudio.google.com/app/apikey");
            console.log("3. Make sure you're using a Google Cloud project with billing enabled");
        } else {
            console.log("\n❌ Unknown error");
            console.log("\nGeneral solutions:");
            console.log("1. Check your internet connection");
            console.log("2. Verify your API key at https://aistudio.google.com/app/apikey");
            console.log("3. Make sure the Generative Language API is enabled");
            console.log("4. Try creating a new API key");
        }

        console.log("\n" + "=".repeat(70));
    }
}

testAPI();
