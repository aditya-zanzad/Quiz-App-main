import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import fs from "fs";

dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(apiKey);

// Models known to work with free Hugging Face Inference API
const WORKING_MODELS = [
    "HuggingFaceH4/zephyr-7b-beta",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
    "microsoft/Phi-3-mini-4k-instruct",
    "google/gemma-2b-it",
    "tiiuae/falcon-7b-instruct",
    "bigscience/bloom-560m"
];

console.log("🔍 Testing models with textGeneration API...\n");

async function testModel(model) {
    try {
        console.log(`Testing: ${model}...`);

        const response = await hf.textGeneration({
            model: model,
            inputs: "Generate a JSON object with a test question.",
            parameters: {
                max_new_tokens: 200,
                temperature: 0.7,
                return_full_text: false
            }
        });

        if (response.generated_text) {
            console.log(`✅ SUCCESS!\n`);
            return { success: true, model, sample: response.generated_text.substring(0, 100) };
        }
    } catch (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 60)}...\n`);
        return { success: false, model, error: error.message };
    }
}

async function findBestModel() {
    const results = [];

    for (const model of WORKING_MODELS) {
        const result = await testModel(model);
        results.push(result);

        if (result.success) {
            console.log("=".repeat(70));
            console.log("✅ FOUND WORKING MODEL!");
            console.log("=".repeat(70));
            console.log(`\nModel: ${result.model}`);
            console.log(`Sample output: ${result.sample}`);
            console.log(`\n📝 UPDATE YOUR .env FILE:`);
            console.log(`HUGGINGFACE_MODEL=${result.model}`);
            console.log("\n" + "=".repeat(70) + "\n");

            fs.writeFileSync("recommended-model.txt", result.model);
            fs.writeFileSync("all-model-results.json", JSON.stringify(results, null, 2));

            return result.model;
        }
    }

    console.log("❌ None of the tested models worked.\n");
    console.log("This might mean:");
    console.log("1. Your API key doesn't have proper permissions");
    console.log("2. You need to accept model licenses on Hugging Face");
    console.log("3. The free tier has limitations\n");
    console.log("Visit: https://huggingface.co/settings/tokens\n");

    fs.writeFileSync("all-model-results.json", JSON.stringify(results, null, 2));
    return null;
}

findBestModel();
