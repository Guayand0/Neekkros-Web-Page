import { getPool } from "./_db.js";

const validSocials = new Set(["twitch", "youtube", "instagram", "x", "tiktok", "discord"]);

function setNoCacheHeaders(response) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");
}

export default async function handler(request, response) {
  setNoCacheHeaders(response);

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method not allowed" });
  }

  try {
    const pool = getPool();
    const [rows] = await pool.query(
      "SELECT social, amount, type FROM social_counts ORDER BY id ASC",
    );
    const counts = {};

    for (const row of rows) {
      const social = String(row.social).toLowerCase();
      const value = Number(row.amount);
      if (!validSocials.has(social) || !Number.isFinite(value) || value < 0) continue;

      counts[social] = {
        value,
        type: String(row.type),
        status: "available",
        collectedAt: null,
      };
    }

    return response.status(200).json({ counts });
  } catch (error) {
    console.error("social-counts error:", error);
    return response.status(500).json({ error: "Could not read social counts" });
  }
}
