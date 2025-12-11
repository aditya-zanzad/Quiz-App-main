import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

console.log("\n=== HUGGING FACE API DIAGNOSTIC ===\n");

// Step 1: Check API Key
const apiKey = process.env.HUGGINGFACE_API_KEY;
console.log("1. API Key Check:");
if (!apiKey) {
    console.log("   ❌ HUGGINGFACE_API_KEY not found in .env file!");
    console.log("\n   To fix:");
    console.log("   1. Go to https://huggingface.co/settings/tokens");
    console.log("   2. Create a new token");
    console.log("   3. Add to .env: HUGGINGFACE_API_KEY=hf_your_token_here\n");
    process.exit(1);
} else {
    console.log(`   ✅ API Key found`);
    console.log(`   Key preview: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 6)}`);
    console.log(`   Key length: ${apiKey.length} characters\n`);
}

// Step 2: Check Model
const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
console.log("2. Model Configuration:");
console.log(`   Model: ${MODEL}\n`);

// Step 3: Test API Connection
console.log("3. Testing API Connection:");
const hf = new HfInference(apiKey);

async function testAPI() {
    try {
        console.log("   Sending test request...");

        const testPrompt = `Generate a simple JSON object with one multiple choice question about JavaScript. 
Format:
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

        console.log("   ✅ API Connection Successful!\n");
        console.log("4. Response Preview:");
        console.log("   " + "-".repeat(60));
        console.log("   " + (generatedText || "No content").substring(0, 200));
        console.log("   " + "-".repeat(60) + "\n");

        // Step 4: Test JSON Parsing
        console.log("5. Testing JSON Parsing:");
        try {
            let cleanText = generatedText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanText = jsonMatch[0];
            }
            const parsed = JSON.parse(cleanText);

            if (parsed.questions && Array.isArray(parsed.questions)) {
                console.log(`   ✅ JSON parsing successful!`);
                console.log(`   ✅ Found ${parsed.questions.length} question(s)\n`);
            } else {
                console.log(`   ⚠️  JSON parsed but missing 'questions' array\n`);
            }
        } catch (parseError) {
            console.log(`   ❌ JSON parsing failed: ${parseError.message}\n`);
        }

        console.log("=== DIAGNOSTIC COMPLETE ===");
        console.log("✅ Your Hugging Face API is configured correctly!");
        console.log("✅ Question generation should work now.\n");

    } catch (error) {
        console.log("   ❌ API Connection Failed!\n");
        console.log("4. Error Details:");
        console.log(`   Error Type: ${error.constructor.name}`);
        console.log(`   Error Message: ${error.message}\n`);

        console.log("5. Troubleshooting:");

        if (error.message && error.message.includes("401")) {
            console.log("   ❌ Authentication Error (401)");
            console.log("   Possible causes:");
            console.log("   - Invalid API key");
            console.log("   - API key has been revoked");
            console.log("\n   Solutions:");
            console.log("   1. Go to https://huggingface.co/settings/tokens");
            console.log("   2. Verify your token is active");
            console.log("   3. Create a new token if needed");
            console.log("   4. Update HUGGINGFACE_API_KEY in .env file\n");
        } else if (error.message && error.message.includes("404")) {
            console.log("   ❌ Model Not Found (404)");
            console.log("   Possible causes:");
            console.log("   - Model name is incorrect");
            console.log("   - Model is not available");
            console.log("\n   Solutions:");
            console.log("   Try a different model in your .env file:");
            console.log("   HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2");
            console.log("   HUGGINGFACE_MODEL=meta-llama/Llama-2-7b-chat-hf");
            console.log("   HUGGINGFACE_MODEL=HuggingFaceH4/zephyr-7b-beta\n");
        } else if (error.message && (error.message.includes("quota") || error.message.includes("rate limit") || error.message.includes("429"))) {
            console.log("   ❌ Rate Limit Exceeded (429)");
            console.log("   Possible causes:");
            console.log("   - Too many requests");
            console.log("   - Daily quota exceeded");
            console.log("\n   Solutions:");
            console.log("   1. Wait a few minutes and try again");
            console.log("   2. Check your usage at https://huggingface.co/settings/tokens");
            console.log("   3. Consider upgrading your Hugging Face account\n");
        } else if (error.message && error.message.includes("503")) {
            console.log("   ❌ Service Unavailable (503)");
            console.log("   Possible causes:");
            console.log("   - Model is loading");
            console.log("   - Hugging Face service is down");
            console.log("\n   Solutions:");
            console.log("   1. Wait 30-60 seconds and try again");
            console.log("   2. The model may be 'cold starting' - retry in a minute\n");
        } else {
            console.log("   ❌ Unknown Error");
            console.log("\n   Solutions:");
            console.log("   1. Check your internet connection");
            console.log("   2. Verify the API key is correct");
            console.log("   3. Try again in a few minutes");
            console.log(`   4. Full error: ${error.message}\n`);
        }

        if (error.stack) {
            console.log("6. Stack Trace:");
            console.log(error.stack.split('\n').map(line => '   ' + line).join('\n'));
        }

        console.log("\n=== DIAGNOSTIC COMPLETE ===");
        process.exit(1);
    }
}

testAPI();
