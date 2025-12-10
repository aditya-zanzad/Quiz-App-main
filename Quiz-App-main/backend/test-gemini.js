import dotenv from "dotenv";
import { generateMCQ, generateQuestionsFromParagraph } from "./services/aiQuestionGenerator.js";

dotenv.config();

console.log("🧪 Testing Gemini AI Integration\n");
console.log("=".repeat(60));

// Check API key
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.log("❌ GEMINI_API_KEY not found in .env file!\n");
    console.log("Please follow the instructions in GEMINI_SETUP.md");
    console.log("Get your API key at: https://makersuite.google.com/app/apikey\n");
    process.exit(1);
}

console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
console.log(`✅ Model: ${process.env.GEMINI_MODEL || "gemini-1.5-flash"}`);
console.log("=".repeat(60) + "\n");

// Test 1: Generate MCQ questions
console.log("Test 1: Generating 2 MCQ questions about JavaScript...\n");

generateMCQ("JavaScript", 2, "easy")
    .then(result => {
        console.log("✅ MCQ Generation SUCCESS!\n");
        console.log("Generated questions:");
        console.log(JSON.stringify(result, null, 2));
        console.log("\n" + "=".repeat(60) + "\n");

        // Test 2: Generate questions from paragraph
        console.log("Test 2: Generating questions from paragraph...\n");

        const testParagraph = `JavaScript is a high-level, interpreted programming language. 
It is one of the core technologies of the World Wide Web, alongside HTML and CSS. 
JavaScript enables interactive web pages and is an essential part of web applications.`;

        return generateQuestionsFromParagraph(testParagraph, 2, "mcq", "any");
    })
    .then(result => {
        console.log("✅ Paragraph Question Generation SUCCESS!\n");
        console.log("Generated questions:");
        console.log(JSON.stringify(result, null, 2));
        console.log("\n" + "=".repeat(60));
        console.log("\n🎉 ALL TESTS PASSED!");
        console.log("✅ Gemini AI is working correctly!");
        console.log("✅ Your quiz app is ready to generate questions!\n");
    })
    .catch(error => {
        console.log("\n❌ TEST FAILED!\n");
        console.log("Error:", error.message);
        console.log("\nTroubleshooting:");

        if (error.message.includes("API key")) {
            console.log("- Check your GEMINI_API_KEY in .env file");
            console.log("- Get a new key at: https://makersuite.google.com/app/apikey");
        } else if (error.message.includes("quota")) {
            console.log("- You may have hit the rate limit (60 requests/min)");
            console.log("- Wait a minute and try again");
        } else {
            console.log("- Check your internet connection");
            console.log("- Verify your API key is active");
            console.log("- See GEMINI_SETUP.md for more help");
        }
        console.log();
        process.exit(1);
    });
