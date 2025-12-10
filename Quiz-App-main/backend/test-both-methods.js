import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.3";

console.log(`Testing model: ${MODEL}\n`);

const hf = new HfInference(apiKey);

// Test 1: Try textGeneration
console.log("Test 1: textGeneration");
hf.textGeneration({
    model: MODEL,
    inputs: "Say hello in JSON format",
    parameters: {
        max_new_tokens: 100,
        return_full_text: false
    }
})
    .then(response => {
        console.log("✅ textGeneration works!");
        console.log("Response:", response.generated_text.substring(0, 100));
    })
    .catch(error => {
        console.log("❌ textGeneration failed:", error.message);
    })
    .finally(() => {
        // Test 2: Try chatCompletion
        console.log("\nTest 2: chatCompletion");
        hf.chatCompletion({
            model: MODEL,
            messages: [{ role: "user", content: "Say hello" }],
            max_tokens: 50
        })
            .then(response => {
                console.log("✅ chatCompletion works!");
                console.log("Response:", response.choices[0]?.message?.content);
            })
            .catch(error => {
                console.log("❌ chatCompletion failed:", error.message);
            });
    });
