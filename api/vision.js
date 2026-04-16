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
  const SYSTEM_PROMPT = `You are analyzing a League of Legends screenshot.
Read the text visible on screen. Do not guess or infer — only report what you see.
Champion names MUST be returned in Title Case (e.g. "Shaco", "Vel'Koz", "Miss Fortune"), never ALL CAPS.
Respond ONLY with valid JSON, no markdown, no explanation.`;

  const USER_PROMPT = `Identify which type of League of Legends screen this is:

TYPE A — "loading": two HORIZONTAL rows of 5 large champion cards. Top row = blue team, bottom row = red team. No lane labels.

TYPE B — "champion_select": an equip/prepare screen. A VERTICAL list of 5 allied champions on the LEFT with LANE LABELS above each champion name. Labels can be in Spanish (SUPERIOR, JUNGLA, CENTRAL, INFERIOR, SOPORTE) or English (TOP, JUNGLE, MID, ADC, SUPPORT). Enemy champions appear on the RIGHT side as a vertical list WITHOUT lane labels.

CRITICAL lane value rules:
blueLanes MUST contain ONLY these 5 exact string values: "top", "jgl", "mid", "adc", "sup".
Translate whatever label you see to one of these 5 values. Use your knowledge of
League of Legends role terminology in any language.
Examples of translation (not exhaustive — apply the same logic for any variant):

"SUPERIOR" / "TOP" / "OBEN" / "HAUT" → "top"
"JUNGLA" / "JUNGLE" / "SELVA" / "BOSQUE" / "DSCHUNGEL" → "jgl"
"CENTRAL" / "MID" / "MIDDLE" / "MEDIO" → "mid"
"INFERIOR" / "ADC" / "BOT" / "BOTTOM" / "TIRADOR" / "ATIRADOR" → "adc"
"SOPORTE" / "SUPPORT" / "SOUTIEN" / "APOIO" → "sup"

If a label uses a word you don't recognize, infer the role from context
(position in the list, champion identity, etc.) and return the closest of
the 5 canonical values. Never return the original label text.

If TYPE A (loading):
- blueTeam = 5 champion names from top row, left to right
- redTeam = 5 champion names from bottom row, left to right
- blueLanes = null

If TYPE B (champion_select):
- blueTeam = 5 ally champion names (left column, top to bottom)
- blueLanes = 5 lane values for blueTeam in the same order, read from labels
- redTeam = 5 enemy champion names (right column, top to bottom)

For BOTH types: find the summoner name in YELLOW/GOLD — that champion is userChampion.

Respond with:
{
  "screenType": "loading" | "champion_select",
  "blueTeam": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "redTeam": ["Champion1", "Champion2", "Champion3", "Champion4", "Champion5"],
  "blueLanes": ["top", "jgl", "mid", "adc", "sup"] or null,
  "userChampion": "ChampionName",
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
