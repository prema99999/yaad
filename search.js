// POST { query, library: [{id, description}] }
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { query, library } = req.body || {};
    if (!query || !Array.isArray(library) || library.length === 0) return res.status(400).json({ error: "Missing query or library" });
    if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "GEMINI_API_KEY is not set in Vercel" });

    const today = new Date().toISOString().slice(0, 10);
    const index = library
      .map((p) => {
        const date = p.dateTaken ? new Date(p.dateTaken).toISOString().slice(0, 10) : "unknown date";
        return `id:${p.id} — taken ${date} — ${p.description}`;
      })
      .join("\n");
    const prompt = `A user is trying to find a specific photo from memory using an imprecise description. They may remember it exactly (an exact date, an exact place name) or only vaguely (a rough time like "last winter" or "around Diwali", a general area, or just what the background/scene looked like). Today's date is ${today}.\n\nHere is a photo library index, each with its real taken-date and an AI-written visual description:\n\n${index}\n\nUser's query: "${query}"\n\nWeigh both the taken-date and the visual description against the query — if the user gives a specific or relative date/season, prioritize photos whose taken-date is consistent with it; if they describe the scene, background, or objects, prioritize photos whose description matches those details. Return ONLY JSON: an array of up to 3 objects {"id": "<id>", "reason": "<one short sentence citing the specific date or visual detail that matched>"}, best match first. Return [] if nothing plausibly matches.`;

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      return res.status(r.status === 429 ? 429 : 502).json({ error: "Gemini API error " + r.status, detail });
    }
    const data = await r.json();
    const raw = ((data.candidates || [])[0]?.content?.parts || []).map((p) => p.text || "").join("");
    let matches = [];
    try { const m = raw.match(/\[[\s\S]*\]/); matches = JSON.parse(m ? m[0] : raw); } catch (e) { matches = []; }
    res.status(200).json({ matches });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
