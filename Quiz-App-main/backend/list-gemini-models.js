import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.log("No API key found");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

console.log("Fetching available Gemini models...\n");

genAI.listModels()
    .then(models => {
        console.log("Available models:");
        models.forEach(model => {
            console.log(`- ${model.name}`);
            console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
        });
    })
    .catch(error => {
        console.log("Error:", error.message);
    });
