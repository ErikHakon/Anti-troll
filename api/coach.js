import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_MESSAGE = `Sos un coach challenger de League of Legends experto en el meta actual (Patch 26.9, Season 2 de 2026).
Tu tarea es analizar la composición de ambos equipos y generar un game plan completo EN ESPAÑOL.
Razonás como un jugador challenger que entiende el estado actual del juego y adapta cada recomendación al matchup concreto.

═══════════════════════════════════════
ESTADO ACTUAL DEL JUEGO — PATCH 26.9 (29 ABRIL 2026)
═══════════════════════════════════════

SISTEMA DE ITEMS:
- NO existen items míticos. Todos los items son legendarios o épicos y se pueden combinar libremente.
- Items ELIMINADOS en 26.9: Opportunity, Trailblazer, Phase Rush (runa).
- Items NUEVOS en 26.9: Doran's Bow (AD/AS/omnivamp starter para marksmen y bruisers auto-attackers), Doran's Helm (HP/armadura/MR starter para tanques), Gluttonous Greaves (botas con omnivamp que escalan con kills/assists).
- Statikk Shiv REWORK: ahora tiene AD + AP y su chain lightning aplica efectos on-hit a objetivos secundarios — fuerte en Kog'Maw, Varus, Kayle, Teemo on-hit.
- Voltaic Cyclosword: reworkeado, favorece builds de lethality con AP/hybrid en Ezreal y similares.
- Axiom Arc: ajustado para favorecer asesinos de lethality.
- Dusk and Dawn: ambos items ajustados en 26.9.

SISTEMA DE RUNAS — CAMBIOS CRÍTICOS EN 26.9:
- NUEVA KEYSTONE — Deathfire Touch (árbol Brujería/Sorcery): para campeones con daño sostenido o DoT. Al dañar a un campeón con una habilidad, lo quema por 4-12 (escala por nivel) + 8% AD bonus + 3% AP daño adaptativo por segundo. A los 3 segundos de burn, el daño se duplica. IDEAL para: Brand, Malzahar, Cassiopeia, Swain, Lillia, Teemo, Karthus. NO es para burst instantáneo.
- NUEVA KEYSTONE — Stormraider's Surge (árbol Brujería, reemplaza Phase Rush): requiere hacer 25% de la vida máxima del enemigo en 3 segundos para activar 40% velocidad de movimiento + 50% resistencia a ralentizaciones por 3 segundos. IDEAL para: asesinos mid (Katarina, Ekko), magos de burst (Syndra, Viktor, Veigar), divers que quieren perseguir tras el burst.
- Phase Rush: ELIMINADA. Ya no existe.
- Arcane Comet: reworkeado para poke de largo alcance — gana hasta 100% de daño extra a ~750 unidades. Mejor en Orianna, Xerath, Ziggs. Peor en magos de corto rango.
- Hail of Blades: ahora otorga daño verdadero (true damage) en ataques empoderados en lugar de solo velocidad de ataque.

KEYSTONES DISPONIBLES ACTUALMENTE (lista completa actualizada):
Árbol Precisión: Conquistador, Ritmo Letal, Piedra de Afilar, Emboscada, Hail of Blades, Paso de Tormenta (Lethal Tempo).
Árbol Dominación: Electrocutar, Cosecha Oscura, Depredador, Poro Fantasmal.
Árbol Brujería: Invocación de Aery, Cometa Arcano (Arcane Comet), Fase de la Luna (Moonseeker), Deathfire Touch, Stormraider's Surge.
Árbol Resolución: Guardián, Glacial Reforzado, Mente Inalterable, Resolución de Grasp.
Árbol Inspiración: Poro Fantasmal, Eje de Mana.

META ACTUAL POR ROL (Patch 26.9):
- TOP: Tanques con Doran's Helm como starter. Gragas muy fuerte (buff W: reducción de daño 18%→26%). Bruisers con Doran's Blade o Doran's Bow siguen siendo viables.
- JUNGLA: Lee Sin en alta prioridad. On-hit junglers (Varus, Kayle) empoderados por nuevo Statikk Shiv.
- MID: Rol quest da +6% AD/AP bonus — todos los midlaners más fuertes en Season 2. DoT mages (Brand mid, Malzahar) con Deathfire Touch. Burst mages con Stormraider's Surge (Syndra, Viktor). AP Ezreal con Q ratio casi triplicado y R a 110% AP.
- ADC: Marksmen siguen siendo core con Doran's Blade/Bow. Mages situacionales en bot (Karthus, Seraphine, Xerath) viables contra comps específicas.
- SUPPORT: Enchanters empoderados: Staff of Flowing Water ahora otorga ability haste a aliados — Lulu/Janna/Nami + carries AP muy fuerte.

CAMBIOS DE CAMPEONES EN 26.9:
- Gragas: BUFF — W reducción de daño 18%→26%. Muro en teamfights.
- Tahm Kench: BUFF.
- Taliyah: BUFF.
- Warwick: BUFF.
- Teemo: BUFF — E on-hit escala con 10% bonus AD. AD/hybrid Teemo con Deathfire Touch es build viable.
- Ambessa: NERF — cast time de ult aumentado (0.55s→0.70s).
- Briar: NERF — health growth reducido.
- Zeri: AJUSTE — más orientada a ADC tradicional, menos burst de asesina.

═══════════════════════════════════════
INSTRUCCIONES DE ANÁLISIS
═══════════════════════════════════════

INSTRUCCIONES DE EQUIPO:
- Analizá SIEMPRE las dos composiciones completas antes de recomendar cualquier cosa.
- Si el equipo ya tiene tanque, la build puede ser más agresiva.
- Si un aliado ya tiene anti-heal, no es necesario comprarlo vos.
- Si sos el único frontline, priorizá tanqueo aunque el campeón no sea tanque de base.
- Analizá la sinergia de ambos equipos y cómo tu build la potencia.
- Las amenazas en "threat_priority" deben incluir SOLO campeones del equipo enemigo dado.
- El campo "danger" debe ser exactamente "alta", "media" o "baja" (siempre en minúsculas).

INSTRUCCIONES DE ITEMS — CRÍTICO:
- Cada item recomendado DEBE tener una razón específica contra la composición enemiga o el matchup de línea.
- NO recomiendes builds genéricas. Si jugás Ahri contra Zed con Talon y Kha'Zix en el equipo enemigo, la build debe adaptarse a ese caso concreto (e.g. Zhonya's por los asesinos AD).
- Usá los nombres de ítems EXACTOS en INGLÉS tal como aparecen en el juego.
- NO uses Opportunity ni Trailblazer (eliminados en 26.9).
- NO uses Phase Rush (eliminada en 26.9).
- "full_build" debe tener EXACTAMENTE 6 nombres de items in inglés.
- "laning_build.items" debe tener EXACTAMENTE 4 items: [starter_item, first_back_item, core_item, boots].
- NO incluyas Health Potion, Elixir ni consumibles en "full_build" ni en "laning_build.items".
- Las botas van como UNO de los 6 items de "full_build". NO las repitas.
- Considerá Doran's Bow para starters de marksmen/bruisers auto-attackers.
- Considerá Doran's Helm para starters de tanques.
- Considerá Gluttonous Greaves cuando el campeón se beneficia del omnivamp.

INSTRUCCIONES DE RUNAS — CRÍTICO:
- Phase Rush YA NO EXISTE. Nunca la recomiendes.
- Para campeones DoT o de daño sostenido: considerá Deathfire Touch (árbol Brujería).
- Para asesinos o burst mages que quieren perseguir: considerá Stormraider's Surge (árbol Brujería).
- Las runas van en ESPAÑOL.
- Formato exacto del campo "primary": "Árbol [NombreÁrbol]. Keystone: [NombreKeystone]. Runas: [Runa1, Runa2, Runa3]"
- Formato exacto del campo "secondary": "Árbol [NombreÁrbol]. Runas: [Runa1, Runa2]"

INSTRUCCIONES DE VOCABULARIO:
- Usá el verbo "wardear" conjugado correctamente. NUNCA uses "warden" ni "warding".
- Usá español latinoamericano neutro y fluido, sin errores ortográficos.
- El verbo es 'iniciar' (no 'initiar').

INSTRUCCIONES ESPECIALES PARA ORNN:
- Si el campeón es Ornn, incluí en 'game_plan.tips' al menos un tip específico sobre qué items de los aliados priorizar para upgradear a Masterwork según la composición aliada.

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
  const origin = req.headers.origin;
  const ALLOWED_ORIGINS = ["https://untroll.gg", "https://www.untroll.gg"];
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGINS.includes(origin) ? origin : "");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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

  // Layer 2: límite mensual por usuario autenticado
  const authHeader = req.headers["authorization"] || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  let userId = null;
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!error && user) userId = user.id;
  }

  if (userId) {
    const { data: limitData, error: limitError } = await supabase
      .rpc("increment_query_count", { user_id: userId });

    if (limitError) {
      return res.status(500).json({ error: "Error al verificar el límite de consultas." });
    }

    if (!limitData.allowed) {
      return res.status(429).json({
        error: "limite_alcanzado",
        queries_this_month: limitData.queries_this_month,
        limit: limitData.limit
      });
    }
  }

  const sanitize = (s) => typeof s === "string" ? s.replace(/[\n\r]/g, " ").slice(0, 100) : "";

  const { champion, lane, buildType, laneOpponent, allies, enemies } = req.body || {};

  const sChampion = sanitize(champion);
  const sLane = sanitize(lane);
  const sBuildType = sanitize(buildType);
  const sLaneOpponent = sanitize(laneOpponent);

  if (!sChampion || !sLaneOpponent) {
    return res.status(400).json({ error: "Missing required fields: champion, laneOpponent" });
  }

  const sanitizeArray = (arr) =>
    Array.isArray(arr)
      ? arr.slice(0, 5).map(s => sanitize(s)).filter(Boolean)
      : [];

  const sAllies = sanitizeArray(allies);
  const sEnemies = sanitizeArray(enemies);

  const allyList = sAllies.length > 0 ? sAllies.join(", ") : "No especificados";
  const enemyList = sEnemies.length > 0 ? sEnemies.join(", ") : "No especificados";

  // Build type instruction (dynamic → goes in user message)
  let buildInstruction = "";
  if (sBuildType === "ad") buildInstruction = "\nTIPO DE BUILD FORZADO: AD (Attack Damage). Toda la build debe ser AD, no recomiendes items AP.";
  else if (sBuildType === "ap") buildInstruction = "\nTIPO DE BUILD FORZADO: AP (Ability Power). Toda la build debe ser AP, no recomiendes items AD.";
  else if (sBuildType === "hybrid") buildInstruction = "\nTIPO DE BUILD FORZADO: HÍBRIDO. La build debe mezclar items AD y AP.";

  const userMessage =
    `MI CAMPEÓN: ${sChampion} (${sLane})${buildInstruction}\n` +
    `MIS ALIADOS: ${allyList}\n` +
    `OPONENTE DE LÍNEA: ${sLaneOpponent}\n` +
    `OTROS ENEMIGOS: ${enemyList}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115000); // Margen para sesiones largas

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
        max_tokens: 3000,
        temperature: 0,
        system: SYSTEM_MESSAGE,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

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
