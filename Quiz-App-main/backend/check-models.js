import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("No API Key found in .env");
    process.exit(1);
}

async function listModels() {
    try {
        console.log("Fetching available models...");
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);

        const models = response.data.models;
        console.log(`Found ${models.length} models.`);

        console.log("\nAvailable GenerateContent Models:");
        models.forEach(model => {
            if (model.supportedGenerationMethods.includes("generateContent")) {
                console.log(`- ${model.name} (${model.displayName})`);
            }
        });

    } catch (error) {
        console.error("Error listing models:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

listModels();
