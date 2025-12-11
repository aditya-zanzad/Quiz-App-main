import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

console.log("Testing Hugging Face API...\n");

const apiKey = process.env.HUGGINGFACE_API_KEY;
if (!apiKey) {
    console.log("ERROR: No API key found!");
    process.exit(1);
}

console.log(`API Key: ${apiKey.substring(0, 15)}...`);

const hf = new HfInference(apiKey);
const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

console.log(`Model: ${MODEL}\n`);
console.log("Sending request...\n");

hf.chatCompletion({
    model: MODEL,
    messages: [{ role: "user", content: "Say hello" }],
    max_tokens: 50
})
    .then(response => {
        console.log("SUCCESS!");
        console.log("Response:", response.choices[0]?.message?.content);
    })
    .catch(error => {
        console.log("FAILED!");
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("\nFull error object:");
        console.log(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    });
