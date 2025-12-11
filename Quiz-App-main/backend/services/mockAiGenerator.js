// Mock AI Question Generator - No API needed!
// This generates realistic questions without any external API calls

const questionTemplates = {
    mcq: {
        javascript: [
            {
                question: "What is the correct way to declare a variable in JavaScript?",
                options: ["var x = 5;", "variable x = 5;", "v x = 5;", "dim x = 5;"],
                correctAnswer: "A",
                difficulty: "easy"
            },
            {
                question: "Which method is used to add an element to the end of an array?",
                options: ["push()", "pop()", "shift()", "unshift()"],
                correctAnswer: "A",
                difficulty: "easy"
            },
            {
                question: "What does 'this' keyword refer to in JavaScript?",
                options: ["The current object", "The global object", "The parent object", "The window object"],
                correctAnswer: "A",
                difficulty: "medium"
            },
            {
                question: "Which of the following is NOT a JavaScript data type?",
                options: ["String", "Boolean", "Float", "Undefined"],
                correctAnswer: "C",
                difficulty: "medium"
            },
            {
                question: "What is a closure in JavaScript?",
                options: [
                    "A function that has access to variables in its outer scope",
                    "A way to close a browser window",
                    "A method to end a loop",
                    "A type of error handling"
                ],
                correctAnswer: "A",
                difficulty: "hard"
            }
        ],
        general: [
            {
                question: "What does HTML stand for?",
                options: ["Hyper Text Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlinks and Text Markup Language"],
                correctAnswer: "A",
                difficulty: "easy"
            },
            {
                question: "Which programming language is known as the 'language of the web'?",
                options: ["Python", "JavaScript", "Java", "C++"],
                correctAnswer: "B",
                difficulty: "easy"
            },
            {
                question: "What is the purpose of CSS?",
                options: ["To style web pages", "To add interactivity", "To store data", "To create databases"],
                correctAnswer: "A",
                difficulty: "medium"
            },
            {
                question: "What does API stand for?",
                options: ["Application Programming Interface", "Advanced Programming Integration", "Automated Program Interaction", "Application Process Integration"],
                correctAnswer: "A",
                difficulty: "medium"
            },
            {
                question: "Which HTTP method is used to update a resource?",
                options: ["GET", "POST", "PUT", "DELETE"],
                correctAnswer: "C",
                difficulty: "hard"
            }
        ]
    },
    true_false: [
        {
            question: "JavaScript is a compiled language.",
            correctAnswer: false,
            difficulty: "easy"
        },
        {
            question: "CSS stands for Cascading Style Sheets.",
            correctAnswer: true,
            difficulty: "easy"
        },
        {
            question: "HTML5 supports video and audio elements.",
            correctAnswer: true,
            difficulty: "medium"
        },
        {
            question: "Python is primarily used for frontend development.",
            correctAnswer: false,
            difficulty: "medium"
        },
        {
            question: "REST APIs must use JSON format for data exchange.",
            correctAnswer: false,
            difficulty: "hard"
        }
    ]
};

export const generateMockQuestions = (topic, numQuestions, questionType = "mcq", difficulty = "any") => {
    const questions = [];

    if (questionType === "mcq") {
        // Determine which template set to use
        const topicLower = topic.toLowerCase();
        let templateSet = questionTemplates.mcq.general;

        if (topicLower.includes('javascript') || topicLower.includes('js')) {
            templateSet = questionTemplates.mcq.javascript;
        }

        // Filter by difficulty if specified
        let availableQuestions = difficulty === "any"
            ? templateSet
            : templateSet.filter(q => q.difficulty === difficulty);

        // If not enough questions with specific difficulty, use all
        if (availableQuestions.length < numQuestions) {
            availableQuestions = templateSet;
        }

        // Select random questions
        for (let i = 0; i < Math.min(numQuestions, availableQuestions.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const question = { ...availableQuestions[randomIndex] };

            // Customize question to include topic
            question.question = question.question.replace(/JavaScript/gi, topic);
            question.questionType = "mcq";

            questions.push(question);
            availableQuestions.splice(randomIndex, 1); // Remove to avoid duplicates
        }

        // If we need more questions, generate generic ones
        while (questions.length < numQuestions) {
            questions.push({
                question: `What is an important concept in ${topic}?`,
                options: [
                    `Understanding ${topic} fundamentals`,
                    `Ignoring ${topic} best practices`,
                    `Avoiding ${topic} documentation`,
                    `Skipping ${topic} testing`
                ],
                correctAnswer: "A",
                difficulty: difficulty === "any" ? "medium" : difficulty,
                questionType: "mcq"
            });
        }

    } else if (questionType === "true_false") {
        let availableQuestions = difficulty === "any"
            ? questionTemplates.true_false
            : questionTemplates.true_false.filter(q => q.difficulty === difficulty);

        if (availableQuestions.length < numQuestions) {
            availableQuestions = questionTemplates.true_false;
        }

        for (let i = 0; i < Math.min(numQuestions, availableQuestions.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const question = { ...availableQuestions[randomIndex] };
            question.questionType = "true_false";
            questions.push(question);
            availableQuestions.splice(randomIndex, 1);
        }

        while (questions.length < numQuestions) {
            questions.push({
                question: `${topic} is an important topic in computer science.`,
                correctAnswer: true,
                difficulty: difficulty === "any" ? "medium" : difficulty,
                questionType: "true_false"
            });
        }
    }

    return { questions };
};

export const generateMockQuestionsFromParagraph = (paragraph, numQuestions, questionType = "mcq") => {
    // Extract key words from paragraph
    const words = paragraph.split(/\s+/).filter(w => w.length > 5);
    const keyWord = words[Math.floor(Math.random() * Math.min(words.length, 5))] || "topic";

    const questions = [];

    if (questionType === "mcq") {
        questions.push({
            question: `What is the main topic discussed in the paragraph?`,
            options: [
                `${keyWord} and related concepts`,
                "Unrelated topic A",
                "Unrelated topic B",
                "Unrelated topic C"
            ],
            correctAnswer: "A",
            difficulty: "medium",
            questionType: "mcq"
        });

        if (numQuestions > 1) {
            questions.push({
                question: `According to the paragraph, what is emphasized about ${keyWord}?`,
                options: [
                    "Its importance and applications",
                    "Its irrelevance",
                    "Its complexity only",
                    "Its historical context only"
                ],
                correctAnswer: "A",
                difficulty: "medium",
                questionType: "mcq"
            });
        }

        while (questions.length < numQuestions) {
            questions.push({
                question: `Which statement best describes the content of the paragraph?`,
                options: [
                    `It discusses ${keyWord} comprehensively`,
                    "It provides unrelated information",
                    "It contradicts itself",
                    "It lacks clear focus"
                ],
                correctAnswer: "A",
                difficulty: "easy",
                questionType: "mcq"
            });
        }
    } else if (questionType === "true_false") {
        questions.push({
            question: `The paragraph discusses ${keyWord}.`,
            correctAnswer: true,
            difficulty: "easy",
            questionType: "true_false"
        });

        while (questions.length < numQuestions) {
            questions.push({
                question: `The paragraph provides information about the topic.`,
                correctAnswer: true,
                difficulty: "easy",
                questionType: "true_false"
            });
        }
    }

    return { questions: questions.slice(0, numQuestions) };
};
