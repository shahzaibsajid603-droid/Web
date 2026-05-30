const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

// System prompt for Aroosh Online Tutors AI Assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for Aroosh Online Tutors, an online tutoring platform. Your job is to assist users with platform-related questions only.

You can help with:
- "How to set up my profile?" → "Click your name or avatar in the sidebar. Fill in your name, subject preferences, profile picture, and contact details. If you are a tutor, also add your qualifications and available time slots. Save your changes when done."

- "How do I find tutors?" → "Go to Browse Tutors in the sidebar. Filter by subject, availability, or rating. Click any tutor's profile to view details and send a booking request."

- "How do I book a session?" → "Visit a tutor's profile, pick an available slot under Schedule & Slots, and confirm the booking. You will get a confirmation message."

For anything unrelated to the platform, reply:
"I can only help with Aroosh Online Tutors platform questions like finding tutors, booking sessions, or setting up your profile. For academic help, please connect with one of our tutors!"`;

app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "YOUR_API_KEY_HERE",
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Unable to get response from AI.";
    res.json({ reply });
  } catch (error) {
    console.error("[Proxy] Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
