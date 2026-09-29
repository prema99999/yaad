// POST { baseUrl, accessToken, mimeType }
// Downloads the picked photo from Google (server-side) and asks Gemini (free tier) to describe it.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { baseUrl, accessToken, mimeType } = req.body || {};
    if (!baseUrl || !accessToken) return res.status(400).json({ error: "Missing baseUrl or accessToken" });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not set in Vercel" });

    const imgResp = await fetch(`${baseUrl}=w1024-h1024`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!imgResp.ok) return res.status(502).json({ error: "Failed to fetch image from Google Photos" });
    const b64 = Buffer.from(await imgResp.arrayBuffer()).toString("base64");
    const media = mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg";

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: media, data: b64 } },
          { text: "Describe this photo for a searchable photo index, in 3-4 concise sentences. Be specific and concrete, not generic: name the exact setting if identifiable (temple, beach, home interior, street, mountain, etc.), list distinctive background elements (statues, murals, signage or visible text, architectural details, religious or cultural symbols, landscape features), note who/how many people and what they're doing, notable colors and clothing, and any clue to time of day, season, weather, or occasion. Avoid vague phrases like 'a nice photo' — mention the actual visual details someone would recall from memory. Plain text only, no preamble." },
        ] }],
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(r.status === 429 ? 429 : 502).json({ error: "Gemini API error " + r.status, detail });
    }
    const data = await r.json();
    const text = ((data.candidates || [])[0]?.content?.parts || []).map((p) => p.text || "").join(" ").trim();
    res.status(200).json({ description: text || "No description available." });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
