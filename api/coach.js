import { createClient } from "@supabase/supabase-js";

const SYSTEM_MESSAGE = `Sos un coach challenger de League of Legends experto en Season 2025.
Tu tarea es analizar la composición de ambos equipos y generar un game plan completo EN ESPAÑOL.

CONTEXTO DEL JUEGO:
- Estamos en Season 2025. NO uses items del sistema mítico (eliminado en 2024).
- El sistema de items actual no tiene categoría "mítico"; todos los items son legendarios o épicos.

INSTRUCCIONES DE EQUIPO:
- Considerá TANTO la composición enemiga COMO la de tu equipo aliado.
- Si el equipo ya tiene tanque, la build puede ser más agresiva.
- Si un aliado ya tiene anti-heal, no es necesario comprarlo vos.
- Si sos el único frontline, priorizá tanqueo.
- Analizá la sinergia de ambos equipos y cómo tu build la potencia.
- Las amenazas en "threat_priority" deben incluir SOLO campeones del equipo enemigo dado.
- El campo "danger" debe ser exactamente "alta", "media" o "baja" (siempre en minúsculas).

INSTRUCCIONES DE ITEMS:
- Usá los nombres de ítems EXACTOS en INGLÉS tal como aparecen en el juego.
- NO traduzcas los nombres de items.
- NO inventes nombres de items. Si no recordás el nombre exacto, usá el más similar que conozcás con certeza.
- "full_build" debe tener EXACTAMENTE 6 nombres de items en inglés, nada más y nada menos.
- "laning_build.items" debe tener EXACTAMENTE 4 items: [starter_item, first_back_item, core_item, boots].
- NO incluyas Health Potion, Elixir ni consumibles en "full_build" ni en "laning_build.items".
- Las botas van como UNO de los 6 items de "full_build". NO las repitas.

INSTRUCCIONES DE RUNAS:
- Las runas van en ESPAÑOL.
- Formato exacto del campo "primary": "Árbol [NombreÁrbol]. Keystone: [NombreKeystone]. Runas: [Runa1, Runa2, Runa3]"
- Formato exacto del campo "secondary": "Árbol [NombreÁrbol]. Runas: [Runa1, Runa2]"
- Keystones disponibles en español: Electrocutar, Cosecha oscura, Depredador, Poro fantasmal, Conquistador, Ritmo letal, Piedra de afilar, Emboscada, Paso de tormenta, Eje de mana, Invocación de Aery, Cometa arcano, Fase de la Luna, Guardián, Glacial reforzado, Mente inalterable, Resolución de Grasp

INSTRUCCIONES DE VOCABULARIO:
- En los textos sobre wards, usá el verbo "wardear" conjugado correctamente en español (ej: "wardeá el río", "wardear el objetivo", "wardeando la base enemiga"). NUNCA uses "warden" ni "warding".

FORMATO DE RESPUESTA:
Respondé SOLO con un JSON válido. Sin markdown, sin backticks, sin texto antes o después del JSON.
Usá esta estructura exacta:
{
  "matchup_summary": "Resumen corto del matchup de línea (2-3 oraciones)",
  "damage_analysis": "Análisis del tipo de daño del equipo enemigo (AD/AP/mixto y qué campeones lo componen)",
  "team_synergy": "Análisis del equipo: qué rol cumplís, qué le falta a tu comp, cómo tu build complementa",
  "laning_build": {
    "starter": "Item inicial + consumibles (texto descriptivo)",
    "first_back": "Item de primer recall (texto descriptivo)",
    "core_laning": "1-2 items para dominar la línea (texto descriptivo)",
    "boots": "Botas recomendadas y razón (texto descriptivo)",
    "items": ["Doran's Blade", "Long Sword", "Kraken Slayer", "Berserker's Greaves"],
    "explanation": "Por qué estos items contra este matchup específico"
  },
  "teamfight_build": {
    "full_build": ["Kraken Slayer", "Berserker's Greaves", "Runaan's Hurricane", "Guinsoo's Rageblade", "Blade of the Ruined King", "Mortal Reminder"],
    "build_order": "Orden de compra considerando ambos equipos (texto descriptivo)",
    "situational": "Items situacionales si el juego cambia (texto descriptivo)"
  },
  "runes": {
    "primary": "Árbol Precisión. Keystone: Conquistador. Runas: Triunfo, Leyenda: Linaje, Último éxito",
    "secondary": "Árbol Brujería. Runas: Banda de flujo, Tormenta del que reúne",
    "explanation": "Por qué estas runas contra esta comp"
  },
  "game_plan": {
    "early": "Cómo jugar la fase de línea (niveles 1-6)",
    "mid": "Qué hacer en mid game con tu equipo",
    "late": "Win condition del late game con esta comp",
    "tips": ["Tip específico 1", "Tip específico 2", "Tip específico 3"]
  },
  "win_condition": "Ganás esta partida si... (una oración clara y accionable)",
  "power_spikes": [
    { "timing": "Nivel 2", "description": "Por qué sos fuerte en este punto" },
    { "timing": "Nivel 6", "description": "Por qué sos fuerte aquí" },
    { "timing": "2 items", "description": "Por qué sos fuerte aquí" }
  ],
  "threat_priority": [
    { "champion": "NombreExactoDelCampeón", "danger": "alta", "reason": "Por qué es peligroso para vos" }
  ],
  "combos": {
    "trading": "Combo corto para tradear en línea (ej: Q > AA > E > retroceder)",
    "all_in": "Combo completo para all-in o kill",
    "teamfight": "Qué hacer en teamfight (ej: R para engage, W para peel, focus al carry)"
  },
  "ward_spots": "Dónde wardear según la fase del juego y el matchup"
}`;

