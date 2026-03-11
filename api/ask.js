export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(200).json({
      message: "API is live. Use POST."
    })
  }

  const body = typeof req.body === "string"
    ? JSON.parse(req.body)
    : req.body

  const question = body.question

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 400,
      messages: [
        { role: "user", content: question }
      ]
    })
  })

  const data = await response.json()

  res.status(200).json({
    answer: data.content?.[0]?.text || "No response."
  })
}
