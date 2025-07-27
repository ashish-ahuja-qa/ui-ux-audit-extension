require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.post("/audit", async (req, res) => {
  const { image } = req.body;
  try {
    const result = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "You are a senior UI/UX designer conducting a professional audit of this interface. Analyze the screenshot and provide EXTREMELY specific, detailed, and actionable feedback. For each issue:\n\n1. Identify the EXACT element or area with the problem (e.g., 'The search button in the top-right corner')\n2. Explain precisely what's wrong with it (e.g., 'has insufficient contrast ratio of approximately 2.5:1 against the background')\n3. Give a specific, measurable recommendation (e.g., 'Increase contrast to at least 4.5:1 by using #0056b3 instead of the current #8ebeff')\n\nInclude at least 6 highly specific issues. Focus on concrete problems like: exact spacing measurements, specific color values, precise font sizes, exact button dimensions, specific alignment issues, etc. Include technical details whenever possible (pixels, hex colors, ratios). DO NOT provide generic advice. Every point must reference specific elements visible in the interface." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ],
      max_tokens: 1000
    });
    res.json({ result: result.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).send("OpenAI error");
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
