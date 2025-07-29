const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();
const { OpenAI } = require("openai"); // ✅ Import OpenAI SDK

const app = express();
const PORT = 3000;
require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json());

// Add health check endpoint at the top of your routes
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// ✅ Route: Get subjects
app.get("/get-subjects", async (req, res) => {
    try {
        const { state, curriculum, grade } = req.query;

        console.log("📌 Request Received:", { state, curriculum, grade });

        if (!state || !curriculum || !grade) {
            return res.status(400).json({ error: "Missing required parameters: state, curriculum, or grade" });
        }

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "system", content: `List subjects for ${curriculum} curriculum for Grade ${grade} in ${state}.` }],
                max_tokens: 300,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        console.log("✅ Raw OpenAI Response:", JSON.stringify(response.data, null, 2));

        const subjects = response.data.choices[0]?.message?.content?.trim().split("\n") || [];

        console.log("📌 Parsed Subjects:", subjects);

        res.json({ subjects });

    } catch (error) {
        console.error("❌ Error fetching subjects:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch subjects", details: error.message });
    }
});

// ✅ Route: Get topics
app.get("/get-topics", async (req, res) => {
    const { state, curriculum, grade, subject } = req.query;

    if (!state || !curriculum || !grade || !subject) {
        return res.status(400).json({ error: "Missing query parameters" });
    }

    console.log("🔍 Fetching topics for:", { state, curriculum, grade, subject });

    try {
        const prompt = `
You are a curriculum expert for ${subject} in ${curriculum} curriculum.
List the specific chapters or topics that are taught in ${subject} for grade ${grade} in ${state}.

Requirements:
1. Only list topics that are actually part of ${subject}
2. Topics should be grade-appropriate for ${grade}
3. Return the list in a clear, numbered format
4. Be specific to the subject matter
5. If this is a language subject, include appropriate language-specific topics

Return ONLY the numbered list of topics, nothing else.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `You are a ${subject} curriculum expert. Only provide topics that are specifically part of ${subject} for grade ${grade}.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        });

        const content = response.choices[0].message.content.trim();
        console.log("🧠 GPT Raw Response:", content);

        const topics = content
            .split("\n")
            .map(line => line.replace(/^\d+[\).]?\s*/, "").trim())
            .filter(Boolean);

        if (!topics.length) {
            console.warn("⚠️ No topics parsed. Sending fallback content.");
            return res.json({ topics: [content] });
        }

        console.log("✅ Extracted Topics:", topics);
        res.json({ topics });

    } catch (error) {
        console.error("❌ Error fetching topics:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch topics", details: error.message });
    }
});

// ✅ Route: Get chapters
app.get("/get-chapters", async (req, res) => {
    const { state, curriculum, grade, subject } = req.query;

    if (!state || !curriculum || !grade || !subject) {
        return res.status(400).json({ error: "Missing query parameters" });
    }

    console.log("📚 Fetching chapters for:", { state, curriculum, grade, subject });

    try {
        const prompt = `List chapters for the subject "${subject}" for class ${grade} under the ${curriculum} curriculum in ${state}. Return just the list.`;

        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const content = response.data.choices[0].message.content;
        console.log("🧠 GPT Raw Response:", content);

        if (!content || typeof content !== "string") {
            return res.status(404).json({ error: "Empty content from OpenAI" });
        }

        const chapters = content
            .split("\n")
            .map(line => line.replace(/^\d+[\).]?\s*/, "").trim())
            .filter(Boolean);

        console.log("✅ Extracted Chapters:", chapters);

        if (!chapters.length) {
            return res.status(404).json({ error: "No chapters parsed from response" });
        }

        res.json({ chapters });

    } catch (error) {
        console.error("❌ Error fetching chapters:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch chapters", details: error.message });
    }
});

