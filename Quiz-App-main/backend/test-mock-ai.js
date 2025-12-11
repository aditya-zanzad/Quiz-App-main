import dotenv from "dotenv";
import { generateMCQ, generateQuestionsFromParagraph } from "./services/aiQuestionGenerator.js";

dotenv.config();

console.log("🧪 Testing Mock AI Integration\n");
console.log("=".repeat(60));

// Test 1: Generate MCQ questions
console.log("Test 1: Generating 3 MCQ questions about JavaScript...\n");

generateMCQ("JavaScript", 3, "easy")
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
        console.log("✅ Question generation is working!");
        console.log("✅ Your quiz app is ready to use!\n");

        if (!process.env.GEMINI_API_KEY) {
            console.log("ℹ️  Currently using Mock AI (no API key needed)");
            console.log("   To use real AI, add GEMINI_API_KEY to your .env file\n");
        }
    })
    .catch(error => {
        console.log("\n❌ TEST FAILED!\n");
        console.log("Error:", error.message);
        console.log("\nStack trace:");
        console.log(error.stack);
        process.exit(1);
    });
