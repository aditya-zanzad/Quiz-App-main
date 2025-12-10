import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const models = response.data.models;
        const names = models.map(m => m.name);
        fs.writeFileSync('available_models.json', JSON.stringify(names, null, 2));
        console.log("Saved models to available_models.json");
    } catch (error) {
        console.error(error);
    }
}

listModels();
