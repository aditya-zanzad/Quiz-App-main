import dotenv from "dotenv";
import { generateQuestionsFromParagraph } from "./services/aiQuestionGenerator.js";

dotenv.config();

console.log("Testing generateQuestionsFromParagraph...\n");

const testParagraph = `JavaScript is a high-level, interpreted programming language. 
It is one of the core technologies of the World Wide Web, alongside HTML and CSS. 
JavaScript enables interactive web pages and is an essential part of web applications.`;

console.log("Test paragraph:", testParagraph);
console.log("\nGenerating 2 MCQ questions...\n");

generateQuestionsFromParagraph(testParagraph, 2, "mcq", "any")
    .then(result => {
        console.log("✅ SUCCESS!\n");
        console.log("Generated questions:");
        console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
        console.log("❌ FAILED!\n");
        console.log("Error name:", error.name);
        console.log("Error message:", error.message);
        console.log("\nFull error:");
        console.log(error);

        if (error.stack) {
            console.log("\nStack trace:");
            console.log(error.stack);
        }
    });
