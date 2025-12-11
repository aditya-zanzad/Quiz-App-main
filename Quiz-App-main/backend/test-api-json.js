import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import fs from "fs";

dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
const MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

const hf = new HfInference(apiKey);

hf.chatCompletion({
    model: MODEL,
    messages: [{ role: "user", content: "Say hello" }],
    max_tokens: 50
})
    .then(response => {
        const result = {
            status: "SUCCESS",
            response: response.choices[0]?.message?.content
        };
        fs.writeFileSync("test-result.json", JSON.stringify(result, null, 2));
        console.log("SUCCESS - check test-result.json");
    })
    .catch(error => {
        const result = {
            status: "FAILED",
            errorName: error.name,
            errorMessage: error.message,
            statusCode: error.statusCode || error.status || "unknown",
            httpResponse: error.httpResponse || {},
            cause: error.cause?.message || null
        };
        fs.writeFileSync("test-result.json", JSON.stringify(result, null, 2));
        console.log("FAILED - check test-result.json");
        console.log("Error:", error.message);
    });
