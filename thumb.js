// POST { baseUrl, accessToken, size } -> image bytes (Google's picker URLs need the sign-in token)
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { baseUrl, accessToken, size } = req.body || {};
    if (!baseUrl || !accessToken) return res.status(400).json({ error: "Missing baseUrl or accessToken" });
    const s = Math.min(parseInt(size) || 600, 1000);
    const r = await fetch(`${baseUrl}=w${s}-h${s}`, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!r.ok) return res.status(502).json({ error: "Could not load photo" });
    res.setHeader("Content-Type", r.headers.get("content-type") || "image/jpeg");
    res.status(200).send(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
