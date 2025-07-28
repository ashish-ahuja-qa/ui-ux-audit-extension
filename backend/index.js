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
            { type: "text", text: "You are a UX auditor analyzing this interface. Your job is to find real problems that make users struggle.\n\n**EXAMPLES OF REAL PROBLEMS TO LOOK FOR:**\n\n**HIGH PRIORITY ISSUES:**\n- Navigation that's hard to find or confusing\n- Buttons that don't look clickable\n- Text that's too small to read easily\n- Important information buried or hidden\n- Forms with unclear labels or requirements\n- Broken visual hierarchy (unclear what's most important)\n- Inconsistent spacing that looks unprofessional\n- Elements that don't align properly\n- Poor contrast making text hard to read\n- Missing feedback for user actions\n\n**MEDIUM PRIORITY ISSUES:**\n- Inconsistent button styles\n- Unclear icon meanings\n- Information that's poorly organized\n- Inefficient workflows\n- Labels that could be clearer\n- Typography inconsistencies\n- Spacing that could be more consistent\n\n**WHAT MAKES A REAL PROBLEM:**\n- Users would notice it and be frustrated\n- It slows down task completion\n- It makes the interface look unprofessional\n- It creates confusion about what to do next\n- It violates common design patterns users expect\n\n**ANALYSIS APPROACH:**\n1. Scan the entire interface quickly\n2. Ask: \"What would frustrate me as a user here?\"\n3. Look for anything that stands out as wrong or inconsistent\n4. Focus on the most obvious problems first\n5. Don't overthink - trust your instincts\n\n**REPORT FORMAT:**\n[PRIORITY] Issue Description\n- Impact: How this hurts users\n- Fix: Specific solution\n\n**Be direct and practical. If something looks wrong, it probably is.**" },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 1000
    });
    console.log("OpenAI response received successfully");
    
    // Clean up the response to handle character encoding issues
    let cleanedContent = result.choices[0].message.content
      // Replace smart quotes with regular quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Replace em dashes and en dashes
      .replace(/[—–]/g, '-')
      // Replace other problematic Unicode characters
      .replace(/[…]/g, '...')
      // Normalize whitespace
      .replace(/\u00A0/g, ' '); // Non-breaking space
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({ result: cleanedContent });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
