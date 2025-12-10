import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";
import fs from "fs";

dotenv.config();

const results = {
    timestamp: new Date().toISOString(),
    steps: []
};

function log(step, status, message, details = null) {
    const entry = { step, status, message };
    if (details) entry.details = details;
    results.steps.push(entry);
    console.log(`[${status}] ${step}: ${message}`);
}

// Step 1: Check API Key
const apiKey = process.env.HUGGINGFACE_API_KEY;
if (!apiKey) {
    log("API Key Check", "FAIL", "HUGGINGFACE_API_KEY not found in .env file");
    fs.writeFileSync("diagnostic-results.json", JSON.stringify(results, null, 2));
    process.exit(1);
} else {
    log("API Key Check", "PASS", `API Key found (length: ${apiKey.length})`);
}

// Step 2: Check Model
const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
log("Model Config", "INFO", `Using model: ${MODEL}`);

// Step 3: Test API Connection
const hf = new HfInference(apiKey);

async function testAPI() {
    try {
        log("API Test", "INFO", "Sending test request to Hugging Face...");

        const testPrompt = `Generate JSON: {"questions":[{"question":"What is 2+2?","options":["3","4","5","6"],"correctAnswer":"B","difficulty":"easy"}]}`;

        const response = await hf.chatCompletion({
            model: MODEL,
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.95
        });

        const generatedText = response.choices[0]?.message?.content;
        log("API Test", "PASS", "API connection successful");
        log("Response", "INFO", "Received response from API", { preview: generatedText?.substring(0, 200) });

        // Test JSON Parsing
        try {
            let cleanText = generatedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleanText = jsonMatch[0];

            const parsed = JSON.parse(cleanText);

            if (parsed.questions && Array.isArray(parsed.questions)) {
                log("JSON Parse", "PASS", `Successfully parsed ${parsed.questions.length} question(s)`);
                results.summary = "✅ ALL TESTS PASSED - API is working correctly!";
            } else {
                log("JSON Parse", "WARN", "JSON parsed but missing 'questions' array", { parsed });
                results.summary = "⚠️ API works but response format may need adjustment";
            }
        } catch (parseError) {
            log("JSON Parse", "FAIL", `JSON parsing failed: ${parseError.message}`, { rawResponse: generatedText });
            results.summary = "⚠️ API works but returns invalid JSON";
        }

    } catch (error) {
        log("API Test", "FAIL", `API connection failed: ${error.message}`);

        // Detailed error analysis
        if (error.message?.includes("401")) {
            results.errorType = "Authentication Error";
            results.solution = "Invalid API key - create a new token at https://huggingface.co/settings/tokens";
        } else if (error.message?.includes("404")) {
            results.errorType = "Model Not Found";
            results.solution = "Try a different model in .env: HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2";
        } else if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("rate limit")) {
            results.errorType = "Rate Limit Exceeded";
            results.solution = "Wait a few minutes or upgrade your Hugging Face account";
        } else if (error.message?.includes("503")) {
            results.errorType = "Service Unavailable";
            results.solution = "Model is loading - wait 30-60 seconds and try again";
        } else {
            results.errorType = "Unknown Error";
            results.solution = "Check internet connection and API key";
        }

        results.errorDetails = {
            message: error.message,
            stack: error.stack
        };
        results.summary = `❌ FAILED - ${results.errorType}`;
    } finally {
        fs.writeFileSync("diagnostic-results.json", JSON.stringify(results, null, 2));
        console.log("\n" + results.summary);
        console.log("\nFull results saved to: diagnostic-results.json");

        if (results.summary.includes("❌")) {
            process.exit(1);
        }
    }
}

testAPI();
