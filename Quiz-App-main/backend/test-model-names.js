import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log(`API Key: ${apiKey?.substring(0, 15)}...`);

const genAI = new GoogleGenerativeAI(apiKey);

// Try different model names
const modelsToTry = [
    "gemini-pro",
    "models/gemini-pro",
    "gemini-1.0-pro",
    "models/gemini-1.0-pro"
];

async function testModel(modelName) {
    try {
        console.log(`\nTrying: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = await result.response;
        const text = response.text();
        console.log(`✅ SUCCESS with ${modelName}`);
        console.log(`Response: ${text.substring(0, 50)}...`);
        return modelName;
    } catch (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 100)}...`);
        return null;
    }
}

async function findWorkingModel() {
    for (const model of modelsToTry) {
        const working = await testModel(model);
        if (working) {
            console.log(`\n✅ WORKING MODEL: ${working}`);
            return;
        }
    }
    console.log("\n❌ No working model found");
}

findWorkingModel();
