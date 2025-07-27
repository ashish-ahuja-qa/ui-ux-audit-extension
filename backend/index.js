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
            { type: "text", text: "As an expert UI/UX designer, analyze this interface and identify at least 5-7 specific improvement opportunities. Include both critical issues and general enhancements that would improve the user experience. For each point, provide a clear explanation and an actionable recommendation. Use simple bullet points (with - or •) and avoid markdown formatting or asterisks. Even if the interface seems good overall, suggest practical improvements that could make it better. Be specific, practical and constructive." },
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