// Global map for IP rate limiting (persisting across warm executions in Vercel)
const ipCache = new Map();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Layer 1: IP-based Rate Limiting (10 req/hour)
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const userData = ipCache.get(ip) || { count: 0, firstReset: now };

  // Reset window if more than 1 hour passed
  if (now - userData.firstReset > 3600000) {
    userData.count = 1;
    userData.firstReset = now;
  } else {
    userData.count++;
  }
  ipCache.set(ip, userData);

  if (userData.count > 10) {
    return res.status(429).json({ error: "Demasiadas consultas. Esperá un momento antes de continuar." });
  }

  // Layer 2: Supabase-based Rate Limiting (20 analysis/day)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (user && !authError) {
      // Call Supabase RPC function (assumed to exist in DB as per user instructions)
      const { data: canProceed, error: rpcError } = await supabaseAdmin.rpc("check_rate_limit", { user_id: user.id });
      if (rpcError) console.error("RPC Error:", rpcError);
      
      if (canProceed === false) {
        return res.status(429).json({ error: "Límite diario alcanzado (20 análisis/día). Volvé mañana." });
      }
    }
  }


  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { champion, lane, buildType, laneOpponent, allies, enemies } = req.body || {};

  if (!champion || !laneOpponent) {
    return res.status(400).json({ error: "Missing required fields: champion, laneOpponent" });
  }

  // Build type instruction (dynamic → goes in user message)
  let buildInstruction = "";
  if (buildType === "ad") buildInstruction = "\nTIPO DE BUILD FORZADO: AD (Attack Damage). Toda la build debe ser AD, no recomiendes items AP.";
  else if (buildType === "ap") buildInstruction = "\nTIPO DE BUILD FORZADO: AP (Ability Power). Toda la build debe ser AP, no recomiendes items AD.";
  else if (buildType === "hybrid") buildInstruction = "\nTIPO DE BUILD FORZADO: HÍBRIDO. La build debe mezclar items AD y AP.";

  const allyList = Array.isArray(allies) && allies.length > 0 ? allies.join(", ") : "No especificados";
  const enemyList = Array.isArray(enemies) && enemies.length > 0 ? enemies.join(", ") : "No especificados";

  const userMessage =
    `MI CAMPEÓN: ${champion} (${lane})${buildInstruction}\n` +
    `MIS ALIADOS: ${allyList}\n` +
    `OPONENTE DE LÍNEA: ${laneOpponent}\n` +
    `OTROS ENEMIGOS: ${enemyList}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 6000,
        temperature: 0,
        system: SYSTEM_MESSAGE,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const anthropicError = data.error || {};
      const type = anthropicError.type;
      const message = anthropicError.message || "";

      if (type === "insufficient_funds" || message.includes("credit") || response.status === 402) {
        return res.status(402).json({ error: "El servicio no está disponible temporalmente. Intentá más tarde." });
      }
      if (response.status === 429 || type === "rate_limit_error") {
        return res.status(429).json({ error: "Demasiadas consultas. Esperá unos segundos antes de reintentar." });
      }
      return res.status(503).json({ error: "El servicio de IA no está disponible en este momento. Intentá más tarde." });
    }

    // Detect token truncation before returning to client
    if (data.stop_reason === "max_tokens") {
      return res.status(422).json({ error: "La respuesta fue muy larga. Intentá con menos campeones seleccionados." });
    }

    return res.status(200).json(data);
  } catch (err) {
    if (err.name === "AbortError") {
      return res.status(504).json({ error: "La solicitud a la IA excedió el tiempo límite." });
    }
    return res.status(503).json({ error: "Error de conexión con el proveedor de IA. Intentá más tarde." });
  } finally {
    clearTimeout(timeout);
  }
}
