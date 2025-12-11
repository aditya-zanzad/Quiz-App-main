import dotenv from "dotenv";
import { generateMCQ } from "./services/aiQuestionGenerator.js";

dotenv.config();

console.log("Testing question generation with updated model...\n");

generateMCQ("JavaScript", 2, "easy")
    .then(result => {
        console.log("✅ SUCCESS! Question generation is working!\n");
        console.log("Generated questions:");
        console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
        console.log("❌ FAILED!");
        console.log("Error:", error.message);
    });
