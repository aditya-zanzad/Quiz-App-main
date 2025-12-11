import dotenv from "dotenv";
import { HfInference } from "@huggingface/inference";

dotenv.config();

console.log("🔍 Hugging Face API Diagnostic Tool\n");
console.log("==================================================");

// Check if API key exists
const apiKey = process.env.HUGGINGFACE_API_KEY;
if (!apiKey) {
    console.log("❌ HUGGINGFACE_API_KEY not found in .env file!");
    console.log("\n📝 Next steps:");
    console.log("1. Go to https://huggingface.co/join");
    console.log("2. Sign up (no billing required)");
    console.log("3. Go to Settings > Access Tokens");
    console.log("4. Create a new token");
    console.log("5. Add to .env: HUGGINGFACE_API_KEY=hf_your_token_here");
    process.exit(1);
}

console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 6)}`);
console.log(`📏 API Key length: ${apiKey.length}`);
console.log("==================================================\n");

// Initialize Hugging Face client
const hf = new HfInference(apiKey);
const MODEL = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

console.log(`🚀 Testing model: ${MODEL}`);
console.log("--------------------------------------------------");

// Test the API
async function testAPI() {
    try {
        console.log("📤 Sending test prompt...");

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

        console.log("✅ SUCCESS!\n");
        console.log("📥 Response received:");
        console.log("--------------------------------------------------");
        console.log(generatedText);
        console.log("--------------------------------------------------\n");

        console.log("✅ Hugging Face API is working correctly!");
        console.log("\n🎉 Your backend is ready to generate questions!");

    } catch (error) {
        console.log("❌ FAILED!\n");
        console.log("Error type:", error.constructor.name);
        console.log("Error message:", error.message);

        if (error.stack) {
            console.log("Stack trace:", error.stack);
        }

        console.log("\n==================================================");
        console.log("📋 DIAGNOSTIC SUMMARY");
        console.log("==================================================\n");

        if (error.message && error.message.includes("401")) {
            console.log("❌ Authentication Error");
            console.log("\nPossible issues:");
            console.log("1. Invalid API key");
            console.log("2. API key has been revoked");
            console.log("\n📝 Next steps:");
            console.log("1. Go to https://huggingface.co/settings/tokens");
            console.log("2. Verify your token is active");
            console.log("3. Create a new token if needed");
            console.log("4. Update HUGGINGFACE_API_KEY in .env");
        } else if (error.message && error.message.includes("404")) {
            console.log("❌ Model Not Found");
            console.log("\nPossible issues:");
            console.log("1. Model name is incorrect");
            console.log("2. Model is not available");
            console.log("\n📝 Next steps:");
            console.log("1. Try a different model:");
            console.log("   - mistralai/Mistral-7B-Instruct-v0.2");
            console.log("   - meta-llama/Llama-2-7b-chat-hf");
            console.log("   - HuggingFaceH4/zephyr-7b-beta");
            console.log("2. Update HUGGINGFACE_MODEL in .env");
        } else if (error.message && (error.message.includes("quota") || error.message.includes("rate limit"))) {
            console.log("❌ Rate Limit Exceeded");
            console.log("\nPossible issues:");
            console.log("1. Too many requests");
            console.log("2. Daily quota exceeded");
            console.log("\n📝 Next steps:");
            console.log("1. Wait a few minutes and try again");
            console.log("2. Check your usage at https://huggingface.co/settings/tokens");
        } else {
            console.log("❌ Unknown Error");
            console.log("\n📝 Next steps:");
            console.log("1. Check your internet connection");
            console.log("2. Verify the API key is correct");
            console.log("3. Try again in a few minutes");
            console.log("4. Error details:", error.message);
        }

        console.log("\n==================================================");
        process.exit(1);
    }
}

testAPI();