// Update the chapter content endpoint with better error handling
app.post("/api/get-chapter-content", async (req, res) => {
    try {
        const { topic, subject, state, curriculum, grade } = req.body;

        // Log the incoming request
        console.log("📘 Received content request:", {
            topic,
            subject,
            state,
            curriculum,
            grade
        });

        // Validate required fields
        if (!topic || !subject || !state || !curriculum || !grade) {
            console.error("❌ Missing required fields:", { topic, subject, state, curriculum, grade });
            return res.status(400).json({
                error: "Missing required fields",
                required: ["topic", "subject", "state", "curriculum", "grade"],
                received: { topic, subject, state, curriculum, grade }
            });
        }

        // Extract the specific science subject if it's a science topic
        let specificSubject = subject;
        if (subject.includes("Science")) {
            if (topic.toLowerCase().includes("physics")) {
                specificSubject = "Physics";
            } else if (topic.toLowerCase().includes("chemistry")) {
                specificSubject = "Chemistry";
            } else if (topic.toLowerCase().includes("biology")) {
                specificSubject = "Biology";
            }
        }

        const systemPrompt = `You are an expert ${specificSubject} teacher for grade ${grade}. 
Generate content ONLY about "${topic}" in the context of ${specificSubject}.
Focus specifically on the scientific concepts and principles related to this topic.`;

        const userPrompt = `
Generate detailed educational content for the topic "${topic}" in ${specificSubject} for grade ${grade} following ${curriculum} curriculum in ${state}.

Requirements:
1. Content must be STRICTLY about "${topic}" as it relates to ${specificSubject}
2. Content must be appropriate for grade ${grade}
3. Include relevant scientific examples and explanations
4. Use clear and simple language suitable for the grade level
5. Structure the content with proper paragraphs
6. Stay focused on the specific scientific concepts
7. Include practical examples and applications where relevant`;

        console.log("🤖 Generating content with OpenAI...");

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800
        });

        const content = response.choices[0].message.content.trim();
        
        if (!content) {
            console.error("❌ No content generated");
            return res.status(500).json({ error: "Failed to generate content" });
        }

        console.log("✅ Content generated successfully:", {
            topic,
            subject: specificSubject,
            contentLength: content.length,
            preview: content.substring(0, 100) + "..."
        });

        res.json({ content });

    } catch (error) {
        console.error("❌ Error in /api/get-chapter-content:", error);
        
        // Check if it's an OpenAI API error
        if (error.response?.data?.error) {
            return res.status(500).json({
                error: "OpenAI API error",
                details: error.response.data.error
            });
        }

        res.status(500).json({
            error: "Failed to generate chapter content",
            details: error.message
        });
    }
});

app.post("/api/generate-summary", async (req, res) => {
    try {
        const { content, numPoints, topic, subject } = req.body;

        console.log("📥 Received summary request for:", { topic, subject });

        // Validate input content
        if (!subject || !topic || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate content for non-math subjects
        if (!subject.toLowerCase().includes('math') && content.toLowerCase().includes('real number')) {
            return res.status(400).json({ error: "Invalid content detected for this subject" });
        }

        const systemPrompt = `You are an expert ${subject} teacher creating a summary about "${topic}".
Generate exactly ${numPoints} key points that summarize the provided content.
Stay strictly within the context of ${subject} and this specific topic.`;

        const userPrompt = `
Create a summary of ${numPoints} key points for the topic "${topic}" in ${subject}.
Use ONLY the following content to generate the summary:

${content}

Requirements:
1. Generate exactly ${numPoints} points
2. Each point should be clear and concise
3. Focus only on the main concepts from the provided content
4. Stay strictly relevant to ${topic} in the context of ${subject}
5. Do not include any information not present in the content
6. Do not mention anything about mathematics or real numbers unless this is a math topic

Format: Return numbered points, one per line.`;

        console.log("🤖 Generating summary...");

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        });

        const summary = response.choices[0].message.content.trim();

        // Validate generated summary
        if (!subject.toLowerCase().includes('math') && summary.toLowerCase().includes('real number')) {
            console.error("❌ Generated summary contains invalid content");
            return res.status(500).json({ error: "Generated summary appears to be incorrect for this topic" });
        }

        console.log("✅ Generated summary preview:", summary.substring(0, 100) + "...");
        res.json({ summary });
    } catch (err) {
        console.error("❌ Summary generation error:", err);
        res.status(500).json({ error: "Summary generation failed." });
    }
});

