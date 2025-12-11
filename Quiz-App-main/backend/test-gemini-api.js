import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

console.log("🔍 Gemini API Diagnostic Tool\n");
console.log("=".repeat(50));

// Check if API key exists
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ GEMINI_API_KEY not found in .env file!");
    process.exit(1);
}

console.log("✅ API Key found:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 5));
console.log("📏 API Key length:", apiKey.length);
console.log("=".repeat(50));

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(apiKey);

// Test different models
const modelsToTest = [
    "gemini-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-1.0-pro"
];

async function testModel(modelName) {
    console.log(`\n🧪 Testing model: ${modelName}`);
    console.log("-".repeat(50));

    try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = "Generate a simple JSON object with one quiz question about JavaScript. Format: {\"question\": \"What is JavaScript?\", \"answer\": \"A programming language\"}";

        console.log("📤 Sending test prompt...");
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("✅ SUCCESS! Model is working.");
        console.log("📥 Response preview:", text.substring(0, 100) + "...");
        console.log("📊 Response length:", text.length, "characters");

        return { success: true, model: modelName, response: text };
    } catch (error) {
        console.error("❌ FAILED!");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);

        if (error.response) {
            console.error("Response status:", error.response.status);
            console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        }

        if (error.stack) {
            console.error("Stack trace:", error.stack.split('\n').slice(0, 3).join('\n'));
        }

        return { success: false, model: modelName, error: error.message };
    }
}

async function runDiagnostics() {
    console.log("\n🚀 Starting diagnostics...\n");

    const results = [];

    for (const modelName of modelsToTest) {
        const result = await testModel(modelName);
        results.push(result);

        // If we found a working model, we can stop
        if (result.success) {
            console.log("\n" + "=".repeat(50));
            console.log("🎉 FOUND WORKING MODEL:", modelName);
            console.log("=".repeat(50));
            break;
        }

        // Wait a bit between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Summary
    console.log("\n\n📋 DIAGNOSTIC SUMMARY");
    console.log("=".repeat(50));

    const workingModels = results.filter(r => r.success);
    const failedModels = results.filter(r => !r.success);

    if (workingModels.length > 0) {
        console.log("✅ Working models:");
        workingModels.forEach(m => console.log(`   - ${m.model}`));
    }

    if (failedModels.length > 0) {
        console.log("\n❌ Failed models:");
        failedModels.forEach(m => console.log(`   - ${m.model}: ${m.error}`));
    }

    if (workingModels.length === 0) {
        console.log("\n⚠️  NO WORKING MODELS FOUND!");
        console.log("\nPossible issues:");
        console.log("1. API key is invalid or expired");
        console.log("2. API key doesn't have Gemini API enabled");
        console.log("3. Billing is not set up for the project");
        console.log("4. API quota has been exceeded");
        console.log("5. Geographic restrictions apply");
        console.log("\n📝 Next steps:");
        console.log("1. Go to https://aistudio.google.com/app/apikey");
        console.log("2. Verify your API key is active");
        console.log("3. Check https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com");
        console.log("4. Ensure Gemini API is enabled for your project");
        console.log("5. Check billing at https://console.cloud.google.com/billing");
    } else {
        console.log("\n✅ RECOMMENDATION:");
        console.log(`Update your code to use: ${workingModels[0].model}`);
    }

    console.log("=".repeat(50));
}

runDiagnostics().catch(error => {
    console.error("\n💥 Fatal error during diagnostics:", error);
    process.exit(1);
});
