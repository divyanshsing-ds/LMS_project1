const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Validate key on startup
if (!GEMINI_API_KEY || GEMINI_API_KEY === "YOUR_KEY_HERE") {
    console.warn("⚠️  WARNING: GEMINI_API_KEY is not set in .env — AI features will use fallbacks.");
}

/* =================== SHARED GEMINI CALLER =================== */
async function callGemini(prompt) {
    const response = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    const data = await response.json();

    if (!response.ok || !data?.candidates) {
        console.error("Gemini API error response:", JSON.stringify(data, null, 2));
        throw new Error(`Gemini API error: ${data?.error?.message || response.status}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
        console.error("Gemini empty text. Full response:", JSON.stringify(data, null, 2));
        throw new Error("Gemini returned empty response");
    }
    return text;
}

/* =================== QUIZ GENERATION =================== */
async function generateQuiz(lectureTitle) {
    const prompt = `
Create exactly 10 multiple choice questions based on:
"${lectureTitle}"

Rules:
- 4 options only
- One correct answer
- Return ONLY a JSON array
- Do NOT add explanation
- Do NOT use markdown
- Do NOT wrap in backticks

Format:
[
  {
    "question": "",
    "options": ["A","B","C","D"],
    "answer": "A"
  }
]
`;

    try {
        let text = await callGemini(prompt);
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    } catch (err) {
        console.error("Quiz Generation Error:", err.message);
        // Graceful fallback — return dummy questions so the app doesn't crash
        return Array.from({ length: 5 }, (_, i) => ({
            question: `Sample question ${i + 1} about "${lectureTitle}"`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            answer: "Option A",
        }));
    }
}

/* =================== SUMMARY GENERATION =================== */
async function generateSummary(lectureTitle) {
    const prompt = `
Summarize the educational lecture titled: "${lectureTitle}"
Provide a concise, engaging summary in 3-4 sentences that highlights what the student will learn.
Return ONLY the summary text. No markdown, no prefixes.
`;

    try {
        const text = await callGemini(prompt);
        return text.trim();
    } catch (err) {
        console.error("Summary Generation Error:", err.message);
        return `This lecture covers key concepts in "${lectureTitle}". Complete the quiz to test your understanding.`;
    }
}

/* =================== COURSE RECOMMENDATIONS =================== */
async function recommendCourses(studentCourses, allAvailableCourses) {
    if (!allAvailableCourses || allAvailableCourses.length === 0) return [];

    const prompt = `
Based on the courses the student is already enrolled in:
${JSON.stringify(studentCourses)}

Recommend exactly 3 courses from this list of available courses that they might enjoy:
${JSON.stringify(allAvailableCourses)}

Rules:
- Give ONLY the titles of the 3 recommended courses.
- Return ONLY a JSON array of strings.
- Do NOT add explanation.
- Do NOT use markdown.
- Do NOT wrap in backticks.
- ONLY return course titles that exist exactly in the available list.
`;

    try {
        let text = await callGemini(prompt);
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(text);
        // Validate: only return courses that actually exist in DB
        return parsed.filter(c => allAvailableCourses.includes(c)).slice(0, 3);
    } catch (err) {
        console.error("Recommendation Error:", err.message);
        return allAvailableCourses.slice(0, 3);
    }
}

module.exports = { generateQuiz, generateSummary, recommendCourses };
