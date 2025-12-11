import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export const generateFromGemini = async (prompt) => {
    if (!genAI) {
        throw new Error("Gemini API not initialized - API key missing. Add GEMINI_API_KEY to your .env file");
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error("Gemini AI returned empty response");
        }

        return text;
    } catch (error) {
        console.error("Gemini API Error:", error.message);

        if (error.message && error.message.includes("API_KEY")) {
            throw new Error("Invalid Gemini API key. Get one at https://makersuite.google.com/app/apikey");
        } else if (error.message && error.message.includes("quota")) {
            throw new Error("Gemini API quota exceeded. Please try again later.");
        }

        throw new Error(`Gemini API Error: ${error.message || "Unknown error occurred"}`);
    }
};

export const parseAIResponse = (aiText) => {
    try {
        if (!aiText || typeof aiText !== 'string') {
            throw new Error("AI returned empty or invalid response");
        }

        // Remove markdown code blocks if present
        let cleanText = aiText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();

        // Try to extract JSON if wrapped in text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanText = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanText);

        // Validate the structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error("AI response missing 'questions' array");
        }

        return parsed;
    } catch (e) {
        console.error("Parse Error - Raw AI Response:", aiText);
        throw new Error(`AI returned invalid JSON: ${e.message}. Raw response: ${aiText.substring(0, 200)}...`);
    }
};

// Export all the same functions but using Gemini
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
    const parsed = parseAIResponse(aiText);

    // Add questionType to each question (MCQ)
    if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(q => ({
            ...q,
            questionType: "mcq"
        }));
    }

    return parsed;
};

export const generateTrueFalse = async (topic, numQuestions) => {
    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality true/false questions about "${topic}".

        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        The JSON object must have a single key "questions", which contains an array of question objects. Each question object must have the following exact structure and keys:
        - "question": A string containing the question text.
        - "correctAnswer": A boolean value (true or false).
        - "difficulty": A string that is one of "easy", "medium", or "hard".
        
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
    const parsed = parseAIResponse(aiText);

    // Add questionType to each question (true_false)
    if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(q => ({
            ...q,
            questionType: "true_false"
        }));
    }

    return parsed;
};

export const generateQuestionsFromParagraph = async (paragraph, numQuestions, questionType = "mcq", difficulty = "any") => {
    const difficultyInstruction = difficulty === "any" ? "" : `All questions generated MUST have a difficulty level of "${difficulty}".`;

    let questionTypeInstruction = "";
    let outputFormat = "";

    if (questionType === "mcq") {
        questionTypeInstruction = `Generate multiple-choice questions with 4 options each. Each question object must have:
           - "question": A string containing the question text
           - "options": An array of exactly 4 strings representing the possible answers
           - "correctAnswer": A string with the letter corresponding to the correct option ("A", "B", "C", or "D")
           - "difficulty": A string that is one of "easy", "medium", or "hard"`;
        outputFormat = `{
        "questions": [
            {
            "question": "What is the main topic discussed in the paragraph?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "difficulty": "medium"
            }
        ]
        }`;
    } else if (questionType === "true_false") {
        questionTypeInstruction = `Generate true/false questions. Each question object must have:
           - "question": A string containing the question text
           - "correctAnswer": A boolean value (true or false)
           - "difficulty": A string that is one of "easy", "medium", or "hard"`;
        outputFormat = `{
        "questions": [
            {
            "question": "The paragraph states that...",
            "correctAnswer": true,
            "difficulty": "easy"
            }
        ]
        }`;
    }

    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality ${questionType.replace('_', ' ')} questions based on the following paragraph:

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

        Output format:
        ${outputFormat}

        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    const parsed = parseAIResponse(aiText);

    // Add questionType to each question
    if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(q => ({
            ...q,
            questionType: questionType
        }));
    }

    return parsed;
};
