import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

// Only throw error in production, allow tests to run without API key
if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== "test") {
    throw new Error("🚫 GEMINI_API_KEY is missing from .env file!");
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const generateFromGemini = async (prompt) => {
    if (!genAI) {
        // In test environment, return mock response
        if (process.env.NODE_ENV === "test") {
            return JSON.stringify({
                questions: [
                    {
                        question: "What is JavaScript?",
                        options: ["A programming language", "A database", "A framework", "An operating system"],
                        correctAnswer: "A",
                        difficulty: "medium",
                        category: "Programming"
                    }
                ]
            });
        }
        throw new Error("Gemini AI not initialized - API key missing");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent({
        contents: [{ parts: [{ text: prompt }] }]
    });

    const raw = result.response.text();
    return raw;
};

export const parseAIResponse = (aiText) => {
    try {
        const cleanText = aiText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1").trim();
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("AI returned invalid JSON: " + e.message);
    }
};

export const generateMCQ = async (topic, numQuestions, difficulty = "any") => {
    const difficultyInstruction =
    difficulty === "any"
      ? ""
      : `All questions generated MUST have a difficulty level of "${difficulty}".`;

    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality multiple-choice questions about "${topic}".
        ${difficultyInstruction}
        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        The JSON object must have a single key "questions", which contains an array of question objects. Each question object must have the following exact structure and keys:
        - "question": A string containing the question text.
        - "options": An array of exactly 4 strings representing the possible answers.
        - "correctAnswer": A string with the letter corresponding to the correct option ("A", "B", "C", or "D"). The first option is "A", the second is "B", and so on.
        - "difficulty": A string that is one of "easy", "medium", or "hard".
        Here is an example of the required output format:
        Output format:
        {
        "questions": [
            {
            "question": "What is 2 + 2?",
            "options": ["3", "4", "5", "6"],
            "correctAnswer": "B",
            "difficulty": "easy"
            }
        ]
        }
        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    return parseAIResponse(aiText);
};

export const generateTrueFalse = async (topic, numQuestions) => {
    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality true/false questions about "${topic}".

        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        The JSON object must have a single key "questions", which contains an array of question objects. Each question object must have the following exact structure and keys:
        - "question": A string containing the question text.
        - "correctAnswer": A boolean value (true or false).
        - "difficulty": A string that is one of "easy", "medium", or "hard".
        Here is an example of the required output format:
        Output format:
        {
        "questions": [
            {
            "question": "The sky is blue.",
            "correctAnswer": true,
            "difficulty": "easy"
            }
        ]
        }
        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    return parseAIResponse(aiText);
};

// ✅ Generate questions from paragraph text
export const generateQuestionsFromParagraph = async (paragraph, numQuestions, questionType = "mcq", difficulty = "any") => {
    const difficultyInstruction = difficulty === "any" ? "" : `All questions generated MUST have a difficulty level of "${difficulty}".`;
    
    const questionTypeInstruction = questionType === "mcq" 
        ? `Generate multiple-choice questions with 4 options each. Each question object must have:
           - "question": A string containing the question text
           - "options": An array of exactly 4 strings representing the possible answers
           - "correctAnswer": A string with the letter corresponding to the correct option ("A", "B", "C", or "D")
           - "difficulty": A string that is one of "easy", "medium", or "hard"`
        : `Generate true/false questions. Each question object must have:
           - "question": A string containing the question text
           - "correctAnswer": A boolean value (true or false)
           - "difficulty": A string that is one of "easy", "medium", or "hard"`;

    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality ${questionType === "mcq" ? "multiple-choice" : "true/false"} questions based on the following paragraph:

        PARAGRAPH:
        "${paragraph}"

        ${difficultyInstruction}

        Instructions:
        1. Create questions that test comprehension, analysis, and understanding of the paragraph content
        2. Questions should cover different aspects of the text (main ideas, details, implications, etc.)
        3. Make sure questions are directly answerable from the paragraph content
        4. Vary the difficulty levels appropriately
        5. For multiple-choice questions, make sure all options are plausible but only one is correct

        ${questionTypeInstruction}

        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        ${questionType === "mcq" ? `
        Output format:
        {
        "questions": [
            {
            "question": "What is the main topic discussed in the paragraph?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "difficulty": "medium"
            }
        ]
        }` : `
        Output format:
        {
        "questions": [
            {
            "question": "The paragraph states that...",
            "correctAnswer": true,
            "difficulty": "easy"
            }
        ]
        }`}

        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    return parseAIResponse(aiText);
};
