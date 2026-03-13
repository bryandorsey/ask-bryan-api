export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  const r = await fetch(
    `${supabaseUrl}/rest/v1/agent_questions?select=id,question,answer,created_at&order=created_at.desc&limit=20`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
    }
  )

  const data = await r.json()

  return res.status(200).json({
    recent: data
  })
}
