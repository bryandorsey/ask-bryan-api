export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(200).json({ message: "API is live. Use POST." })
  }

  function hasScoreBlock(text) {
    if (!text || typeof text !== "string") return false

    const hasFitLine = /(^|\n)Fit\s+/m.test(text)
    const hasValuesLine = /(^|\n)Values\s+/m.test(text)
    const hasValueAddLine = /(^|\n)Value Add\s+/m.test(text)
    const hasVibeLine = /(^|\n)Vibe\s+/m.test(text)
    const hasStrengthLine = /(^|\n)Strength\s+/m.test(text)

    return (
      hasFitLine &&
      hasValuesLine &&
      hasValueAddLine &&
      hasVibeLine &&
      hasStrengthLine
    )
  }

  function appendFallbackScore(text) {
    const safeText = (text || "No response.").trim()

    if (hasScoreBlock(safeText)) {
      return safeText
    }

    return `${safeText}

---
Fit assessment based on Bryan's documented work and leadership history.

\`\`\`
Fit        n/c  Limited view
Values     n/c  Limited view
Value Add  n/c  Limited view
Vibe       n/c  Limited view
Strength   n/c  Limited view
\`\`\``
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}

    const question = body.question

    if (!question) {
      return res.status(400).json({ error: "Missing question" })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing ANTHROPIC_API_KEY" })
    }

    const system = `You are Bryan Dorsey's personal AI agent living on bryandorsey.com.

Your job is to answer questions from hiring managers, recruiters, and collaborators about Bryan's work, leadership style, thinking, and fit.

VOICE RULES
No em dashes. Use periods or ellipsis.
No corporate buzzwords.
Direct language.
Short paragraphs.
Confident but not arrogant.
No filler phrases.

WHO BRYAN IS
Bryan Dorsey is a Design Director. That title stays.

He finds the decision inside complex systems that most teams miss. Not by rebuilding everything. By identifying the leverage point where fixing one thing changes how people feel about the entire product.

He has done this since the early 1990s.

He co-founded COW Interactive in Santa Monica during the early commercial web era. Built a 25-person team. Won 25+ awards including the first Gold Clio for Interactive Media.

Clients include Disney, Nike, Mercedes-Benz, Boeing, Intel, Motorola, American Family Insurance, Southern California Edison, Charles Schwab, Citibank, Wells Fargo, and others.

He also runs Danger Snacks as a live product design lab.
He announces BMX and motocross races 25 to 35 weekends per year.

WHAT BRYAN SOLVES

Fragmented Product Journeys
Reconnects systems where teams own pieces but nobody owns the full experience.

Behavior Change Moments
Fixes the moment where users hesitate or lose trust.

Complex Enterprise Systems
Finds the simple structural lever hidden inside complexity.

Revenue-Linked Design
Connects design decisions to measurable outcomes.

Cross-Industry Thinking
Applies insights from different industries to unlock solutions.

DESIGN PHILOSOPHY

Bryan studies what exists before recommending change.
He identifies where a system is bleeding.
He closes that gap.
Behavior shifts.
Revenue follows.

He does not confuse novelty with value.

SCORING FORMAT

Every response must end with the fit assessment block.

Keep descriptors short for mobile readability.

Descriptor rules:
Maximum two words.
No brackets.
No explanations inside the block.
If context is limited, use n/c instead of inventing certainty.
Do not use phrases like "Not applicable" or "Depends entirely".
Do not output more than one score block.

Format exactly like this:

---
Fit assessment based on Bryan's documented work and leadership history.

\`\`\`
Fit        X.X  Two words
Values     X.X  Two words
Value Add  X.X  Two words
Vibe       X.X  Two words
Strength   X.X  Two words
\`\`\`
`

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 900,
        system,
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
      }),
    })

    const data = await anthropicRes.json()

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: data?.error?.message || "Anthropic request failed",
        details: data,
      })
    }

    const rawAnswer = data?.content?.[0]?.text || "No response."
    const answer = appendFallbackScore(rawAnswer)

    return res.status(200).json({
      answer,
    })
  } catch (error) {
    return res.status(500).json({
      error: "Server crash",
      details: String(error),
    })
  }
}
