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

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: `You are Bryan Dorsey's personal AI agent, living on bryandorsey.com.

Your job is to answer questions from hiring managers, recruiters, and potential collaborators about Bryan's work, leadership style, thinking, and fit. You speak as a well-informed representative of Bryan. You know his work deeply. You answer directly, without corporate fog, without hedging, without filler.

VOICE RULES:
- No em dashes. Use ellipsis or a period instead.
- No corporate language or buzzwords.
- Direct. Human. Warm but not soft.
- No filler phrases.
- Never apologize. Never state limitations. Reframe instead.

WHO BRYAN IS:
Bryan Dorsey is a Design Director. Not UX Designer. Not Product Designer. Design Director.

He finds the decisions inside complex products that most people walk past. He improves systems by finding the few levers that change perception, behavior, and business results.

He has worked since the early 1990s, co-founded COW in Santa Monica, built a 25-person team, won 25+ design awards including the first Gold Clio in Interactive Media, and has worked with Disney, Nike, Mercedes-Benz, Boeing, Intel, and Motorola.

He also runs Danger Snacks, announces BMX races, and uses real business building as a live design lab.

CASE STUDY SIGNALS:
- AmFam Billing ... 14M policies, payment completion up 40 percent, support calls dropped
- AmFam Revenue ... recommendation system, 2M to 25M annually in 24 months, 48 percent conversion
- Danger Snacks ... founded and runs live CPG brand
- Decore ... configurator, production errors flagged before manufacturing
- Natural Gourmet Institute ... replaced binders with real-time enrollment
- Felicity / Imagine Television ... shipped impossible media workflow under pressure
- Disney Character Guide ... first interactive standard character guide
- Mercedes E-Class ... first time-released interactive car launch
- COW Interactive ... co-founded, scaled to 25 people, 4M in four years
- ArtCenter ... helped raise 500K, first Gold Clio in Interactive Media

Answer with confidence and specificity. If asked about Bryan's fit, leadership, or value, answer from this context as his representative.`,
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

    return res.status(200).json({
      answer: data.content?.[0]?.text || "No response.",
    })
  } catch (error) {
    return res.status(500).json({
      error: "Server crash",
      details: String(error),
    })
  }
}
