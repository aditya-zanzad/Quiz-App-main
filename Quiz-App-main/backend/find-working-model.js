import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import fs from "fs";

dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
const hf = new HfInference(apiKey);

// List of models to try (in order of preference)
const MODELS_TO_TRY = [
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
    "HuggingFaceH4/zephyr-7b-beta",
    "meta-llama/Meta-Llama-3-8B-Instruct",
    "microsoft/Phi-3-mini-4k-instruct",
    "google/gemma-7b-it",
    "tiiuae/falcon-7b-instruct"
];

console.log("🔍 Finding a working Hugging Face model...\n");

async function testModel(model) {
    try {
        console.log(`Testing: ${model}...`);

        const response = await hf.chatCompletion({
            model: model,
            messages: [{ role: "user", content: "Generate JSON: {\"test\":\"success\"}" }],
            max_tokens: 100,
            temperature: 0.7
        });

        const content = response.choices[0]?.message?.content;
        if (content) {
            console.log(`✅ SUCCESS with ${model}\n`);
            return { success: true, model, response: content };
        }
    } catch (error) {
        console.log(`❌ Failed: ${error.message.substring(0, 80)}...\n`);
        return { success: false, model, error: error.message };
    }
}

async function findWorkingModel() {
    const results = [];

    for (const model of MODELS_TO_TRY) {
        const result = await testModel(model);
        results.push(result);

        if (result.success) {
            console.log("=".repeat(60));
            console.log("✅ FOUND WORKING MODEL!");
            console.log("=".repeat(60));
            console.log(`\nModel: ${result.model}`);
            console.log(`\nAdd this to your .env file:`);
            console.log(`HUGGINGFACE_MODEL=${result.model}`);
            console.log("\n" + "=".repeat(60));

            fs.writeFileSync("working-model.txt", result.model);
            fs.writeFileSync("model-test-results.json", JSON.stringify(results, null, 2));

            return result.model;
        }
    }

    console.log("❌ None of the tested models worked.");
    console.log("\nPossible solutions:");
    console.log("1. Your Hugging Face account may need to accept model licenses");
    console.log("2. Visit https://huggingface.co/settings/tokens and check your token permissions");
    console.log("3. Try using a different AI provider (OpenAI, Anthropic, etc.)");

    fs.writeFileSync("model-test-results.json", JSON.stringify(results, null, 2));
    return null;
}

findWorkingModel();
