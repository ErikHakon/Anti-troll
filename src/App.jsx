import { useState, useEffect, useRef } from "react";

/* ─── Champion Data ─── */
const CHAMPIONS = [
  "Aatrox","Ahri","Akali","Akshan","Alistar","Ambessa","Amumu","Anivia","Annie","Aphelios",
  "Ashe","Aurelion Sol","Aurora","Azir","Bard","Bel'Veth","Blitzcrank","Brand","Braum","Briar",
  "Caitlyn","Camille","Cassiopeia","Cho'Gath","Corki","Darius","Diana","Dr. Mundo","Draven",
  "Ekko","Elise","Evelynn","Ezreal","Fiddlesticks","Fiora","Fizz","Galio","Gangplank","Garen",
  "Gnar","Gragas","Graves","Gwen","Hecarim","Heimerdinger","Hwei","Illaoi","Irelia","Ivern",
  "Janna","Jarvan IV","Jax","Jayce","Jhin","Jinx","K'Sante","Kai'Sa","Kalista","Karma",
  "Karthus","Kassadin","Katarina","Kayle","Kayn","Kennen","Kha'Zix","Kindred","Kled","Kog'Maw",
  "LeBlanc","Lee Sin","Leona","Lillia","Lissandra","Lucian","Lulu","Lux","Malphite","Malzahar",
  "Maokai","Master Yi","Mel","Milio","Miss Fortune","Mordekaiser","Morgana","Naafiri","Nami",
  "Nasus","Nautilus","Neeko","Nidalee","Nilah","Nocturne","Nunu & Willump","Olaf","Orianna",
  "Ornn","Pantheon","Poppy","Pyke","Qiyana","Quinn","Rakan","Rammus","Rek'Sai","Rell",
  "Renata Glasc","Renekton","Rengar","Riven","Rumble","Ryze","Samira","Sejuani","Senna",
  "Seraphine","Sett","Shaco","Shen","Shyvana","Singed","Sion","Sivir","Skarner","Smolder",
  "Sona","Soraka","Swain","Sylas","Syndra","Tahm Kench","Taliyah","Talon","Taric","Teemo",
  "Thresh","Tristana","Trundle","Tryndamere","Twisted Fate","Twitch","Udyr","Urgot","Varus",
  "Vayne","Veigar","Vel'Koz","Vex","Vi","Viego","Viktor","Vladimir","Volibear","Warwick",
  "Wukong","Xayah","Xerath","Xin Zhao","Yasuo","Yone","Yorick","Yuumi","Zac","Zed","Zeri",
  "Ziggs","Zilean","Zoe","Zyra"
];
const LANES = ["TOP","MID","JGL","ADC","SUP"];
const LANE_ICONS = { TOP:"⚔️", MID:"🔥", JGL:"🌿", ADC:"🏹", SUP:"🛡️" };