// ✅ Route: Generate MCQs
app.post("/api/generate-mcq", async (req, res) => {
    try {
        const { subject, topic, state, curriculum, grade, numQuestions, content } = req.body;

        console.log("📝 Generating MCQs for:", { subject, topic, grade, numQuestions });

        // Extract the specific science subject if it's a science topic
        let specificSubject = subject;
        if (subject.includes("Science (Physics, Chemistry, Biology)")) {
            if (topic.toLowerCase().includes("physics")) {
                specificSubject = "Physics";
            } else if (topic.toLowerCase().includes("chemistry")) {
                specificSubject = "Chemistry";
            } else if (topic.toLowerCase().includes("biology")) {
                specificSubject = "Biology";
            }
        }

        // Validate input parameters
        if (!subject || !topic || !content || !numQuestions) {
            console.error("❌ Missing required fields:", { subject, topic, content: !!content, numQuestions });
            return res.status(400).json({ error: "Missing required fields" });
        }

        // Validate content length
        if (content.length > 12000) {
            console.warn("⚠️ Content length exceeds recommended limit:", content.length);
            content = content.substring(0, 12000);
        }

        const prompt = `
You are an expert ${specificSubject} teacher creating questions for ${curriculum} curriculum in ${state}, for Grade ${grade}. 
Generate EXACTLY ${numQuestions} multiple choice questions for the topic "${topic}".

Use this content as the source for questions:
${content}

Requirements:
1. Generate EXACTLY ${numQuestions} questions, no more and no less
2. Questions must be based ONLY on the provided content
3. Each question must have exactly 4 options (A, B, C, D)
4. Mark the correct answer with a ✓ symbol
5. Questions should be grade-appropriate and focus on ${specificSubject} concepts
6. Questions should test understanding of scientific principles and their applications
7. Include practical and real-world examples where appropriate
8. Each question must be unique and clearly related to ${topic}

Format each question as:
Actual question text goes here.
A) Option A
B) Option B
C) Option C ✓
D) Option D

Make sure each question is separated by a blank line.
Do not include any additional text, headers, or formatting.`;

        console.log("🤖 Sending prompt to OpenAI with specific subject:", specificSubject);

        // Estimate tokens: ~150-250 tokens per question (question, 4 options, answer format)
        const estimated_tokens_per_question = 200; // Average tokens per question
        let dynamic_max_tokens = numQuestions * estimated_tokens_per_question;

        // Ensure a reasonable minimum (e.g., for 1-2 questions) and cap at model's output limit (4096 for gpt-3.5-turbo)
        dynamic_max_tokens = Math.max(1000, dynamic_max_tokens); // Ensure at least 1000 tokens for small requests
        dynamic_max_tokens = Math.min(4096, dynamic_max_tokens); // Cap at 4096, the typical max output for gpt-3.5-turbo models

        console.log(`⚙️ Using dynamic_max_tokens: ${dynamic_max_tokens} for ${numQuestions} questions.`);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-16k",
            messages: [
                {
                    role: "system",
                    content: `You are a ${specificSubject} teacher. Create EXACTLY ${numQuestions} unique questions about ${topic}
                     that test understanding of scientific concepts and principles. Focus on
                      practical applications and real-world examples.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: dynamic_max_tokens // Use the new calculated value
        });

        const questions = completion.choices[0]?.message?.content;
        
        if (!questions) {
            console.error("❌ No content in OpenAI response");
            return res.status(500).json({ error: "No questions generated" });
        }

        // Validate number of questions generated
        const questionCount = (questions.match(/\n\n/g) || []).length + 1;
        console.log(`✅ Generated ${questionCount} ${specificSubject} questions out of ${numQuestions} requested`);

        res.json({ questions });

    } catch (err) {
        console.error("❌ Error generating MCQs:", err);
        res.status(500).json({ 
            error: "Failed to generate MCQs. Please try again.",
            details: err.message
        });
    }
});

// ✅ Start the server
app.listen(3000, () => {
    console.log(`✅ Server is running on http://localhost:3000`);
});
