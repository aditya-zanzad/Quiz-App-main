import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateMockQuestions, generateMockQuestionsFromParagraph } from "./mockAiGenerator.js";

dotenv.config();


// Warn if API key is missing, but don't throw error (mock AI will be used as fallback)
if (!process.env.GEMINI_API_KEY && process.env.NODE_ENV !== "test") {
    console.warn("⚠️  GEMINI_API_KEY not found - using Mock AI for question generation");
    console.warn("   To use real AI, get an API key at: https://aistudio.google.com/app/apikey");
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const MODEL = process.env.GEMINI_MODEL || "gemini-pro";
const USE_MOCK_AI = !genAI; // Use mock AI if no API key is configured

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

    try {
        console.log(`Attempting Gemini AI with model: ${MODEL}`);
        const model = genAI.getGenerativeModel({ model: MODEL });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error("Gemini AI returned empty response");
        }

        console.log("✅ Gemini AI generation successful");
        return text;
    } catch (error) {
        // Log the actual error for debugging
        console.error("Gemini API Error:", error.message);
        console.error("Error details:", {
            name: error.name,
            message: error.message
        });

        // Provide more helpful error messages
        if (error.message && (error.message.includes("API_KEY") || error.message.includes("API key"))) {
            throw new Error("Invalid Gemini API key. Get one at https://makersuite.google.com/app/apikey");
        } else if (error.message && (error.message.includes("quota") || error.message.includes("rate limit") || error.message.includes("429"))) {
            throw new Error("Gemini API quota exceeded or rate limit reached. Please try again later.");
        } else if (error.message && error.message.includes("404")) {
            throw new Error("Gemini model not found. Please check if the model name is correct.");
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

export const generateMCQ = async (topic, numQuestions, difficulty = "any") => {
    // Use mock AI if no API key is configured
    if (USE_MOCK_AI) {
        console.log(`🎭 Using Mock AI to generate ${numQuestions} MCQ questions about "${topic}"`);
        return generateMockQuestions(topic, numQuestions, "mcq", difficulty);
    }

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

    try {
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
    } catch (error) {
        // Fallback to mock AI if Gemini fails
        console.warn(`⚠️  Gemini AI failed, falling back to Mock AI: ${error.message}`);
        return generateMockQuestions(topic, numQuestions, "mcq", difficulty);
    }
};

export const generateTrueFalse = async (topic, numQuestions) => {
    // Use mock AI if no API key is configured
    if (USE_MOCK_AI) {
        console.log(`🎭 Using Mock AI to generate ${numQuestions} True/False questions about "${topic}"`);
        return generateMockQuestions(topic, numQuestions, "true_false", "any");
    }

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

export const generateBriefAnswer = async (topic, numQuestions, difficulty = "any") => {
    const difficultyInstruction =
        difficulty === "any"
            ? ""
            : `All questions generated MUST have a difficulty level of "${difficulty}".`;

    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality brief answer questions about "${topic}".
        ${difficultyInstruction}
        
        Brief answer questions should require 2-3 sentence responses (approximately 50-100 words).
        
        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        The JSON object must have a single key "questions", which contains an array of question objects. Each question object must have the following exact structure and keys:
        - "question": A string containing the question text.
        - "correctAnswer": A string containing the reference/model answer (2-3 sentences).
        - "difficulty": A string that is one of "easy", "medium", or "hard".
        - "maxWords": A number representing the suggested word limit (50-100 for brief answers).
        
        Here is an example of the required output format:
        Output format:
        {
        "questions": [
            {
            "question": "Explain the main concept of photosynthesis.",
            "correctAnswer": "Photosynthesis is the process by which plants convert light energy into chemical energy. Plants use sunlight, water, and carbon dioxide to produce glucose and oxygen. This process is essential for plant growth and provides oxygen for other organisms.",
            "difficulty": "medium",
            "maxWords": 75
            }
        ]
        }
        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    const parsed = parseAIResponse(aiText);

    // Add questionType to each question (brief_answer)
    if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(q => ({
            ...q,
            questionType: "brief_answer",
            maxWords: q.maxWords || 75
        }));
    }

    return parsed;
};

export const generateLongAnswer = async (topic, numQuestions, difficulty = "any") => {
    const difficultyInstruction =
        difficulty === "any"
            ? ""
            : `All questions generated MUST have a difficulty level of "${difficulty}".`;

    const prompt = `
        You are an expert quiz designer. Your task is to generate ${numQuestions} high-quality long answer questions about "${topic}".
        ${difficultyInstruction}
        
        Long answer questions should require detailed paragraph-length responses (approximately 200-500 words).
        
        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        The JSON object must have a single key "questions", which contains an array of question objects. Each question object must have the following exact structure and keys:
        - "question": A string containing the question text.
        - "correctAnswer": A string containing the reference/model answer (detailed paragraph).
        - "difficulty": A string that is one of "easy", "medium", or "hard".
        - "maxWords": A number representing the suggested word limit (200-500 for long answers).
        
        Here is an example of the required output format:
        Output format:
        {
        "questions": [
            {
            "question": "Discuss the impact of climate change on global ecosystems and propose potential solutions.",
            "correctAnswer": "Climate change has profound effects on global ecosystems, including rising temperatures, changing precipitation patterns, and increased frequency of extreme weather events. These changes disrupt habitats, alter species distributions, and threaten biodiversity. Marine ecosystems face ocean acidification and coral bleaching, while terrestrial ecosystems experience shifts in vegetation zones and wildlife migration patterns. Potential solutions include reducing greenhouse gas emissions through renewable energy adoption, implementing carbon capture technologies, protecting and restoring natural habitats, and promoting sustainable land use practices. International cooperation and policy frameworks are essential for effective climate action.",
            "difficulty": "hard",
            "maxWords": 300
            }
        ]
        }
        No explanation or extra output.
        `;

    const aiText = await generateFromGemini(prompt);
    const parsed = parseAIResponse(aiText);

    // Add questionType to each question (long_answer)
    if (parsed.questions && Array.isArray(parsed.questions)) {
        parsed.questions = parsed.questions.map(q => ({
            ...q,
            questionType: "long_answer",
            maxWords: q.maxWords || 300
        }));
    }

    return parsed;
};

// ✅ Generate questions from paragraph text
export const generateQuestionsFromParagraph = async (paragraph, numQuestions, questionType = "mcq", difficulty = "any") => {
    // Use mock AI if no API key is configured
    if (USE_MOCK_AI) {
        console.log(`🎭 Using Mock AI to generate ${numQuestions} questions from paragraph`);
        return generateMockQuestionsFromParagraph(paragraph, numQuestions, questionType);
    }

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
    } else if (questionType === "short_answer") {
        questionTypeInstruction = `Generate short answer questions (1 sentence answers). Each question object must have:
           - "question": A string containing the question text
           - "correctAnswer": A string containing the reference answer (1 sentence)
           - "difficulty": A string that is one of "easy", "medium", or "hard"
           - "maxWords": A number representing the suggested word limit (20-30 for short answers)`;
        outputFormat = `{
        "questions": [
            {
            "question": "What is the main point of the paragraph?",
            "correctAnswer": "The main point is that...",
            "difficulty": "medium",
            "maxWords": 25
            }
        ]
        }`;
    } else if (questionType === "brief_answer") {
        questionTypeInstruction = `Generate brief answer questions (2-3 sentence answers). Each question object must have:
           - "question": A string containing the question text
           - "correctAnswer": A string containing the reference answer (2-3 sentences)
           - "difficulty": A string that is one of "easy", "medium", or "hard"
           - "maxWords": A number representing the suggested word limit (50-100 for brief answers)`;
        outputFormat = `{
        "questions": [
            {
            "question": "Explain the key concept discussed in the paragraph.",
            "correctAnswer": "The paragraph discusses... This concept is important because... It demonstrates that...",
            "difficulty": "medium",
            "maxWords": 75
            }
        ]
        }`;
    } else if (questionType === "long_answer") {
        questionTypeInstruction = `Generate long answer questions (detailed paragraph answers). Each question object must have:
           - "question": A string containing the question text
           - "correctAnswer": A string containing the reference answer (detailed paragraph)
           - "difficulty": A string that is one of "easy", "medium", or "hard"
           - "maxWords": A number representing the suggested word limit (200-500 for long answers)`;
        outputFormat = `{
        "questions": [
            {
            "question": "Analyze and discuss the main themes presented in the paragraph.",
            "correctAnswer": "The paragraph presents several important themes... [detailed explanation continues]",
            "difficulty": "hard",
            "maxWords": 300
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
        6. For answer-based questions, provide comprehensive reference answers

        ${questionTypeInstruction}

        The response MUST be ONLY a single, valid JSON object. Do not include any text, explanations, or markdown formatting outside of the JSON object.

        Output format:
        ${outputFormat}

        No explanation or extra output.
        `;

    try {
        const aiText = await generateFromGemini(prompt);
        const parsed = parseAIResponse(aiText);

        // Add questionType to each question and set default maxWords if needed
        if (parsed.questions && Array.isArray(parsed.questions)) {
            parsed.questions = parsed.questions.map(q => {
                const baseQuestion = {
                    ...q,
                    questionType: questionType
                };

                // Add maxWords for answer-type questions if not present
                if (questionType === "short_answer" && !q.maxWords) {
                    baseQuestion.maxWords = 25;
                } else if (questionType === "brief_answer" && !q.maxWords) {
                    baseQuestion.maxWords = 75;
                } else if (questionType === "long_answer" && !q.maxWords) {
                    baseQuestion.maxWords = 300;
                }

                return baseQuestion;
            });
        }

        return parsed;
    } catch (error) {
        // Fallback to mock AI if Gemini fails
        console.warn(`⚠️  Gemini AI failed, falling back to Mock AI: ${error.message}`);
        return generateMockQuestionsFromParagraph(paragraph, numQuestions, questionType);
    }
};

