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
  const SYSTEM_PROMPT = `You are a League of Legends expert analyzing screenshots. You identify the 10 champions in a match using the text written on each champion card as your primary clue, combined with your knowledge of LoL skins.

Respond ONLY with valid JSON. No markdown fences, no explanation, no commentary.`;

  const USER_PROMPT = `Analyze this League of Legends screenshot. It is either a LOADING SCREEN or a CHAMPION SELECT screen.

── SCREEN TYPE ──
- "loading": two horizontal rows of 5 champion cards each.
- "champion_select": vertical list of 5 champions on the LEFT (user's allies, each with a Spanish lane label: SUPERIOR, JUNGLA, CENTRAL, INFERIOR, SOPORTE) and 5 on the RIGHT (enemies).

── FOR LOADING SCREEN: IDENTIFY CHAMPIONS FROM CARD TEXT ──

Each card has a full-body splash art. Inside the splash art, directly ABOVE the small circular summoner icon, there is ONE piece of text. This text is the champion name or the skin name.

Read that text first. Then use it — combined with your knowledge of LoL — to identify the BASE champion name. Always return the BASE champion name, never the skin name.

The text is in Spanish. Most skins contain the champion name as a substring:
- "Mordekaiser Pentakill" → Mordekaiser
- "Nocturne Eternum" → Nocturne  
- "Shen Amarillo" → Shen
- "Miss Fortune Gatillera Galáctica" → Miss Fortune
- "Jarvan IV Forja Oscura" → Jarvan IV
- "PROYECTO: Renekton" → Renekton
- "Malphite Estrella Oscura" → Malphite
- "Shaco Arcanista" → Shaco

Some skins have names that do NOT contain the champion name — you must know these:
- "El Shascanueces" → Shaco
- "Urfwick" → Warwick
- "Beemo" → Teemo
- "Yuumiel" → Yuumi
- "Sir Kled" → Kled
- "DJ Sona" → Sona

IGNORE all text BELOW the summoner icon — that is the player's summoner name or a decorative title ("Cazador de Caits", "Incendiario", "Ángel Guardián", "Diferencia de Carril Superior", etc.). It is NOT the champion.

Do NOT identify champions by the visual appearance of the splash art. Epic skins (Estrella Oscura, PROYECTO, Pentakill, Prestigioso, etc.) transform the champion's appearance completely — a champion may look nothing like their base form. The text is always more reliable than the visual.

── FOR CHAMPION SELECT ──

The LEFT side shows 5 allied champions in a vertical list. Each 
ally has a Spanish lane label (SUPERIOR, JUNGLA, CENTRAL, 
INFERIOR, SOPORTE) written next to their portrait. Read every 
lane label carefully — they are always explicit.

Identify the user by the golden/yellow summoner name on the 
ally list. The user IS one of the 5 allies on the left.

Return:
- "userChampion": the user's champion with the lane read from 
  their label on the left side.
- "allies": the OTHER 4 champions on the left side (NOT the 
  user), each with their lane read from their label. Must be 
  exactly 4 champions, all different from userChampion.
- "enemies": the 5 champions on the RIGHT side with inferred 
  lanes.

CRITICAL: userChampion + allies must total exactly 5 unique 
champions. Never include the user's champion inside allies. 
Never omit any of the 5 left-side champions.

Map Spanish lane labels: SUPERIOR → "top", JUNGLA → "jgl", 
CENTRAL → "mid", INFERIOR → "adc", SOPORTE → "sup".

── CHAMPION NAME FORMAT ──
Return the BASE champion name in Title Case with correct punctuation:
"Shaco", "Miss Fortune", "Jarvan IV", "Kai'Sa", "Cho'Gath", "Vel'Koz", 
"Lee Sin", "Tahm Kench", "Twisted Fate", "Dr. Mundo", "Aurelion Sol", 
"LeBlanc", "Nunu & Willump", "Bel'Veth", "K'Sante", "Kog'Maw", 
"Rek'Sai", "Kha'Zix", "Xin Zhao", "Master Yi", "Renata Glasc", "Wukong".

── JSON FORMAT FOR "loading" ──
{
  "screenType": "loading",
  "topRow": ["ChampionName", "ChampionName", "ChampionName", "ChampionName", "ChampionName"],
  "bottomRow": ["ChampionName", "ChampionName", "ChampionName", "ChampionName", "ChampionName"],
  "confidence": "high" | "medium" | "low"
}

── JSON FORMAT FOR "champion_select" ──
{
  "screenType": "champion_select",
  "userChampion": { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
  "allies": [
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" }
  ],
  "enemies": [
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" },
    { "champion": "ChampionName", "lane": "top|jgl|mid|adc|sup" }
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
