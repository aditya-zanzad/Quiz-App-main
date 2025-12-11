import dotenv from "dotenv";

dotenv.config();

console.log("Current Environment Configuration:");
console.log("==================================");
console.log(`HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? 'SET (length: ' + process.env.HUGGINGFACE_API_KEY.length + ')' : 'NOT SET'}`);
console.log(`HUGGINGFACE_MODEL: ${process.env.HUGGINGFACE_MODEL || 'NOT SET (will use default)'}`);
console.log("==================================");
