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
  const SYSTEM_PROMPT = `You are a League of Legends expert analyzing a loading screen screenshot.
You have TWO separate tasks. Complete them independently:

TASK 1 — IDENTIFY THE USER'S CHAMPION:
Look for the summoner name written in YELLOW or GOLDEN color on the left side (blue team).
The champion portrait directly next to that yellow/gold name is the user's champion.
This is purely a color recognition task — do not use position for this.

TASK 2 — ASSIGN LANES BY VERTICAL POSITION:
In a League of Legends loading screen, champions on each team are always 
listed vertically top to bottom in this exact order:
  1st (topmost) = top
  2nd = jungle
  3rd = mid
  4th = adc
  5th (bottommost) = support
Apply this positional rule to ALL 10 champions (both teams).

Respond ONLY with valid JSON, no markdown, no explanation.`;

  const USER_PROMPT = `Analyze this League of Legends loading screen.

Step 1: Find the summoner name in YELLOW/GOLD on the left (blue) team. 
The champion next to that name is "userChampion". Assign their lane by position.

Step 2: List the other 4 blue team champions as "allies", lanes by position.

Step 3: List all 5 red team champions as "enemies", lanes by position.

Respond with this exact JSON:
{
  "userChampion": {
    "champion": "ChampionName",
    "lane": "top|jungle|mid|adc|support"
  },
  "allies": [
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" }
  ],
  "enemies": [
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" },
    { "champion": "ChampionName", "lane": "top|jungle|mid|adc|support" }
  ],
  "confidence": "high|medium|low"
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
