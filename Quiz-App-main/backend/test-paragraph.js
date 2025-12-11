import dotenv from "dotenv";
import { generateQuestionsFromParagraph } from "./services/aiQuestionGenerator.js";
import fs from "fs";

dotenv.config();

const testParagraph = `JavaScript is a high-level, interpreted programming language. 
It is one of the core technologies of the World Wide Web, alongside HTML and CSS. 
JavaScript enables interactive web pages and is an essential part of web applications.`;

console.log("Testing question generation from paragraph...");

generateQuestionsFromParagraph(testParagraph, 2, "mcq", "any")
    .then(result => {
        const output = {
            status: "SUCCESS",
            result: result
        };
        fs.writeFileSync("test-paragraph-result.json", JSON.stringify(output, null, 2));
        console.log("✅ SUCCESS - check test-paragraph-result.json");
    })
    .catch(error => {
        const output = {
            status: "FAILED",
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack
        };
        fs.writeFileSync("test-paragraph-result.json", JSON.stringify(output, null, 2));
        console.log("❌ FAILED - check test-paragraph-result.json");
        console.log("Error:", error.message);
    });
