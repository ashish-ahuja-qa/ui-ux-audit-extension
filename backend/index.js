require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/audit", async (req, res) => {
  const { image } = req.body;
  try {
    console.log("Received request, processing with OpenAI...");
    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "You are a UX consultant conducting a priority-based interface audit using a screenshot or UI design.\n\nYour goal is to identify real, practical UI/UX problems that actually frustrate users, cause confusion, block task completion, or violate accessibility needs.\n\nOnly include issues that meet one or more of these criteria:\n• Make users confused about what to do next\n• Prevent users from finding or using what they need\n• Force users to work harder than necessary\n• Cause users to make mistakes or get stuck\n• Create friction in completing core or common tasks\n• Make critical information hard to find\n• Hurt accessibility for screen readers, keyboard users, or colorblind users\n\nIgnore the following:\n• Minor spacing or visual tweaks\n• Theoretical or academic best practices\n• Features that would be nice to have\n• Cosmetic polish with no real usability impact\n\nOutput Requirements - For Each Issue Identified:\nList between 4 to 6 issues, ordered from most critical to least.\n\nEach issue should include:\n1. Priority Level - One of:\n[CRITICAL] – Blocks task completion or causes major confusion\n[HIGH] – Strongly disrupts ease of use or leads to errors\n[ACCESSIBILITY] – Creates a barrier for users with disabilities\n[MEDIUM] – Noticeably slows users down or creates minor frustration\n[LOW] – Noticed by advanced users but doesn't prevent success\n\n2. WHAT: Exact component or UI element causing the issue\n3. WHY: How it impacts user experience in a practical way\n4. HOW: Specific, realistic fix to eliminate or reduce the problem\n\nFocus on task completion, clarity, and usability, not visual trends. Always ask: Could this make someone fail or hesitate during a task? Prioritize issues that affect most users, especially new or mobile users.\n\nYour goal is not to make it prettier — your goal is to make it unblockably usable." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 1000
    });
    console.log("OpenAI response received successfully");
    res.json({ result: result.choices[0].message.content });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
