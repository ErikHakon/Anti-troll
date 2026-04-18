export default async function handler(req, res) {
  // 1. Headers CORS y Checks Iniciales (Estilo coach.js)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Validación de Entrada
  const { image, mediaType } = req.body || {};

  if (!image) {
    return res.status(400).json({ error: "Se requiere una imagen" });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(mediaType)) {
    return res.status(400).json({ error: "Formato de imagen no soportado" });
  }

  // 3. Validación de Tamaño (Límite 5MB)
  // Base64 size approx: (chars * 3) / 4
  const sizeInBytes = (image.length * 3) / 4;
  if (sizeInBytes > 5 * 1024 * 1024) {
    return res.status(413).json({ error: "La imagen supera el límite de 5MB" });
  }

  // 4. Prompts de Visión
  const SYSTEM_PROMPT = `You analyze League of Legends screenshots. 
Respond with valid JSON only. No markdown, no explanation.`;

  const USER_PROMPT = `This is a League of Legends screenshot. Extract information about the 10 champions in the match and identify which one belongs to the user.

FINDING THE USER'S CHAMPION:
Somewhere in this screenshot there is exactly one piece of text rendered in a golden/yellow color. Every other text in the screenshot is white or gray. That single golden text is the user's summoner name, and it appears near the user's champion card. The champion associated with that golden text is the user's champion.

EXTRACTING THE TEAMS:
There are two possible screen layouts:

Loading screen — two horizontal rows of 5 champion cards each.
- blueTeam: the 5 champions in the top row
- redTeam: the 5 champions in the bottom row
- blueLanes: null

Champion select — a vertical list with allies on the left and enemies on the right.
- blueTeam: the 5 allies (left side)
- redTeam: the 5 enemies (right side)
- blueLanes: the 5 ally lanes in order, read from the lane labels next to each ally. Translate the label to one of these canonical values:
  SUPERIOR or TOP → "top"
  JUNGLA or JUNGLE → "jgl"
  CENTRAL or MID → "mid"
  INFERIOR, ADC, or BOT → "adc"
  SOPORTE or SUPPORT → "sup"

CHAMPION NAME FORMAT:
Return all champion names in Title Case: "Shaco", "Vel'Koz", "Miss Fortune", "Jhin". Never use ALL CAPS. Be careful with names starting with J (e.g. Jhin, Jinx, Jayce) — these start with the letter J, not I.

OUTPUT:
Respond with exactly this JSON, no markdown, no extra text:
{
  "userChampion": "ChampionName",
  "screenType": "loading" | "champion_select",
  "blueTeam": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "redTeam": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "blueLanes": ["top", "jgl", "mid", "adc", "sup"] or null,
  "confidence": "high" | "medium" | "low"
}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000); // 55s para dar margen a Vercel (60s limit)

  try {
    // 5. Llamada a Anthropic Vision (modelo exacto de coach.js)
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: image
                }
              },
              {
                type: "text",
                text: USER_PROMPT
              }
            ]
          }
        ],
      }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Error de comunicación con la IA" });
    }

    const aiText = data.content?.map(i => i.text || "").join("\n") || "";

    // 6. Parsing Robust (Patrón optimizado)
    const firstBrace = aiText.indexOf("{");
    let depth = 0;
    let lastBrace = -1;

    if (firstBrace !== -1) {
      for (let i = firstBrace; i < aiText.length; i++) {
        if (aiText[i] === "{") depth++;
        else if (aiText[i] === "}") {
          depth--;
          if (depth === 0) {
            lastBrace = i;
            break;
          }
        }
      }
    }

    if (lastBrace === -1) {
      return res.status(500).json({ error: "No se pudo interpretar la imagen" });
    }

    const parsedJson = JSON.parse(aiText.slice(firstBrace, lastBrace + 1));
    return res.status(200).json(parsedJson);

  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "La solicitud excedió el tiempo límite (timeout)." });
    }
    return res.status(500).json({ error: err.message });
  } finally {
    clearTimeout(timeout);
  }
}