function getChampIcon(name) {
  const f = name.replace(/['\s.]/g,"").replace("&Willump","");
  return `https://ddragon.leagueoflegends.com/cdn/15.6.1/img/champion/${f}.png`;
}

/* ─── Reusable Components ─── */
function ChampionPicker({ value, onChange, champions, placeholder, accentColor = "rgba(200,155,60,0.4)" }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = champions.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <div onClick={() => setOpen(!open)} style={{
        background: value ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.35)",
        border: `1px solid ${value ? accentColor : "rgba(255,255,255,0.06)"}`,
        borderRadius: 8, padding:"12px 16px", cursor:"pointer",
        display:"flex", alignItems:"center", gap:10, minHeight:52, transition:"all 0.2s",
      }}>
        {value ? (<>
          <img src={getChampIcon(value)} alt={value} style={{ width:32, height:32, borderRadius:4 }}
            onError={(e) => { e.target.style.display = "none"; }} />
          <span style={{ color:"#f0e6d2", fontSize:15, fontWeight:600 }}>{value}</span>
          <span onClick={(e) => { e.stopPropagation(); onChange(null); }}
            style={{ marginLeft:"auto", color:"#555", cursor:"pointer", fontSize:16 }}>✕</span>
        </>) : (
          <span style={{ color:"#666", fontSize:15 }}>{placeholder}</span>
        )}
      </div>
      {open && (
        <div style={{
          position:"absolute", top:"100%", left:0, right:0, zIndex:200,
          background:"#12121f", border:"1px solid rgba(200,155,60,0.25)", borderRadius:8,
          marginTop:4, boxShadow:"0 16px 48px rgba(0,0,0,0.9)", maxHeight:220, overflow:"hidden",
          display:"flex", flexDirection:"column",
        }}>
          <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..." style={{
              background:"rgba(0,0,0,0.6)", border:"none",
              borderBottom:"1px solid rgba(200,155,60,0.15)",
              color:"#f0e6d2", padding:"12px 14px", fontSize:15, outline:"none",
            }} />
          <div style={{ overflowY:"auto", flex:1 }}>
            {filtered.map(c => (
              <div key={c} onClick={() => { onChange(c); setOpen(false); setSearch(""); }}
                style={{
                  padding:"10px 14px", display:"flex", alignItems:"center", gap:10,
                  cursor:"pointer", color:"#c8c0b0", fontSize:15, transition:"background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(200,155,60,0.12)"; e.currentTarget.style.color = "#f0e6d2"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#c8c0b0"; }}
              >
                <img src={getChampIcon(c)} alt={c} style={{ width:28, height:28, borderRadius:3 }}
                  onError={(e) => { e.target.style.display = "none"; }} />
                {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, icon, color, children }) {
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background:`linear-gradient(135deg, ${color}12 0%, rgba(0,0,0,0.35) 60%)`,
      border:`1px solid ${color}35`, borderRadius:16, padding:28,
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
      <div style={{ position:"absolute", top:-30, right:-30, width:90, height:90, borderRadius:"50%", background:`radial-gradient(circle, ${color}12 0%, transparent 70%)`, pointerEvents:"none" }} />
      <div style={{ fontSize:17, fontWeight:800, color, marginBottom:14, display:"flex", alignItems:"center", gap:8, position:"relative" }}>
        {icon && <span style={{ fontSize:18 }}>{icon}</span>}{title}
      </div>
      <div style={{ position:"relative" }}>{children}</div>
    </div>
  );
}

function ItemBadge({ name, itemData, index, color }) {
  const id = itemData[name];
  return (
    <div className="item-badge" style={{
      background:`${color}0a`, border:`1px solid ${color}25`, borderRadius:8,
      padding:"8px 14px", fontSize:14, fontWeight:600, color,
      display:"flex", alignItems:"center", gap:8, cursor:"default",
      transition:"all 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 16px ${color}20`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
    >
      <span style={{ color:`${color}55`, fontSize:10, fontWeight:800 }}>{index+1}</span>
      {id && <img src={`https://ddragon.leagueoflegends.com/cdn/15.6.1/img/item/${id}.png`} alt={name}
        style={{ width:32, height:32, borderRadius:4 }} onError={(e) => { e.target.style.display="none"; }} />}
      {name}
    </div>
  );
}

function BuildRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display:"flex", gap:12, marginBottom:10, fontSize:15, alignItems:"center" }}>
      <span style={{ background:"rgba(255,255,255,0.05)", padding:"4px 12px", borderRadius:5, color:"#9a9590", fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:"1px", minWidth:86, flexShrink:0, textAlign:"center" }}>{label}</span>
      <span style={{ color:"#e8e0d0", lineHeight:1.5 }}>{value}</span>
    </div>
  );
}

function PhaseBlock({ label, text, color }) {
  if (!text) return null;
  return (
    <div style={{ marginBottom:12, padding:"12px 14px", borderLeft:`2px solid ${color}55`, borderRadius:"0 8px 8px 0", background:`linear-gradient(90deg, ${color}0a, transparent)` }}>
      <div style={{ fontSize:13, fontWeight:700, color, marginBottom:4, textTransform:"uppercase", letterSpacing:"1px" }}>{label}</div>
      <p style={{ margin:0, color:"#c8c0b0", fontSize:14, lineHeight:1.6 }}>{text}</p>
    </div>
  );
}

/* ─── Coach Tool ─── */
function CoachTool() {
  const [myChamp, setMyChamp] = useState(null);
  const [myLane, setMyLane] = useState("MID");
  const [laneOpponent, setLaneOpponent] = useState(null);
  const [enemies, setEnemies] = useState([null,null,null,null]);
  const [allies, setAllies] = useState([null,null,null,null]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [itemData, setItemData] = useState({});
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/item.json").then(r => r.json()),
      fetch("https://ddragon.leagueoflegends.com/cdn/15.6.1/data/es_ES/item.json").then(r => r.json()),
    ]).then(([enData, esData]) => {
      const lookup = {};
      for (const [id, item] of Object.entries(enData.data)) {
        lookup[item.name] = id;
      }
      for (const [id, item] of Object.entries(esData.data)) {
        lookup[item.name] = id;
      }
      setItemData(lookup);
    }).catch(() => {});
  }, []);

  const msgs = ["Analizando composición enemiga...","Evaluando sinergia de equipo...","Optimizando build contextual...","Generando game plan completo..."];
  useEffect(() => {
    if (!loading) return;
    const iv = setInterval(() => setLoadingMsg(p => (p+1) % msgs.length), 2500);
    return () => clearInterval(iv);
  }, [loading]);

  const usedChamps = [myChamp, laneOpponent, ...enemies, ...allies].filter(Boolean);
  const availableFor = (cur) => CHAMPIONS.filter(c => c === cur || !usedChamps.includes(c));
  const setEnemy = (i, v) => { const c = [...enemies]; c[i] = v; setEnemies(c); };
  const setAlly = (i, v) => { const c = [...allies]; c[i] = v; setAllies(c); };
  const canGenerate = myChamp && laneOpponent;
  const otherLanes = LANES.filter(l => l !== myLane);

  function getCacheKey() {
    const parts = [myChamp, myLane, laneOpponent, ...allies.filter(Boolean).sort(), ...enemies.filter(Boolean).sort()];
    return "rc_cache_" + parts.join("|");
  }

  async function generate(skipCache = false) {
    setLoading(true); setError(null); setResult(null); setLoadingMsg(0); setFromCache(false);
    const cacheKey = getCacheKey();

    if (!skipCache) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, ts } = JSON.parse(cached);
          if (Date.now() - ts < 24 * 60 * 60 * 1000) {
            setResult(data);
            setFromCache(true);
            setLoading(false);
            return;
          }
        }
      } catch {}
    }

    const allyList = allies.filter(Boolean);
    const prompt = `Sos un coach challenger de League of Legends. Analizá esta partida y dame un game plan completo EN ESPAÑOL. Considerá TANTO la composición enemiga COMO la de mi equipo.

MI CAMPEÓN: ${myChamp} (${myLane})
MIS ALIADOS: ${allyList.length > 0 ? allyList.join(", ") : "No especificados"}
OPONENTE DE LÍNEA: ${laneOpponent}
OTROS ENEMIGOS: ${enemies.filter(Boolean).join(", ") || "No especificados"}

IMPORTANTE: Tené en cuenta la composición de MI equipo para decidir la build. Si mi equipo ya tiene tanque, puedo buildear más agresivo. Si un aliado tiene anti-heal, no lo necesito yo. Si soy el único frontline, priorizo tanqueo. Analizá la sinergia y cómo mi build la potencia.

IMPORTANTE: Usá los nombres de ítems EXACTOS en ESPAÑOL como aparecen en el cliente del juego (ejemplo: 'Tempestad de Luden', 'Botas de hechicero', 'Sombra de Fuego'). NO uses nombres en inglés.
Usá los nombres de runas en ESPAÑOL (ejemplo: 'Electrocutar', 'Cosecha oscura', 'Conquistador').

Respondé SOLO con un JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "matchup_summary": "Resumen corto del matchup de línea (2-3 oraciones)",
  "damage_analysis": "Análisis del tipo de daño del equipo enemigo",
  "team_synergy": "Análisis de tu equipo: qué rol cumplís, qué le falta a tu comp, cómo tu build complementa",
  "laning_build": {
    "starter": "Item inicial + consumibles",
    "first_back": "Item de primer recall",
    "core_laning": "1-2 items para ganar la línea",
    "boots": "Botas recomendadas y por qué",
    "explanation": "Por qué estos items contra este matchup"
  },
  "teamfight_build": {
    "full_build": ["item1","item2","item3","item4","item5","item6"],
    "build_order": "Orden de compra considerando AMBOS equipos",
    "situational": "Items situacionales si el juego cambia"
  },
  "runes": {
    "primary": "Árbol + keystones",
    "secondary": "Árbol secundario + runas",
    "explanation": "Por qué estas runas contra esta comp"
  },
  "game_plan": {
    "early": "Cómo jugar la fase de línea (niveles 1-6)",
    "mid": "Qué hacer en mid game con tu equipo",
    "late": "Win condition del late game con tu comp",
    "tips": ["tip1","tip2","tip3"]
  }
}`;
    try {
      const res = await fetch("/api/coach", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || errData.error || `Error del servidor (${res.status})`);
      }
      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "";
      const clean = text.replace(/```json|```/g,"").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      try { localStorage.setItem(cacheKey, JSON.stringify({ data: parsed, ts: Date.now() })); } catch {}
    } catch(err) {
      console.error(err);
      setError(err.message || "Error al generar el análisis. Intentá de nuevo.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      {/* My Champ */}
      <div style={{ background:"rgba(200,155,60,0.05)", border:"1px solid rgba(200,155,60,0.25)", borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ fontSize:13, textTransform:"uppercase", letterSpacing:"2px", color:"#d4a843", marginBottom:12, fontWeight:700 }}>🎮 Tu campeón</div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <ChampionPicker value={myChamp} onChange={setMyChamp} champions={availableFor(myChamp)} placeholder="Seleccioná tu campeón" />
          </div>
          <div style={{ display:"flex", gap:3, background:"rgba(0,0,0,0.35)", borderRadius:8, padding:4, alignItems:"center" }}>
            {LANES.map(l => (
              <button key={l} onClick={() => setMyLane(l)} style={{
                background: myLane===l ? "rgba(200,155,60,0.25)":"transparent",
                border: myLane===l ? "1px solid rgba(200,155,60,0.4)":"1px solid transparent",
                color: myLane===l ? "#d4a843":"#6a6a6a", borderRadius:6, padding:"8px 10px",
                cursor:"pointer", fontSize:12, fontWeight:700, display:"flex", flexDirection:"column",
                alignItems:"center", gap:2, minWidth:42, transition:"all 0.2s",
              }}>
                <span style={{ fontSize:16 }}>{LANE_ICONS[l]}</span><span>{l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Allies */}
      <div style={{ background:"rgba(29,186,90,0.03)", border:"1px solid rgba(29,186,90,0.25)", borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ fontSize:13, textTransform:"uppercase", letterSpacing:"2px", color:"#2dd66a", marginBottom:12, fontWeight:700, display:"flex", justifyContent:"space-between" }}>
          <span>🤝 Tu equipo</span>
          <span style={{ fontSize:11, color:"#6a6a6a", fontWeight:400, textTransform:"none", letterSpacing:0 }}>Mejora el análisis</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {allies.map((a, i) => (
            <div key={i}>
              <div style={{ fontSize:12, color:"#6a6a6a", marginBottom:3, marginLeft:4, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:13 }}>{LANE_ICONS[otherLanes[i]]}</span>{otherLanes[i]}
              </div>
              <ChampionPicker value={a} onChange={(v) => setAlly(i,v)} champions={availableFor(a)} placeholder="Opcional" accentColor="rgba(29,186,90,0.4)" />
            </div>
          ))}
        </div>
      </div>

      {/* Enemies */}
      <div style={{ background:"rgba(232,64,87,0.03)", border:"1px solid rgba(232,64,87,0.25)", borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ fontSize:13, textTransform:"uppercase", letterSpacing:"2px", color:"#ff4d63", marginBottom:14, fontWeight:700 }}>👁️ Equipo Enemigo</div>
        <div style={{ background:"rgba(232,64,87,0.06)", border:"1px solid rgba(232,64,87,0.15)", borderRadius:8, padding:12, marginBottom:12 }}>
          <div style={{ fontSize:12, color:"#ff4d63", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:8, fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:14 }}>{LANE_ICONS[myLane]}</span>Tu oponente de línea ({myLane})
          </div>
          <ChampionPicker value={laneOpponent} onChange={setLaneOpponent} champions={availableFor(laneOpponent)} placeholder="¿Contra quién laneás?" accentColor="rgba(232,64,87,0.4)" />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {enemies.map((e, i) => (
            <div key={i}>
              <div style={{ fontSize:12, color:"#6a6a6a", marginBottom:3, marginLeft:4, display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:13 }}>{LANE_ICONS[otherLanes[i]]}</span>{otherLanes[i]}
              </div>
              <ChampionPicker value={e} onChange={(v) => setEnemy(i,v)} champions={availableFor(e)} placeholder="Opcional" accentColor="rgba(232,64,87,0.3)" />
            </div>
          ))}
        </div>
      </div>

      {/* Generate */}
      <button onClick={generate} disabled={!canGenerate || loading} className={loading ? "btn-loading-glow" : ""} style={{
        width:"100%", padding:"18px 28px",
        background: loading
          ? "linear-gradient(90deg, #785a28, #c89b3c, #f0d878, #c89b3c, #785a28)"
          : canGenerate ? "linear-gradient(135deg, #c89b3c, #a67c28)" : "rgba(255,255,255,0.04)",
        backgroundSize: loading ? "200% 100%" : "100% 100%",
        animation: loading ? "shimmer 2s linear infinite" : "none",
        color: canGenerate || loading ? "#0a0a1a" : "#6a6a6a",
        border:"none", borderRadius:10, fontSize:17, fontWeight:800,
        cursor: canGenerate && !loading ? "pointer":"not-allowed",
        textTransform:"uppercase", letterSpacing:"2px", transition:"background 0.3s, box-shadow 0.3s", marginBottom:24,
        boxShadow: loading
          ? undefined
          : canGenerate ? "0 4px 24px rgba(200,155,60,0.25)" : "none",
        fontFamily:"'Outfit',sans-serif",
      }}>
        {loading ? `🧠 ${msgs[loadingMsg]}` : "⚡ Generar Game Plan"}
      </button>

      {error && <div style={{ background:"rgba(232,64,87,0.08)", border:"1px solid rgba(232,64,87,0.25)", borderRadius:10, padding:16, color:"#e84057", fontSize:14, marginBottom:20 }}>{error}</div>}

      {result && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Champion Portraits Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, padding:"20px 0 8px", position:"relative" }}>
            <button onClick={() => generate(true)} style={{
              position:"absolute", right:0, top:16,
              background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:8, padding:"6px 12px", cursor:"pointer",
              color:"#8a8580", fontSize:12, fontWeight:600, fontFamily:"'Outfit',sans-serif",
              display:"flex", alignItems:"center", gap:4, transition:"all 0.2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background="rgba(200,155,60,0.1)"; e.currentTarget.style.borderColor="rgba(200,155,60,0.3)"; e.currentTarget.style.color="#c89b3c"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.color="#8a8580"; }}
            >🔄 Regenerar</button>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:80, height:80, borderRadius:14, border:"2px solid #2dd66a", boxShadow:"0 0 24px rgba(45,214,106,0.35)", overflow:"hidden" }}>
                <img src={getChampIcon(myChamp)} alt={myChamp} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:"#2dd66a" }}>{myChamp}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:900, color:"#6a6a6a", letterSpacing:2 }}>VS</div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div style={{ width:80, height:80, borderRadius:14, border:"2px solid #ff4d63", boxShadow:"0 0 24px rgba(255,77,99,0.35)", overflow:"hidden" }}>
                <img src={getChampIcon(laneOpponent)} alt={laneOpponent} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </div>
              <span style={{ fontSize:14, fontWeight:700, color:"#ff4d63" }}>{laneOpponent}</span>
            </div>
          </div>

          <ResultSection icon="📊" title="Análisis" color="#d4a843">
            <p style={{ margin:"0 0 10px", color:"#c8c0b0", lineHeight:1.6, fontSize:15 }}>{result.matchup_summary}</p>
            <div style={{ background:"rgba(212,168,67,0.1)", borderRadius:8, padding:"10px 14px", fontSize:14, color:"#d4a843", fontWeight:600 }}>{result.damage_analysis}</div>
          </ResultSection>
          {result.team_synergy && (
            <ResultSection icon="🤝" title="Sinergia de Equipo" color="#2dd66a">
              <p style={{ margin:0, color:"#c8c0b0", lineHeight:1.6, fontSize:14 }}>{result.team_synergy}</p>
            </ResultSection>
          )}
          <ResultSection icon="⚔️" title={`Build de Línea vs ${laneOpponent}`} color="#ff4d63">
            <BuildRow label="Inicio" value={result.laning_build?.starter} />
            <BuildRow label="1er Recall" value={result.laning_build?.first_back} />
            <BuildRow label="Core" value={result.laning_build?.core_laning} />
            <BuildRow label="Botas" value={result.laning_build?.boots} />
            {result.laning_build?.explanation && (
              <div style={{ marginTop:12, background:"rgba(255,77,99,0.06)", borderRadius:8, padding:"10px 14px", fontSize:14, lineHeight:1.5, color:"#c8c0b0", fontStyle:"italic" }}>{result.laning_build.explanation}</div>
            )}
          </ResultSection>
          <ResultSection icon="🏆" title="Build Completa" color="#12d9f5">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
              {result.teamfight_build?.full_build?.map((item, i) => (
                <ItemBadge key={i} name={item} itemData={itemData} index={i} color="#12d9f5" />
              ))}
            </div>
            <div style={{ background:"rgba(18,217,245,0.06)", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
              <p style={{ margin:0, color:"#c8c0b0", fontSize:14, lineHeight:1.5 }}>{result.teamfight_build?.build_order}</p>
            </div>
            <div style={{ background:"rgba(18,217,245,0.04)", borderRadius:8, padding:"10px 14px" }}>
              <p style={{ margin:0, color:"#c8c0b0", fontSize:14 }}><strong style={{ color:"#12d9f5" }}>Situacional:</strong> {result.teamfight_build?.situational}</p>
            </div>
          </ResultSection>
          <ResultSection icon="✨" title="Runas" color="#d07fff">
            <BuildRow label="Primarias" value={result.runes?.primary} />
            <BuildRow label="Secundarias" value={result.runes?.secondary} />
            {result.runes?.explanation && (
              <div style={{ marginTop:12, background:"rgba(208,127,255,0.06)", borderRadius:8, padding:"10px 14px", fontSize:14, lineHeight:1.5, color:"#c8c0b0", fontStyle:"italic" }}>{result.runes.explanation}</div>
            )}
          </ResultSection>
          <ResultSection icon="🗺️" title="Game Plan" color="#2dd66a">
            <PhaseBlock label="Early (1-6)" text={result.game_plan?.early} color="#ff4d63" />
            <PhaseBlock label="Mid Game" text={result.game_plan?.mid} color="#d4a843" />
            <PhaseBlock label="Late Game" text={result.game_plan?.late} color="#12d9f5" />
            {result.game_plan?.tips?.length > 0 && (
              <div style={{ marginTop:14, background:"rgba(45,214,106,0.08)", border:"1px solid rgba(45,214,106,0.2)", borderRadius:10, padding:16 }}>
                <div style={{ fontSize:13, color:"#2dd66a", fontWeight:700, marginBottom:10, textTransform:"uppercase", letterSpacing:"1px" }}>Pro Tips</div>
                {result.game_plan.tips.map((tip, i) => (
                  <div key={i}>
                    <div style={{ display:"flex", gap:8, padding:"8px 0", fontSize:14, color:"#c8c0b0", lineHeight:1.5 }}>
                      <span style={{ color:"#2dd66a", fontWeight:700, flexShrink:0 }}>→</span>{tip}
                    </div>
                    {i < result.game_plan.tips.length - 1 && (
                      <div style={{ height:1, background:"rgba(45,214,106,0.12)" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ResultSection>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [page, setPage] = useState("home");
  const [scrollY, setScrollY] = useState(0);
  const toolRef = useRef(null);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [authForm, setAuthForm] = useState({ email:"", password:"", username:"", region:"LAS" });
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const REGIONS = ["LAS","LAN","NA","EUW","EUNE","KR","JP","BR","OCE","TR","RU"];

  const handleAuth = (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setTimeout(() => {
      if (authMode === "register") {
        if (!authForm.email || !authForm.password || !authForm.username) {
          setAuthError("Completá todos los campos");
          setAuthLoading(false);
          return;
        }
        if (authForm.password.length < 6) {
          setAuthError("La contraseña debe tener al menos 6 caracteres");
          setAuthLoading(false);
          return;
        }
        setUser({ email: authForm.email, username: authForm.username, region: authForm.region });
        setPage("home");
      } else {
        if (!authForm.email || !authForm.password) {
          setAuthError("Completá email y contraseña");
          setAuthLoading(false);
          return;
        }
        setUser({ email: authForm.email, username: authForm.email.split("@")[0], region: "LAS" });
        setPage("home");
      }
      setAuthLoading(false);
      setAuthForm({ email:"", password:"", username:"", region:"LAS" });
    }, 800);
  };

  const logout = () => {
    setUser(null);
    setPage("home");
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTool = () => {
    setPage("home");
    setTimeout(() => toolRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; }
    body { background:#080810; color:#c8c8c8; font-family:'Outfit',sans-serif; overflow-x:hidden; }
    ::selection { background:rgba(200,155,60,0.3); color:#f0e6d2; }
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:rgba(0,0,0,0.3); }
    ::-webkit-scrollbar-thumb { background:rgba(200,155,60,0.3); border-radius:3px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
    @keyframes loadingGlow { 0%,100% { box-shadow:0 4px 24px rgba(200,155,60,0.25); } 50% { box-shadow:0 4px 40px rgba(200,155,60,0.5); } }
    .btn-loading-glow { animation: loadingGlow 1.5s ease-in-out infinite, shimmer 2s linear infinite; }
    .fade-up { animation:fadeUp 0.8s ease forwards; opacity:0; }
    .d1 { animation-delay:0.1s; } .d2 { animation-delay:0.2s; } .d3 { animation-delay:0.3s; } .d4 { animation-delay:0.4s; }
    .nav-link { color:#5b5a56; text-decoration:none; font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; transition:color 0.3s; cursor:pointer; background:none; border:none; font-family:'Outfit',sans-serif; }
    .nav-link:hover, .nav-link.active { color:#c89b3c; }
    .card { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.04); border-radius:16px; padding:32px 28px; transition:all 0.4s; }
    .card:hover { border-color:rgba(200,155,60,0.2); background:rgba(200,155,60,0.03); transform:translateY(-4px); }
    .btn-gold { background:linear-gradient(135deg,#c89b3c,#a07830); color:#080810; border:none; padding:16px 40px; border-radius:10px; font-size:16px; font-weight:800; cursor:pointer; text-transform:uppercase; letter-spacing:2px; transition:all 0.3s; font-family:'Outfit',sans-serif; }
    .btn-gold:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(200,155,60,0.35); }
    .btn-outline { background:transparent; color:#c89b3c; border:1px solid rgba(200,155,60,0.4); padding:16px 40px; border-radius:10px; font-size:16px; font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:2px; transition:all 0.3s; font-family:'Outfit',sans-serif; }
    .btn-outline:hover { background:rgba(200,155,60,0.08); border-color:#c89b3c; }
    .auth-input { width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:14px 16px; color:#f0e6d2; font-size:14px; font-family:'Outfit',sans-serif; outline:none; transition:border-color 0.3s; }
    .auth-input:focus { border-color:rgba(200,155,60,0.5); }
    .auth-input::placeholder { color:#3a3a3a; }
    .auth-select { width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:14px 16px; color:#f0e6d2; font-size:14px; font-family:'Outfit',sans-serif; outline:none; transition:border-color 0.3s; appearance:none; cursor:pointer; }
    .auth-select:focus { border-color:rgba(200,155,60,0.5); }
    .auth-select option { background:#12121f; color:#f0e6d2; }
  `;

  return (
    <>
      <style>{css}</style>

      {/* Nav */}
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:1000,
        background: scrollY > 50 ? "rgba(8,8,16,0.95)" : "transparent",
        backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
        borderBottom: scrollY > 50 ? "1px solid rgba(200,155,60,0.08)" : "1px solid transparent",
        transition:"all 0.4s", padding:"0 40px",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => { setPage("home"); window.scrollTo({top:0,behavior:"smooth"}); }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>⚡</div>
            <span style={{ fontSize:18, fontWeight:900, color:"#f0e6d2", letterSpacing:"-0.5px" }}>RIFT COACH</span>
            <span style={{ fontSize:11, fontWeight:700, color:"#c89b3c", background:"rgba(200,155,60,0.12)", padding:"2px 8px", borderRadius:4, letterSpacing:"1px" }}>AI</span>
          </div>
          <div style={{ display:"flex", gap:24, alignItems:"center" }}>
            <button className={`nav-link ${page==="home"?"active":""}`} onClick={() => { setPage("home"); window.scrollTo({top:0,behavior:"smooth"}); }}>Inicio</button>
            <button className="nav-link" onClick={scrollToTool}>Coach</button>
            <button className={`nav-link ${page==="legal"?"active":""}`} onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Legal</button>
            <div style={{ width:1, height:20, background:"rgba(255,255,255,0.06)", marginLeft:8 }} />
            {user ? (
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#c89b3c,#785a28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#080810" }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#f0e6d2", lineHeight:1.2 }}>{user.username}</div>
                    <div style={{ fontSize:10, color:"#5b5a56" }}>{user.region}</div>
                  </div>
                </div>
                <button onClick={logout} style={{ background:"none", border:"none", color:"#5b5a56", cursor:"pointer", fontSize:11, fontFamily:"'Outfit'", fontWeight:600, letterSpacing:"0.5px", transition:"color 0.3s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color="#e84057"}
                  onMouseLeave={(e) => e.currentTarget.style.color="#5b5a56"}>
                  Salir
                </button>
              </div>
            ) : (
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <button onClick={() => { setAuthMode("login"); setPage("auth"); setAuthError(null); window.scrollTo({top:0,behavior:"smooth"}); }}
                  style={{ background:"none", border:"1px solid rgba(200,155,60,0.3)", color:"#c89b3c", padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit'", transition:"all 0.3s", letterSpacing:"0.5px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background="rgba(200,155,60,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background="none"; }}>
                  Iniciar Sesión
                </button>
                <button onClick={() => { setAuthMode("register"); setPage("auth"); setAuthError(null); window.scrollTo({top:0,behavior:"smooth"}); }}
                  style={{ background:"linear-gradient(135deg,#c89b3c,#a07830)", border:"none", color:"#080810", padding:"8px 16px", borderRadius:6, fontSize:12, fontWeight:800, cursor:"pointer", fontFamily:"'Outfit'", transition:"all 0.3s", letterSpacing:"0.5px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform="translateY(0)"; }}>
                  Registrarse
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {page === "auth" ? (
        /* ─── Auth Page ─── */
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 24px" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,155,60,0.04) 0%, transparent 70%)" }} />
          <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
                <span style={{ fontSize:20, fontWeight:900, color:"#f0e6d2" }}>RIFT COACH AI</span>
              </div>
              <h2 style={{ fontSize:28, fontWeight:900, color:"#f0e6d2", marginBottom:8 }}>
                {authMode === "login" ? "Bienvenido de vuelta" : "Creá tu cuenta"}
              </h2>
              <p style={{ color:"#5b5a56", fontSize:14 }}>
                {authMode === "login" ? "Ingresá para acceder al coach" : "Registrate gratis y empezá a mejorar"}
              </p>
            </div>

            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:32 }}>
              {/* Auth mode tabs */}
              <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.3)", borderRadius:8, padding:3, marginBottom:24 }}>
                {["login","register"].map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthError(null); }}
                    style={{
                      flex:1, padding:"10px 0", borderRadius:6, border:"none", cursor:"pointer",
                      fontFamily:"'Outfit'", fontSize:13, fontWeight:700, transition:"all 0.3s",
                      background: authMode===m ? "rgba(200,155,60,0.2)" : "transparent",
                      color: authMode===m ? "#c89b3c" : "#5b5a56",
                    }}>
                    {m === "login" ? "Iniciar Sesión" : "Registrarse"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth} style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {authMode === "register" && (
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Nombre de Invocador</label>
                    <input className="auth-input" type="text" placeholder="Tu nombre en LoL"
                      value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} />
                  </div>
                )}

                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Email</label>
                  <input className="auth-input" type="email" placeholder="tu@email.com"
                    value={authForm.email} onChange={(e) => setAuthForm({...authForm, email: e.target.value})} />
                </div>

                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Contraseña</label>
                  <input className="auth-input" type="password" placeholder={authMode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                    value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />
                </div>

                {authMode === "register" && (
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Región</label>
                    <select className="auth-select" value={authForm.region}
                      onChange={(e) => setAuthForm({...authForm, region: e.target.value})}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {authError && (
                  <div style={{ background:"rgba(232,64,87,0.08)", border:"1px solid rgba(232,64,87,0.2)", borderRadius:8, padding:"10px 14px", color:"#e84057", fontSize:13 }}>
                    {authError}
                  </div>
                )}

                <button type="submit" disabled={authLoading} style={{
                  width:"100%", padding:"14px", marginTop:4,
                  background: authLoading ? "rgba(200,155,60,0.3)" : "linear-gradient(135deg,#c89b3c,#a07830)",
                  color:"#080810", border:"none", borderRadius:8, fontSize:15, fontWeight:800,
                  cursor: authLoading ? "wait" : "pointer", fontFamily:"'Outfit'",
                  letterSpacing:"1px", transition:"all 0.3s",
                }}>
                  {authLoading ? "Cargando..." : authMode === "login" ? "Ingresar" : "Crear Cuenta"}
                </button>
              </form>

              <div style={{ textAlign:"center", marginTop:20 }}>
                <span style={{ color:"#3a3a3a", fontSize:13 }}>
                  {authMode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
                </span>
                <button onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(null); }}
                  style={{ background:"none", border:"none", color:"#c89b3c", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Outfit'" }}>
                  {authMode === "login" ? "Registrate" : "Iniciá sesión"}
                </button>
              </div>
            </div>

            {authMode === "register" && (
              <p style={{ textAlign:"center", marginTop:16, color:"#2a2a2a", fontSize:11, lineHeight:1.6 }}>
                Al registrarte, aceptás los <span style={{ color:"#5b5a56", cursor:"pointer" }} onClick={() => setPage("legal")}>Términos de Servicio</span> y la <span style={{ color:"#5b5a56", cursor:"pointer" }} onClick={() => setPage("legal")}>Política de Privacidad</span>.
              </p>
            )}
          </div>
        </div>
      ) : page === "legal" ? (
        <div style={{ maxWidth:800, margin:"0 auto", padding:"100px 24px 60px" }}>
          <button onClick={() => setPage("home")} style={{ background:"none", border:"none", color:"#c89b3c", cursor:"pointer", fontSize:14, fontFamily:"'Outfit'", marginBottom:32, display:"flex", alignItems:"center", gap:6 }}>← Volver</button>
          <h1 style={{ fontSize:32, fontWeight:900, color:"#f0e6d2", marginBottom:40 }}>Legal</h1>

          <div style={{ marginBottom:48 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#c89b3c", marginBottom:16 }}>Términos de Servicio</h2>
            <div style={{ color:"#8a8a8a", lineHeight:1.8, fontSize:14 }}>
              <p style={{ marginBottom:16 }}>Al utilizar Rift Coach AI, aceptás estos términos. El servicio proporciona recomendaciones de builds y estrategias para League of Legends generadas por inteligencia artificial. Estas recomendaciones son orientativas y no garantizan resultados específicos en el juego.</p>
              <p style={{ marginBottom:16 }}>Rift Coach AI utiliza la API oficial de Riot Games para acceder a datos de partidas. Tu uso de este servicio está sujeto también a los Términos de Servicio de Riot Games.</p>
              <p style={{ marginBottom:16 }}>Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento. No somos responsables por decisiones tomadas en base a las recomendaciones de la IA.</p>
              <p style={{ marginBottom:16 }}>El servicio ofrece un tier gratuito con acceso a las funciones principales. Features premium adicionales pueden requerir suscripción.</p>
            </div>
          </div>

          <div style={{ marginBottom:48 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#c89b3c", marginBottom:16 }}>Política de Privacidad</h2>
            <div style={{ color:"#8a8a8a", lineHeight:1.8, fontSize:14 }}>
              <p style={{ marginBottom:16 }}>Rift Coach AI recopila únicamente la información necesaria para funcionar: nombre de invocador, región y datos de la partida en curso a través de la API de Riot Games.</p>
              <p style={{ marginBottom:16 }}>No almacenamos datos personales más allá de lo necesario para la sesión activa. No vendemos, compartimos ni transferimos tus datos a terceros.</p>
              <p style={{ marginBottom:16 }}>Podemos utilizar datos anonimizados y agregados para mejorar el servicio. Los datos de la API de Riot Games se manejan de acuerdo con sus políticas de desarrollador.</p>
              <p style={{ marginBottom:16 }}>Podés solicitar la eliminación de cualquier dato asociado a tu cuenta contactándonos directamente.</p>
            </div>
          </div>

          <div style={{ background:"rgba(200,155,60,0.05)", border:"1px solid rgba(200,155,60,0.12)", borderRadius:12, padding:24 }}>
            <p style={{ color:"#8a8a8a", fontSize:13, lineHeight:1.7, margin:0 }}>
              Rift Coach AI no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
            </p>
          </div>
        </div>
      ) : (
        <div>
          {/* Hero */}
          <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"80px 24px" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 40%, rgba(200,155,60,0.06) 0%, transparent 70%)" }} />
            <div style={{ position:"absolute", top:"15%", left:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,155,60,0.04) 0%, transparent 70%)", filter:"blur(60px)" }} />
            <div style={{ position:"absolute", bottom:"20%", right:"10%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(10,203,230,0.03) 0%, transparent 70%)", filter:"blur(50px)" }} />

            <div style={{ textAlign:"center", maxWidth:800, position:"relative", zIndex:1 }}>
              <div className="fade-up" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:24, background:"rgba(200,155,60,0.08)", border:"1px solid rgba(200,155,60,0.15)", borderRadius:100, padding:"8px 20px" }}>
                <span style={{ fontSize:13 }}>🧠</span>
                <span style={{ color:"#c89b3c", fontSize:12, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase" }}>Coaching con Inteligencia Artificial</span>
              </div>

              <h1 className="fade-up d1" style={{ fontSize:"clamp(40px, 6vw, 72px)", fontWeight:900, lineHeight:1.05, marginBottom:24, letterSpacing:"-2px" }}>
                <span style={{ color:"#f0e6d2" }}>Tu coach</span><br/>
                <span style={{ background:"linear-gradient(90deg, #c89b3c, #e8c56d, #c89b3c)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 4s linear infinite" }}>challenger</span><br/>
                <span style={{ color:"#f0e6d2" }}>personal</span>
              </h1>

              <p className="fade-up d2" style={{ fontSize:18, color:"#6a6a6a", lineHeight:1.7, maxWidth:560, margin:"0 auto 40px", fontWeight:400 }}>
                La primera herramienta que analiza ambas composiciones con IA y te da builds, runas y estrategia adaptada a tu partida exacta. No estadísticas genéricas. Razonamiento real.
              </p>

              <div className="fade-up d3" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
                <button className="btn-gold" onClick={scrollToTool}>Probar Ahora</button>
                <button className="btn-outline" onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Ver Features</button>
              </div>

              <div className="fade-up d4" style={{ marginTop:48, display:"flex", justifyContent:"center", gap:48 }}>
                {[["100%","Contextual"],["~10s","Respuesta"],["2 Equipos","Análisis"]].map(([n,l], i) => (
                  <div key={i} style={{ textAlign:"center" }}>
                    <div style={{ fontSize:28, fontWeight:900, color:"#c89b3c" }}>{n}</div>
                    <div style={{ fontSize:12, color:"#4a4a4a", textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tool - Right after hero */}
          <div ref={toolRef} style={{ padding:"80px 24px 100px", background:"linear-gradient(180deg, rgba(200,155,60,0.03) 0%, transparent 100%)", borderTop:"1px solid rgba(200,155,60,0.08)" }}>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <div style={{ fontSize:13, color:"#d4a843", textTransform:"uppercase", letterSpacing:"3px", fontWeight:700, marginBottom:12 }}>Herramienta</div>
              <h2 style={{ fontSize:42, fontWeight:900, color:"#f0e6d2", letterSpacing:"-1px", marginBottom:8 }}>AI Coach</h2>
              <p style={{ color:"#6a6a6a", fontSize:16 }}>Seleccioná los campeones y generá tu game plan</p>
            </div>
            <CoachTool />
          </div>

          {/* Features */}
          <div id="features" style={{ padding:"100px 24px", maxWidth:1100, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }}>
              <div style={{ fontSize:12, color:"#c89b3c", textTransform:"uppercase", letterSpacing:"3px", fontWeight:700, marginBottom:12 }}>¿Por qué es diferente?</div>
              <h2 style={{ fontSize:40, fontWeight:900, color:"#f0e6d2", letterSpacing:"-1px" }}>Lo que ninguna app te da</h2>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
              {[
                { icon:"🧠", title:"IA que razona", desc:"No busca winrates en una base de datos. Analiza POR QUÉ cada item es óptimo contra ESA composición y CON tu equipo." },
                { icon:"⚔️", title:"Build de línea vs teamfight", desc:"Separa la build en dos fases: items para ganar tu matchup directo, y items para las peleas de equipo." },
                { icon:"🤝", title:"Sinergia de equipo", desc:"Analiza a tus aliados. Si tu support ya tiene anti-heal, no lo comprás vos. Si sos el único tanque, priorizás defensivo." },
                { icon:"🗺️", title:"Game Plan completo", desc:"No solo items: te dice cómo jugar cada fase, cuándo pelear, cuándo farmear, y cuál es tu win condition." },
                { icon:"📊", title:"Análisis de daño", desc:"Identifica si el equipo enemigo es full AD, full AP o mixto, y adapta toda la build en consecuencia." },
                { icon:"💡", title:"Pro Tips contextuales", desc:"Tips específicos para TU partida, basados en las interacciones entre los 10 campeones." },
              ].map((f, i) => (
                <div key={i} className="card">
                  <div style={{ fontSize:32, marginBottom:16 }}>{f.icon}</div>
                  <h3 style={{ fontSize:18, fontWeight:800, color:"#f0e6d2", marginBottom:10 }}>{f.title}</h3>
                  <p style={{ fontSize:14, color:"#6a6a6a", lineHeight:1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div style={{ padding:"80px 24px", maxWidth:700, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <div style={{ fontSize:12, color:"#c89b3c", textTransform:"uppercase", letterSpacing:"3px", fontWeight:700, marginBottom:12 }}>3 pasos</div>
              <h2 style={{ fontSize:36, fontWeight:900, color:"#f0e6d2", letterSpacing:"-1px" }}>Cómo funciona</h2>
            </div>
            {[
              { num:"1", color:"#c89b3c", title:"Seleccioná los campeones", desc:"Elegí tu campeón, tu oponente de línea, y opcionalmente los otros 8 jugadores para máxima precisión." },
              { num:"2", color:"#0acbe6", title:"La IA analiza todo", desc:"En segundos, la IA analiza ambas composiciones, identifica amenazas, sinergias y debilidades." },
              { num:"3", color:"#1dba5a", title:"Recibí tu Game Plan", desc:"Build optimizada, runas, orden de compra y estrategia por fases. Todo personalizado para tu partida." },
            ].map((s, i) => (
              <div key={i} style={{ display:"flex", gap:20, marginBottom:40, alignItems:"flex-start" }}>
                <div style={{ width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:900, flexShrink:0, background:`${s.color}18`, color:s.color, border:`1px solid ${s.color}30` }}>{s.num}</div>
                <div>
                  <h3 style={{ fontSize:18, fontWeight:800, color:"#f0e6d2", marginBottom:6 }}>{s.title}</h3>
                  <p style={{ fontSize:14, color:"#6a6a6a", lineHeight:1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <footer style={{ padding:"40px 24px", borderTop:"1px solid rgba(255,255,255,0.04)", maxWidth:1100, margin:"0 auto" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:24, height:24, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>⚡</div>
                <span style={{ fontSize:14, fontWeight:800, color:"#5b5a56" }}>RIFT COACH AI</span>
              </div>
              <div style={{ display:"flex", gap:24 }}>
                <button className="nav-link" onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Términos</button>
                <button className="nav-link" onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Privacidad</button>
              </div>
            </div>
            <div style={{ marginTop:24, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.03)" }}>
              <p style={{ color:"#2a2a2a", fontSize:11, lineHeight:1.7, maxWidth:700 }}>
                Rift Coach AI no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
              </p>
            </div>
          </footer>
        </div>
      )}
    </>
  );
}
