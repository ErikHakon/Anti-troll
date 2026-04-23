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
  const SYSTEM_PROMPT = `You analyze League of Legends screenshots. You identify champions by their portraits. You return a strict JSON structure based on the screen type.

Respond ONLY with valid JSON. No markdown fences, no explanation, no commentary.`;

  const USER_PROMPT = `Analyze this League of Legends screenshot. It is either a LOADING SCREEN or a CHAMPION SELECT screen.

── STEP 1: IDENTIFY SCREEN TYPE ──
- "loading": two horizontal rows of 5 champion cards each. Each card shows a full-body champion splash art, and below it some text labels (summoner name and/or champion name).
- "champion_select": vertical list of 5 champions on the LEFT side (the user's allies, each with a Spanish lane label: SUPERIOR, JUNGLA, CENTRAL, INFERIOR, SOPORTE) and 5 champions on the RIGHT side (the enemy team).

── STEP 2: IDENTIFY CHAMPIONS ──
Identify all 10 champions by their portraits. Return the BASE champion name, NEVER the skin name. Examples: "Mordekaiser" (not "Mordekaiser Pentakill"); "Shaco" (not "Shaco Arcanista"); "Kled" (not "Sir Kled"); "Warwick" (not "Urfwick"); "Teemo" (not "Beemo"); "Yuumi" (not "Yuumiel"); "Lee Sin" (not "Lee Sin Muay Thai"); "Sett" (not "Sett Dragón de Obsidiana").

Write champion names in Title Case with correct punctuation: "Shaco", "Vel'Koz", "Miss Fortune", "Jhin", "Kai'Sa", "Cho'Gath", "Kog'Maw", "Rek'Sai", "Kha'Zix", "Lee Sin", "Master Yi", "Dr. Mundo", "Tahm Kench", "Twisted Fate".

── STEP 3: OUTPUT FORMAT ──

If screenType is "loading", you return TWO ROWS of 5 champions each, read strictly left-to-right as they appear on screen. Do NOT try to identify which row is the user's team. Do NOT try to identify the user. Just read the champions in order.

If screenType is "champion_select", you return the user's champion, the 4 other allies (with their Spanish lane labels mapped to codes), and the 5 enemies. Detect the user by the golden/yellow summoner name on the ally list.

── LANE CODES ──
Only use: "top", "jgl", "mid", "adc", "sup".
Map Spanish labels: SUPERIOR → "top", JUNGLA → "jgl", CENTRAL → "mid", INFERIOR → "adc", SOPORTE → "sup".

── JSON FORMAT FOR "loading" ──
{
  "screenType": "loading",
  "topRow": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "bottomRow": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "confidence": "high" | "medium" | "low"
}

── JSON FORMAT FOR "champion_select" ──
{
  "screenType": "champion_select",
  "userChampion": { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
  "allies": [
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" }
  ],
  "enemies": [
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" },
    { "champion": "ChampionName", "lane": "top" | "jgl" | "mid" | "adc" | "sup" }
  ],
  "confidence": "high" | "medium" | "low"
}

Respond with ONLY the JSON matching the detected screenType. No markdown.`;

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
