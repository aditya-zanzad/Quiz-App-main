import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import fs from "fs";

dotenv.config();

const logFile = "test-output.log";
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
};

// Clear previous log
if (fs.existsSync(logFile)) {
    fs.unlinkSync(logFile);
}

log("=== Hugging Face API Test ===");
log("");

const apiKey = process.env.HUGGINGFACE_API_KEY;
if (!apiKey) {
    log("ERROR: HUGGINGFACE_API_KEY not found in .env file!");
    process.exit(1);
}

log(`API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 6)}`);
log(`API Key length: ${apiKey.length}`);
log("");

const hf = new HfInference(apiKey);
const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

log(`Testing model: ${MODEL}`);
log("");

async function testAPI() {
    try {
        log("Sending test prompt...");

        const testPrompt = `Generate a simple JSON object with one multiple choice question about JavaScript. Format:
{
  "questions": [
    {
      "question": "What is JavaScript?",
      "options": ["A programming language", "A database", "A framework", "An OS"],
      "correctAnswer": "A",
      "difficulty": "easy"
    }
  ]
}
Only return the JSON, no other text.`;

        const response = await hf.chatCompletion({
            model: MODEL,
            messages: [
                {
                    role: "user",
                    content: testPrompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.95
        });

        const generatedText = response.choices[0]?.message?.content;

        log("SUCCESS!");
        log("");
        log("Response received:");
        log("--------------------------------------------------");
        log(generatedText);
        log("--------------------------------------------------");
        log("");
        log("Hugging Face API is working correctly!");

    } catch (error) {
        log("FAILED!");
        log("");
        log(`Error type: ${error.constructor.name}`);
        log(`Error message: ${error.message}`);
        log("");

        if (error.stack) {
            log("Stack trace:");
            log(error.stack);
        }

        process.exit(1);
    }
}

testAPI();
