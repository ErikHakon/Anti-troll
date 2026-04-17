import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./supabaseClient";
import HCaptcha from '@hcaptcha/react-hcaptcha';
import CompleteProfileModal from "./CompleteProfileModal";

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

// DDragon dynamic version
const DDRAGON_VER_CACHE_KEY = "rc_ddragon_ver";
const DDRAGON_VER_TTL = 60 * 60 * 1000; // 1 hora

const DEFAULT_DDRAGON_VER = "15.6.1";
const STOP_WORDS = new Set(["de","del","la","el","los","las","un","una","y","o","the","of","a","and","s","to","in","en"]);
let GLOBAL_DDRAGON_VER = DEFAULT_DDRAGON_VER;

function ddragonUrl(path, ver = GLOBAL_DDRAGON_VER) {
  return `https://ddragon.leagueoflegends.com/cdn/${ver}/${path}`;
}

// DDragon champion filename overrides
const CHAMP_FILE_NAMES = {
  "Wukong":"MonkeyKing", "Cho'Gath":"Chogath", "Kha'Zix":"Khazix",
  "Kai'Sa":"Kaisa", "Vel'Koz":"Velkoz", "Kog'Maw":"KogMaw",
  "Rek'Sai":"RekSai", "Bel'Veth":"Belveth", "K'Sante":"KSante",
  "LeBlanc":"Leblanc", "Nunu & Willump":"Nunu",
  "Renata Glasc":"Renata", "Jarvan IV":"JarvanIV",
  "Lee Sin":"LeeSin", "Master Yi":"MasterYi", "Miss Fortune":"MissFortune",
  "Tahm Kench":"TahmKench", "Twisted Fate":"TwistedFate", "Xin Zhao":"XinZhao",
  "Aurelion Sol":"AurelionSol", "Dr. Mundo":"DrMundo",
  "Mel":"Mel",
};

function getChampIcon(name, ver = GLOBAL_DDRAGON_VER) {
  if (!name) return "";
  const override = CHAMP_FILE_NAMES[name];
  if (override) return ddragonUrl(`img/champion/${override}.png`, ver);
  const f = name.replace(/['\s.]/g,"").replace("&Willump","");
  return ddragonUrl(`img/champion/${f}.png`, ver);
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
          <ChampPortrait name={value} size={32} />
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
                <ChampPortrait name={c} size={28} />
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("ERROR BOUNDARY:", error, errorInfo.componentStack); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 30, background: "rgba(232,64,87,0.06)", border: "1px solid rgba(232,64,87,0.2)", borderRadius: 16, color: "#ff4d63", textAlign: "center", margin: "20px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h3 style={{ marginBottom: 10, color: "#f0e6d2" }}>Error al renderizar los resultados</h3>
          <p style={{ color: "#9a9590", marginBottom: 20 }}>La IA devolvió datos en un formato inesperado que impidió mostrar el análisis.</p>
          <button onClick={() => window.location.reload()} style={{ background: "#ff4d63", border: "none", color: "#080810", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 800, cursor: "pointer", transition: "0.2s" }}>Recargar App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function normalize(str) {
  if (typeof str !== 'string') return "";
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['\-]/g, " ").replace(/[^a-z0-9\s]/g, "").trim();
}

// Only for items where AI name shares ZERO words with DDragon name
const ITEM_NAME_ALIASES = {
  "sombra de fuego":["Shadowflame","Llamasombría"],
  "velo de la banshee":["Banshee's Veil","Velo del hada de la muerte"],
  "velo especial":["Banshee's Veil","Velo del hada de la muerte"],
  "banshee":["Banshee's Veil","Velo del hada de la muerte"],
  "malla mórfica":["Jak'Sho, The Protean"],
  "malla morfica":["Jak'Sho, The Protean"],
  "malla de espinas":["Thornmail"],
  "malla ósea":["Dead Man's Plate"],
  "malla osea":["Dead Man's Plate"],
  "fuerza de la naturaleza":["Force of Nature"],
  "cimitarra mercurial":["Mercurial Scimitar"],
  "sed de sangre":["Bloodthirster"],
  "anillo de poder":["Doran's Ring"],
  "botas de velocidad":["Boots of Swiftness"],
  // Ornn Masterwork Upgrades (Legacy names used by AI)
  "forgefire crest":["Sunfire Aegis", "Égida de fuego solar"],
  "cresta de forja":["Sunfire Aegis", "Égida de fuego solar"],
  "the leviathan":["Heartsteel", "Corazón de acero"],
  "el leviatan":["Heartsteel", "Corazón de acero"],
  "the unspoken promise":["Jak'Sho, The Protean", "Jak'Sho, el Proteico"],
  "rabadon's ascendance":["Rabadon's Deathcap", "Sombrero mortal de Rabadon"],
  "ascendencia de rabadon":["Rabadon's Deathcap", "Sombrero mortal de Rabadon"],
  "eternal winter":["Everfrost", "Invierno Eterno"],
  "dragonhead stoneplate":["Gargoyle Stoneplate"],
};

// Build keyword index from DDragon data (called once after fetch)
function buildItemKeywordIndex(itemData) {
  const keywordIndex = {}; // keyword → itemId[]
  
  const allExact = { ...itemData.exactEN, ...itemData.exactES };
  for (const [name, id] of Object.entries(allExact)) {
    const words = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")
      .split(/[\s']+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));
    for (const w of words) {
      if (!keywordIndex[w]) keywordIndex[w] = [];
      if (!keywordIndex[w].includes(id)) keywordIndex[w].push(id);
    }
  }
  return keywordIndex;
}

function findItemId(name, itemData) {
  if (!itemData.exactEN) return null;
  let trimmed = name.includes(" o ") ? name.split(" o ")[0].trim() : name.trim();
  
  // 0. Check alias map
  const aliasKey = trimmed.toLowerCase();
  const candidates = ITEM_NAME_ALIASES[aliasKey];
  if (candidates) {
    for (const candidate of candidates) {
      if (itemData.exactEN[candidate]) return itemData.exactEN[candidate];
      if (itemData.exactES[candidate]) return itemData.exactES[candidate];
      const nc = normalize(candidate);
      if (itemData.normEN[nc]) return itemData.normEN[nc];
      if (itemData.normES[nc]) return itemData.normES[nc];
    }
  }
  // 1. Exact match (EN first, more reliable)
  if (itemData.exactEN[trimmed]) return itemData.exactEN[trimmed];
  if (itemData.exactES[trimmed]) return itemData.exactES[trimmed];
  // 2. Normalized exact
  const norm = normalize(trimmed);
  if (itemData.normEN[norm]) return itemData.normEN[norm];
  if (itemData.normES[norm]) return itemData.normES[norm];
  // 3. Keyword match: extract words from name, check keyword index
  if (itemData.keywords) {
    const words = norm.split(/[^a-z0-9]+/).filter(w => w.length >= 4 && !STOP_WORDS.has(w));
    // Try longest/most unique words first
    const sorted = [...words].sort((a, b) => b.length - a.length);
    for (const w of sorted) {
      if (itemData.keywords[w]) return itemData.keywords[w][0];
    }
  }
  return null;
}

function findRuneIcon(name, runeData) {
  if (!runeData.exact) return null;
  const trimmed = name.trim();
  if (runeData.exact[trimmed]) return runeData.exact[trimmed];
  const norm = normalize(trimmed);
  if (runeData.normalized[norm]) return runeData.normalized[norm];
  const normWords = norm.split(/\s+/).filter(Boolean);
  if (normWords.length === 0) return null;

  const normKeys = Object.keys(runeData.normalized);
  for (const k of normKeys) {
    const kWords = k.split(/\s+/);
    // Verifica que cada palabra de la búsqueda esté presente como palabra completa en la clave
    const allWordsMatch = normWords.every(nw => kWords.includes(nw));
    if (allWordsMatch) return runeData.normalized[k];
  }
  return null;
}

function ChampPortrait({ name, size = 32, border = "none", shadow = "none", style = {}, ver = GLOBAL_DDRAGON_VER }) {
  const [error, setError] = useState(false);
  const iconUrl = getChampIcon(name, ver);

  if (error || !name) {
    const initial = name ? name.charAt(0) : "?";
    return (
      <div style={{ 
        width: size, height: size, borderRadius: size/8, 
        background: "linear-gradient(135deg, #1e2328, #111)", 
        border, boxShadow: shadow,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#c89b3c", fontSize: size/2, fontWeight: 800, fontFamily: "serif",
        flexShrink: 0, ...style
      }}>
        {initial}
      </div>
    );
  }

  return (
    <img src={iconUrl} alt={name} 
      style={{ width: size, height: size, borderRadius: size/8, border, boxShadow: shadow, objectFit: "cover", flexShrink: 0, ...style }}
      onError={() => setError(true)} />
  );
}

function MiniLaneSelector({ value, onChange }) {
  return (
    <div style={{ display:"flex", gap:2, background:"rgba(0,0,0,0.3)", borderRadius:6, padding:2, width:"fit-content" }}>
      {LANES.map(l => (
        <button key={l} onClick={() => onChange(value === l ? null : l)} style={{
          background: value === l ? "rgba(200,155,60,0.2)" : "transparent",
          border: "none", color: value === l ? "#d4a843" : "#444",
          borderRadius:4, width:24, height:24, cursor:"pointer", fontSize:12,
          display:"flex", alignItems:"center", justifyContent:"center", transition:"0.2s",
          padding: 0
        }} title={l}>
          {LANE_ICONS[l]}
        </button>
      ))}
      {!value && <span style={{ color:"#444", fontSize:10, marginLeft:4, alignSelf:"center", fontWeight:800 }}>?</span>}
    </div>
  );
}

function RuneBadge({ name, runeData, color }) {
  const icon = findRuneIcon(name, runeData);
  return (
    <div style={{
      background:`${color}0a`, border:`1px solid ${color}25`, borderRadius:8,
      padding:"6px 12px", fontSize:13, fontWeight:600, color,
      display:"inline-flex", alignItems:"center", gap:6, transition:"all 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 4px 16px ${color}20`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
    >
      {icon && <img src={icon} alt={name} style={{ width:24, height:24, borderRadius:4 }} onError={(e) => { e.target.style.display="none"; }} />}
      {name}
    </div>
  );
}

function RunesList({ text, runeData, color }) {
  if (!text || !runeData.exact) return <span style={{ color:"#c8c0b0", fontSize:14 }}>{text}</span>;
  
  // Split text by common separators to find individual rune names
  const allNames = [...Object.keys(runeData.exact)];
  
  // Known rune trees for prominent display
  const treesES = ["Precisión","Dominación","Brujería","Valor","Inspiración"];
  const treesEN = ["Precision","Domination","Sorcery","Resolve","Inspiration"];
  const allTrees = [...treesES, ...treesEN];
  
  // Find tree name in text
  const foundTree = allTrees.find(t => text.toLowerCase().includes(t.toLowerCase()));
  const treeIcon = foundTree ? findRuneIcon(foundTree, runeData) : null;
  
  // Find individual runes (not trees)
  const found = allNames.filter(rn => {
    if (allTrees.some(t => t.toLowerCase() === rn.toLowerCase())) return false;
    // Word boundary regex for higher accuracy
    const regex = new RegExp(`\\b${rn.toLowerCase().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\b`);
    return regex.test(text.toLowerCase()) && rn.length > 3;
  });
  
  // Deduplicate by normalized name
  const seen = new Set();
  const deduped = found.filter(rn => {
    const n = normalize(rn);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });

  if (deduped.length === 0 && !foundTree) return <span style={{ color:"#c8c0b0", fontSize:14 }}>{text}</span>;
  
  return (
    <div>
      {foundTree && (
        <div style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:8, padding:"4px 10px", background:`${color}15`, borderRadius:6, border:`1px solid ${color}30` }}>
          {treeIcon && <img src={treeIcon} alt={foundTree} style={{ width:20, height:20 }} onError={(e) => { e.target.style.display="none"; }} />}
          <span style={{ fontSize:13, fontWeight:700, color }}>{foundTree}</span>
        </div>
      )}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginTop: foundTree ? 6 : 0 }}>
        {deduped.map((rn, i) => <RuneBadge key={i} name={rn} runeData={runeData} color={color} />)}
      </div>
    </div>
  );
}

function ItemBadge({ name, itemData, index, color }) {
  const id = findItemId(name, itemData);
  const displayName = (id && itemData.names?.[id]) ? itemData.names[id] : name;
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
      {id && <img src={`${ddragonUrl(`img/item/${id}.png`)}`} alt={displayName}
        style={{ width:32, height:32, borderRadius:4 }} onError={(e) => { e.target.style.display="none"; }} />}
      {displayName}
    </div>
  );
}

function BuildRow({ label, value, itemData }) {
  if (!value || !itemData?.exactEN) return null;
  const normalizedText = normalize(value);
  const wordsForSliding = normalizedText.split(/\s+/);
  const foundIds = [];
  const seen = new Set();

  // 1. Sliding window para aliases multi-palabra (4 a 2 palabras)
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= wordsForSliding.length - len; i++) {
      const phrase = wordsForSliding.slice(i, i + len).join(" ");
      if (phrase.length < 5) continue;
      const id = findItemId(phrase, itemData);
      if (id && !seen.has(id)) {
        foundIds.push(id);
        seen.add(id);
      }
    }
  }

  // 2. Palabras individuales
  for (const word of wordsForSliding.filter(w => w.length >= 4)) {
    const id = findItemId(word, itemData);
    if (id && !seen.has(id)) {
      foundIds.push(id);
      seen.add(id);
    }
  }

  return (
    <div style={{ display:"flex", gap:12, marginBottom:10, fontSize:15, alignItems:"flex-start" }}>
      <span style={{ background:"rgba(255,255,255,0.05)", padding:"4px 12px", borderRadius:5, color:"#9a9590", fontWeight:700, fontSize:12, textTransform:"uppercase", letterSpacing:"1px", minWidth:86, flexShrink:0, textAlign:"center", marginTop:2 }}>{label}</span>
      <div>
        {foundIds.length > 0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:4 }}>
            {foundIds.slice(0, 6).map((id, i) => (
              <img key={i} src={`${ddragonUrl(`img/item/${id}.png`)}`} alt=""
                style={{ width:24, height:24, borderRadius:4, border:"1px solid rgba(255,255,255,0.1)" }}
                onError={(e) => { e.target.style.display="none"; }} />
            ))}
          </div>
        )}
        <span style={{ color:"#e8e0d0", lineHeight:1.5 }}>{value}</span>
      </div>
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

/* ─── New Section Components ─── */
function WinConditionCard({ text }) {
  if (!text) return null;
  return (
    <div style={{
      position:"relative", overflow:"hidden",
      background:"linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(200,155,60,0.08) 40%, rgba(0,0,0,0.35) 100%)",
      border:"3px solid #c89b3c", borderRadius:16, padding:28,
      boxShadow:"0 0 30px rgba(200,155,60,0.15), inset 0 0 40px rgba(255,215,0,0.05)",
    }}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, #ffd700, transparent)" }} />
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:"radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)", pointerEvents:"none" }} />
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12, position:"relative" }}>
        <span style={{ fontSize:32 }}>🏆</span>
        <span style={{ fontSize:17, fontWeight:800, color:"#ffd700", textTransform:"uppercase", letterSpacing:"1.5px" }}>Condición de Victoria</span>
      </div>
      <p style={{ margin:0, fontSize:16, fontWeight:700, color:"#ffd700", lineHeight:1.6, position:"relative" }}>{text}</p>
    </div>
  );
}

function PowerSpikesTimeline({ spikes }) {
  const [expanded, setExpanded] = useState(null);
  if (!spikes || spikes.length === 0) return null;
  const colors = spikes.map((_, i) => {
    const ratio = spikes.length === 1 ? 0.5 : i / (spikes.length - 1);
    if (ratio < 0.33) return "#ff4d63";
    if (ratio < 0.66) return "#ffd700";
    return "#12d9f5";
  });
  return (
    <div style={{ padding:"16px 0 8px", marginBottom:8 }}>
      <div style={{ fontSize:13, fontWeight:700, color:"#2dd66a", textTransform:"uppercase", letterSpacing:"1px", marginBottom:16 }}>⚡ Picos de Poder</div>
      <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 20px" }}>
        <div style={{ position:"absolute", left:20, right:20, top:"50%", height:2, background:"linear-gradient(90deg, #ff4d63, #ffd700, #12d9f5)", transform:"translateY(-1px)", zIndex:0 }} />
        {spikes.map((spike, i) => (
          <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, zIndex:1, position:"relative", flex:1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:colors[i], textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"center", whiteSpace:"nowrap" }}>{spike.timing}</div>
            <div
              style={{
                width:18, height:18, borderRadius:"50%", background:colors[i],
                boxShadow:`0 0 12px ${colors[i]}60`, cursor:"pointer", transition:"all 0.3s", position:"relative",
                transform: expanded === i ? "scale(1.5)" : "scale(1)",
              }}
              onClick={() => setExpanded(expanded === i ? null : i)}
              onMouseEnter={() => setExpanded(i)}
              onMouseLeave={() => setExpanded(null)}
            />
            <div style={{ 
              fontSize:12, color:"#c8c0b0", textAlign:"center", maxWidth:140, lineHeight:1.4, 
              overflow:"hidden", maxHeight: expanded === i ? 100 : 0, opacity: expanded === i ? 1 : 0, 
              transition:"all 0.3s", marginTop: 4
            }}>
              {spike.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThreatPriority({ threats }) {
  if (!threats || threats.length === 0) return null;
  const dangerOrder = { alta: 0, media: 1, baja: 2 };
  const sorted = [...threats].sort((a, b) => (dangerOrder[a.danger?.toLowerCase()] ?? 3) - (dangerOrder[b.danger?.toLowerCase()] ?? 3));
  const dangerColor = { alta: "#ff4d63", media: "#ff9f43", baja: "#2dd66a" };
  const dangerLabel = { alta: "ALTA", media: "MEDIA", baja: "BAJA" };
  return (
    <ResultSection icon="⚠️" title="Prioridad de Amenazas" color="#ff4d63">
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {sorted.map((t, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(0,0,0,0.25)", borderRadius:10, padding:"10px 14px" }}>
            <ChampPortrait name={t.champion} size={36} border={`2px solid ${dangerColor[t.danger?.toLowerCase()] || "#666"}`} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:14, fontWeight:700, color:"#f0e6d2" }}>{t.champion}</span>
                <span style={{ fontSize:10, fontWeight:800, color:dangerColor[t.danger?.toLowerCase()] || "#666", background:`${dangerColor[t.danger?.toLowerCase()] || "#666"}18`, padding:"2px 8px", borderRadius:4, letterSpacing:"0.5px" }}>
                  {dangerLabel[t.danger?.toLowerCase()] || t.danger}
                </span>
              </div>
              <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:2,
                  width: t.danger?.toLowerCase() === "alta" ? "100%" : t.danger?.toLowerCase() === "media" ? "60%" : "30%",
                  background: dangerColor[t.danger?.toLowerCase()] || "#666",
                  transition:"width 0.5s",
                }} />
              </div>
              <p style={{ margin:"4px 0 0", fontSize:12, color:"#9a9590", lineHeight:1.4 }}>{t.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </ResultSection>
  );
}

function highlightAbilities(text, color) {
  if (!text) return text;
  const parts = text.split(/\b([QWER])\b/g);
  return parts.map((part, i) => {
    if (/^[QWER]$/.test(part)) {
      return <span key={i} style={{ fontWeight:800, color }}>{part}</span>;
    }
    return part;
  });
}

function CombosCard({ combos }) {
  if (!combos) return null;
  const sections = [
    { key: "trading", label: "Trading", icon: "⚡", color: "#ffd700" },
    { key: "all_in", label: "All-in", icon: "💀", color: "#ff4d63" },
    { key: "teamfight", label: "Teamfight", icon: "👥", color: "#12d9f5" },
  ];
  return (
    <ResultSection icon="🎯" title="Combos" color="#d4a843">
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {sections.map(s => {
          const text = combos[s.key];
          if (!text) return null;
          return (
            <div key={s.key} style={{ background:`${s.color}0a`, border:`1px solid ${s.color}25`, borderRadius:10, padding:"12px 16px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:13, fontWeight:800, color:s.color, textTransform:"uppercase", letterSpacing:"1px" }}>{s.label}</span>
              </div>
              <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:14, color:"#e8e0d0", lineHeight:1.6 }}>
                {highlightAbilities(text, s.color)}
              </div>
            </div>
          );
        })}
      </div>
    </ResultSection>
  );
}

function WardSpotsCard({ text }) {
  if (!text) return null;
  return (
    <ResultSection icon="👁️" title="Ward Spots" color="#2dd66a">
      <p style={{ margin:0, color:"#c8c0b0", fontSize:14, lineHeight:1.6 }}>{text}</p>
    </ResultSection>
  );
}


/* ─── Screenshot Components ─── */
function ScreenshotConfirmModal({ composition, onConfirm, onCancel }) {
  const [localComp, setLocalComp] = useState(JSON.parse(JSON.stringify(composition)));

  const updateProp = (type, index, field, value) => {
    const updated = { ...localComp };
    if (type === 'user') updated.userChampion[field] = value;
    else updated[type][index][field] = value;
    setLocalComp(updated);
  };

  const swapWithUser = (allyIndex) => {
    const updated = JSON.parse(JSON.stringify(localComp));
    const previousUser = { ...updated.userChampion };
    const selectedAlly = { ...updated.allies[allyIndex] };
    // Intercambiar datos del usuario con el aliado seleccionado
    updated.userChampion = { champion: selectedAlly.champion, lane: selectedAlly.lane };
    updated.allies[allyIndex] = { champion: previousUser.champion, lane: previousUser.lane };
    setLocalComp(updated);
  };

  return (
    <div style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.85)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(4px)" }}>
      <div style={{ background:"#12121f", border:"1px solid rgba(200,155,60,0.3)", borderRadius:16, maxWidth:600, width:"100%", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 24px 64px rgba(0,0,0,0.8)" }}>
        <div style={{ padding:"24px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ margin:0, color:"#c89b3c", fontSize:20, fontWeight:800, textTransform:"uppercase", letterSpacing:1 }}>Composición Detectada</h2>
          {localComp.confidence === 'low' && (
            <div style={{ marginTop:12, background:"rgba(255,215,0,0.1)", border:"1px solid rgba(255,215,0,0.2)", borderRadius:8, padding:"8px 12px", color:"#ffd700", fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              <span>⚠️</span> Revisá los campeones, la detección puede no ser exacta.
            </div>
          )}
        </div>
        
        {(!localComp.userChampion.lane || localComp.allies.some(a => !a.lane) || localComp.enemies.some(e => !e.lane)) && (
          <div style={{ padding:"10px 28px", color:"#ffb347", fontSize:12, textAlign:"center", background:"rgba(255,179,71,0.08)", borderTop:"1px solid rgba(255,179,71,0.2)" }}>
            ⚠️ Asigná todos los roles antes de continuar
          </div>
        )}

        <div style={{ overflowY:"auto", padding:"20px 28px", display:"flex", flexDirection:"column", gap:20 }}>
          <section>
            <div style={{ fontSize:11, fontWeight:800, color:"#d4a843", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Tu Campeón</div>
            <div style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(200,155,60,0.05)", padding:12, borderRadius:12, border:"1px solid rgba(200,155,60,0.15)" }}>
              <ChampPortrait name={localComp.userChampion.champion} size={40} />
              <div style={{ flex:1, fontWeight:700, color:"#f0e6d2" }}>{localComp.userChampion.champion}</div>
              <MiniLaneSelector value={localComp.userChampion.lane ? localComp.userChampion.lane.toUpperCase() : ""} onChange={(l) => updateProp('user', null, 'lane', l.toLowerCase())} />
            </div>
          </section>

          <section>
            <div style={{ fontSize:11, fontWeight:800, color:"#2dd66a", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Aliados</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {localComp.allies.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(29,186,90,0.05)", padding:"8px 12px", borderRadius:10 }}>
                  <ChampPortrait name={a.champion} size={32} />
                  <div style={{ flex:1, fontSize:14, color:"#c8c0b0" }}>{a.champion}</div>
                  <MiniLaneSelector value={a.lane ? a.lane.toUpperCase() : ""} onChange={(l) => updateProp('allies', i, 'lane', l.toLowerCase())} />
                  <button
                    onClick={() => swapWithUser(i)}
                    title="Este es mi campeón"
                    style={{
                      background: "rgba(200,155,60,0.08)",
                      border: "1px solid rgba(200,155,60,0.25)",
                      color: "#c89b3c",
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      letterSpacing: "0.5px",
                    }}
                  >
                    soy yo
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div style={{ fontSize:11, fontWeight:800, color:"#ff4d63", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Enemigos</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {localComp.enemies.map((e, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"rgba(232,64,87,0.05)", padding:"8px 12px", borderRadius:10 }}>
                  <ChampPortrait name={e.champion} size={32} />
                  <div style={{ flex:1, fontSize:14, color:"#c8c0b0" }}>{e.champion}</div>
                  <MiniLaneSelector value={e.lane ? e.lane.toUpperCase() : ""} onChange={(l) => updateProp('enemies', i, 'lane', l.toLowerCase())} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div style={{ padding:"20px 28px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", gap:12 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"14px", background:"rgba(255,255,255,0.05)", border:"none", borderRadius:10, color:"#9a9590", fontWeight:700, cursor:"pointer" }}>Cancelar</button>
          {(() => {
            const allLanesSet = !!localComp.userChampion.lane && 
              localComp.allies.every(a => a.lane) && 
              localComp.enemies.every(e => e.lane);
            return (
              <button 
                onClick={() => onConfirm(localComp)} 
                disabled={!allLanesSet}
                style={{ 
                  flex:2, padding:"14px", 
                  background: allLanesSet ? "#c89b3c" : "rgba(200,155,60,0.3)", 
                  border:"none", borderRadius:10, 
                  color:"#0a0a1a", fontWeight:800, 
                  textTransform:"uppercase", 
                  cursor: allLanesSet ? "pointer" : "not-allowed",
                  boxShadow: allLanesSet ? "0 4px 16px rgba(200,155,60,0.2)" : "none"
                }}
              >
                Confirmar y Analizar
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

/* ─── Coach Tool ─── */
function CoachTool({ user, ddragonVer }) {
  const [myChamp, setMyChamp] = useState(null);
  const [myLane, setMyLane] = useState("MID");
  const [laneOpponent, setLaneOpponent] = useState(null);
  const [enemies, setEnemies] = useState([null,null,null,null]);
  const [enemyLanes, setEnemyLanes] = useState([null,null,null,null]);
  const [allies, setAllies] = useState([null,null,null,null]);
  const [allyLanes, setAllyLanes] = useState([null,null,null,null]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [laneWarning, setLaneWarning] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [itemData, setItemData] = useState({});
  const [runeData, setRuneData] = useState({});
  const [fromCache, setFromCache] = useState(false);
  const [buildType, setBuildType] = useState("auto");

  // Screenshot States
  const [screenshotModal, setScreenshotModal] = useState(false);
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState("");
  const [detectedComposition, setDetectedComposition] = useState(null);
  const [pendingGenerate, setPendingGenerate] = useState(false);
  const fileInputRef = useRef(null);

  const handleScreenshotUpload = async (file) => {
    if (!file) return;
    
    // Validar tamaño en cliente (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScreenshotError("La imagen supera el límite de 5MB");
      return;
    }

    setScreenshotLoading(true);
    setScreenshotError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      const mediaType = file.type;

      try {
        const res = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mediaType }),
        });

        const data = await res.json();

        if (!res.ok) {
          setScreenshotError(data.error || "Error al analizar la imagen");
          setScreenshotLoading(false);
          return;
        }

        // Normalizar carriles a valores canónicos de la app
        const normalizeLane = (lane) => {
          if (!lane) return null;
          const l = String(lane).toLowerCase().trim();
          const map = {
            top: "top", superior: "top", toplane: "top",
            jungle: "jgl", jgl: "jgl", jg: "jgl", jungla: "jgl", jung: "jgl",
            mid: "mid", middle: "mid", central: "mid", midlane: "mid",
            adc: "adc", bot: "adc", bottom: "adc", inferior: "adc", marksman: "adc", botlane: "adc",
            sup: "sup", support: "sup", soporte: "sup", supp: "sup", suppport: "sup",
          };
          return map[l] || null;
        };

        // Normalizar nombres a Title Case (fix para íconos rotos cuando la IA devuelve MAYÚSCULAS)
        const toTitleCase = (s) => {
          if (!s) return s;
          return s.toLowerCase().replace(/(^|[\s'\-.])(\w)/g, (m, sep, ch) => sep + ch.toUpperCase());
        };

        const blueTeam = (data.blueTeam || []).map(toTitleCase);
        const redTeam = (data.redTeam || []).map(toTitleCase);

        const POSITIONAL_LANES = ["top", "jgl", "mid", "adc", "sup"];
        const isChampSelect = data.screenType === "champion_select";

        const blueLanes = isChampSelect && Array.isArray(data.blueLanes)
          ? data.blueLanes.map(normalizeLane)
          : POSITIONAL_LANES;

        const redLanes = isChampSelect
          ? [null, null, null, null, null]
          : POSITIONAL_LANES;

        let userIndex = typeof data.userIndex === "number" ? data.userIndex : 0;
        if (userIndex < 0 || userIndex > 4) userIndex = 0;
        const userChampion = blueTeam[userIndex];

        const userLane = blueLanes[userIndex] || null;

        const allies = blueTeam
          .map((champion, i) => ({ champion, lane: blueLanes[i] }))
          .filter((_, i) => i !== userIndex);

        const enemies = redTeam.map((champion, i) => ({
          champion,
          lane: redLanes[i],
        }));

        const transformed = {
          userChampion: { champion: userChampion, lane: userLane },
          allies,
          enemies,
          confidence: data.confidence,
          screenType: data.screenType,
        };

        setDetectedComposition(transformed);
        setScreenshotModal(true);
      } catch (err) {
        setScreenshotError("Error de conexión al analizar la imagen");
      } finally {
        setScreenshotLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmDetectedComposition = (comp) => {
    // 1. My Champ & Lane
    setMyChamp(comp.userChampion.champion);
    setMyLane(comp.userChampion.lane.toUpperCase());

    // 2. Allies
    const newAllies = [null,null,null,null];
    const newAllyLanes = [null,null,null,null];
    comp.allies.slice(0, 4).forEach((a, i) => {
      newAllies[i] = a.champion;
      newAllyLanes[i] = a.lane.toUpperCase();
    });
    setAllies(newAllies);
    setAllyLanes(newAllyLanes);

    // 3. Enemies
    // Opponent is the enemy in the same lane as user
    const userLane = comp.userChampion.lane.toLowerCase();
    const opponentIndex = comp.enemies.findIndex(e => e.lane.toLowerCase() === userLane);
    const opponent = opponentIndex !== -1 ? comp.enemies[opponentIndex] : comp.enemies[0];
    const otherEnemies = comp.enemies.filter((_, idx) => idx !== opponentIndex);

    setLaneOpponent(opponent.champion);
    
    const newEnemies = [null,null,null,null];
    const newEnemyLanes = [null,null,null,null];
    otherEnemies.slice(0, 4).forEach((e, i) => {
      newEnemies[i] = e.champion;
      newEnemyLanes[i] = e.lane.toUpperCase();
    });
    setEnemies(newEnemies);
    setEnemyLanes(newEnemyLanes);

    setScreenshotModal(false);
    setPendingGenerate(true);
  };

  useEffect(() => {
    if (pendingGenerate && myChamp && laneOpponent) {
      setPendingGenerate(false);
      generate();
    }
  }, [pendingGenerate, myChamp, laneOpponent]);

  useEffect(() => {
    // Data update when version changes or on mount
    if (!ddragonVer) return;
    const actualVer = ddragonVer;
      Promise.all([
        fetch(ddragonUrl("data/en_US/item.json", actualVer)).then(r => r.json()),
        fetch(ddragonUrl("data/es_ES/item.json", actualVer)).then(r => r.json()),
      ]).then(([enData, esData]) => {
        const exactEN = {};
        const normEN = {};
        for (const [id, item] of Object.entries(enData.data)) {
          exactEN[item.name] = id;
          normEN[normalize(item.name)] = id;
        }
        const exactES = {};
        const normES = {};
        const names = {}; // id → nombre ES para mostrar en UI
        for (const [id, item] of Object.entries(esData.data)) {
          exactES[item.name] = id;
          normES[normalize(item.name)] = id;
          names[id] = item.name;
        }
        setItemData({ exactEN, exactES, normEN, normES, keywords: buildItemKeywordIndex({ exactEN, exactES }), names });
      }).catch(() => {});

      Promise.all([
        fetch(ddragonUrl("data/en_US/runesReforged.json", actualVer)).then(r => r.json()),
        fetch(ddragonUrl("data/es_ES/runesReforged.json", actualVer)).then(r => r.json()),
      ]).then(([enRunes, esRunes]) => {
        const exact = {};
        const normalized = {};
        const addRunes = (trees) => {
          for (const tree of trees) {
            const url = "https://ddragon.leagueoflegends.com/cdn/img/" + tree.icon;
            exact[tree.name] = url;
            normalized[normalize(tree.name)] = url;
            for (const slot of tree.slots) {
              for (const rune of slot.runes) {
                const rUrl = "https://ddragon.leagueoflegends.com/cdn/img/" + rune.icon;
                exact[rune.name] = rUrl;
                normalized[normalize(rune.name)] = rUrl;
              }
            }
          }
        };
        addRunes(enRunes);
        addRunes(esRunes);
        setRuneData({ exact, normalized });
      }).catch(() => {});
  }, [ddragonVer]);
  
  const handleLaneChange = (l) => {
    if (l === myLane) return;
    setMyLane(l);
    setResult(null);
    setLaneOpponent(null);
    setAllies([null,null,null,null]);
    setEnemies([null,null,null,null]);
    setAllyLanes([null,null,null,null]);
    setEnemyLanes([null,null,null,null]);
    setLaneWarning(true);
    setTimeout(() => setLaneWarning(false), 3000);
  };

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


  function getCacheKey() {
    const parts = [myChamp, myLane, buildType, laneOpponent, ...allies.filter(Boolean).sort(), ...enemies.filter(Boolean).sort()];
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

    const allyList = allies.map((a, i) => a ? `${a}${allyLanes[i] ? ` (${allyLanes[i]})` : ""}` : null).filter(Boolean);
    const enemyList = enemies.map((e, i) => e ? `${e}${enemyLanes[i] ? ` (${enemyLanes[i]})` : ""}` : null).filter(Boolean);

    // Extracts, parses and validates one response from the API
    async function attemptFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": session?.access_token ? `Bearer ${session.access_token}` : ""
        },
        body: JSON.stringify({
          champion: myChamp,
          lane: myLane,
          buildType,
          laneOpponent,
          allies: allyList,
          enemies: enemyList,
        }),
      });

      if (!res.ok) {
        if (res.status === 504) {
          throw new Error("La IA tardó demasiado. Intentá con menos campeones seleccionados o probá de nuevo.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${res.status})`);
      }

      const data = await res.json();
      const text = data.content?.map(i => i.text || "").join("\n") || "";

      // Robust JSON extraction: find outermost braces
      const firstBrace = text.indexOf("{");
      if (firstBrace === -1) throw new SyntaxError("La IA no devolvió un JSON válido");

      let depth = 0;
      let lastBrace = -1;
      for (let i = firstBrace; i < text.length; i++) {
        if (text[i] === "{") depth++;
        else if (text[i] === "}") {
          depth--;
          if (depth === 0) {
            lastBrace = i;
            break;
          }
        }
      }

      if (lastBrace === -1) throw new SyntaxError("La IA no devolvió un JSON válido");
      const parsed = JSON.parse(text.slice(firstBrace, lastBrace + 1));

      if (!parsed.laning_build || !parsed.teamfight_build) {
        throw new SyntaxError("Respuesta incompleta de la IA. Intentá de nuevo.");
      }

      // FIX 4 — Defensive type coercion for array fields
      if (!Array.isArray(parsed.power_spikes))             parsed.power_spikes = [];
      if (!Array.isArray(parsed.threat_priority))           parsed.threat_priority = [];
      if (!Array.isArray(parsed.laning_build?.items))       parsed.laning_build.items = [];
      if (!Array.isArray(parsed.teamfight_build?.full_build)) parsed.teamfight_build.full_build = [];
      if (parsed.game_plan && !Array.isArray(parsed.game_plan.tips)) parsed.game_plan.tips = [];

      return { parsed, tokensUsed: data.usage?.output_tokens || null };
    }

    try {
      let result;
      try {
        result = await attemptFetch();
      } catch (parseErr) {
        // FIX 5 — Retry once on JSON parse/validation errors only
        if (parseErr instanceof SyntaxError) {
          setLoadingMsg(2); // "Optimizando build contextual..."
          result = await attemptFetch();
        } else {
          throw parseErr; // Server errors, network errors — don't retry
        }
      }

      const { parsed, tokensUsed } = result;
      setResult(parsed);
      const setCachedResult = (key, val) => {
        try {
          localStorage.setItem(key, JSON.stringify({ data: val, ts: Date.now() }));
        } catch (e) {
          if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k.startsWith('rc_cache_')) {
                try {
                  const item = JSON.parse(localStorage.getItem(k));
                  keys.push({ k, ts: item.ts || 0 });
                } catch { keys.push({ k, ts: 0 }); }
              }
            }
            keys.sort((a, b) => a.ts - b.ts);
            // Remove oldest 20 entries
            keys.slice(0, 20).forEach(x => localStorage.removeItem(x.k));
            try { localStorage.setItem(key, JSON.stringify({ data: val, ts: Date.now() })); } catch {}
          }
        }
      };
      setCachedResult(cacheKey, parsed);

      // Save generation to Supabase (non-blocking)
      if (user?.id) {
        supabase.from("generations").insert({
          user_id: user.id,
          champion: myChamp,
          lane: myLane,
          opponent: laneOpponent,
          allies: allyList,
          enemies: enemyList,
          build_type: buildType,
          result: parsed,
          tokens_used: tokensUsed,
        }).then(({ error: dbErr }) => {
          if (dbErr) console.warn("Error saving generation:", dbErr.message);
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al generar el análisis. Intentá de nuevo.");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      {/* My Champ */}
      <div style={{ background:"rgba(200,155,60,0.05)", border:"1px solid rgba(200,155,60,0.25)", borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ fontSize:13, textTransform:"uppercase", letterSpacing:"2px", color:"#d4a843", marginBottom:12, fontWeight:700, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span>🎮 Tu campeón</span>
          <button onClick={() => fileInputRef.current?.click()} style={{ background:"transparent", border:"1px solid rgba(200,155,60,0.3)", color:"#c89b3c", borderRadius:6, padding:"4px 10px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background="rgba(200,155,60,0.1)"} onMouseLeave={(e) => e.currentTarget.style.background="transparent"}>
            📷 Subir captura
          </button>
          <input type="file" ref={fileInputRef} onChange={(e) => handleScreenshotUpload(e.target.files[0])} accept="image/*" style={{ display:"none" }} />
        </div>
        {screenshotLoading && <div style={{ fontSize:12, color:"#c89b3c", marginBottom:10, animation:"pulse 1.5s infinite" }}>✨ Analizando imagen...</div>}
        {screenshotError && <div style={{ fontSize:12, color:"#ff4d63", marginBottom:10 }}>{screenshotError}</div>}
        <div className="champ-lane-row" style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1 }}>
            <ChampionPicker value={myChamp} onChange={setMyChamp} champions={availableFor(myChamp)} placeholder="Seleccioná tu campeón" />
          </div>
          <div className="lane-selector" style={{ display:"flex", gap:3, background:"rgba(0,0,0,0.35)", borderRadius:8, padding:4, alignItems:"center", position:"relative" }}>
            {laneWarning && (
              <div style={{ position:"absolute", top:-38, left:"50%", transform:"translateX(-50%)", background:"#ff9f43", color:"#000", padding:"4px 12px", borderRadius:6, fontSize:11, fontWeight:800, whiteSpace:"nowrap", animation:"fadeIn 0.3s" }}>
                ⚠️ Carril cambiado — revisá tu equipo
              </div>
            )}
            {LANES.map(l => (
              <button key={l} onClick={() => handleLaneChange(l)} style={{
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
        <div style={{ marginTop:10 }}>
          <div className="build-type-row" style={{ display:"flex", gap:3, background:"rgba(0,0,0,0.35)", borderRadius:8, padding:4 }}>
            {[
              { value:"auto", label:"🤖 Auto" },
              { value:"ad", label:"⚔️ AD" },
              { value:"ap", label:"🔮 AP" },
              { value:"hybrid", label:"⚡ Híbrido" },
            ].map(bt => (
              <button key={bt.value} onClick={() => setBuildType(bt.value)} style={{
                flex:1, background: buildType===bt.value ? "rgba(200,155,60,0.25)":"transparent",
                border: buildType===bt.value ? "1px solid rgba(200,155,60,0.4)":"1px solid transparent",
                color: buildType===bt.value ? "#d4a843":"#6a6a6a", borderRadius:6, padding:"8px 10px",
                cursor:"pointer", fontSize:12, fontWeight:700, transition:"all 0.2s",
                fontFamily:"'Outfit',sans-serif",
              }}>{bt.label}</button>
            ))}
          </div>
          {buildType !== "auto" && (
            <div style={{ fontSize:11, color:"#5b5a56", marginTop:4, marginLeft:4 }}>Forzar tipo de build</div>
          )}
        </div>
      </div>

      {/* Allies */}
      <div style={{ background:"rgba(29,186,90,0.03)", border:"1px solid rgba(29,186,90,0.25)", borderRadius:12, padding:20, marginBottom:14 }}>
        <div style={{ fontSize:13, textTransform:"uppercase", letterSpacing:"2px", color:"#2dd66a", marginBottom:12, fontWeight:700, display:"flex", justifyContent:"space-between" }}>
          <span>🤝 Tu equipo</span>
          <span style={{ fontSize:11, color:"#6a6a6a", fontWeight:400, textTransform:"none", letterSpacing:0 }}>Mejora el análisis</span>
        </div>
        <div className="allies-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {allies.map((a, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:11, color:"#6a6a6a", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px" }}>
                <span>Slot {i+1}</span>
                <MiniLaneSelector value={allyLanes[i]} onChange={(l) => { const n = [...allyLanes]; n[i] = l; setAllyLanes(n); }} />
              </div>
              <ChampionPicker value={a} onChange={(v) => { setAlly(i,v); if (!v) { const n = [...allyLanes]; n[i] = null; setAllyLanes(n); } }} champions={availableFor(a)} placeholder="Opcional" accentColor="rgba(29,186,90,0.4)" />
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
        <div className="enemies-grid" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {enemies.map((e, i) => (
            <div key={i} style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ fontSize:11, color:"#6a6a6a", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px" }}>
                <span>Slot {i+1}</span>
                <MiniLaneSelector value={enemyLanes[i]} onChange={(l) => { const n = [...enemyLanes]; n[i] = l; setEnemyLanes(n); }} />
              </div>
              <ChampionPicker value={e} onChange={(v) => { setEnemy(i,v); if (!v) { const n = [...enemyLanes]; n[i] = null; setEnemyLanes(n); } }} champions={availableFor(e)} placeholder="Opcional" accentColor="rgba(232,64,87,0.3)" />
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
        <ErrorBoundary>
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Champion Portraits Header */}
          <div className="vs-header" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:20, padding:"20px 0 8px", position:"relative" }}>
            <button className="regen-btn" onClick={() => generate(true)} style={{
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
              <div className="vs-portrait" style={{ width:80, height:80, borderRadius:14, border:"2px solid #2dd66a", boxShadow:"0 0 24px rgba(45,214,106,0.35)", overflow:"hidden" }}>
                <ChampPortrait name={myChamp} size={80} style={{ borderRadius:14 }} />
              </div>
              <span className="vs-name" style={{ fontSize:14, fontWeight:700, color:"#2dd66a" }}>{myChamp}</span>
            </div>
            <div className="vs-text" style={{ fontSize:24, fontWeight:900, color:"#6a6a6a", letterSpacing:2 }}>VS</div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
              <div className="vs-portrait" style={{ width:80, height:80, borderRadius:14, border:"2px solid #ff4d63", boxShadow:"0 0 24px rgba(255,77,99,0.35)", overflow:"hidden" }}>
                <ChampPortrait name={laneOpponent} size={80} style={{ borderRadius:14 }} />
              </div>
              <span className="vs-name" style={{ fontSize:14, fontWeight:700, color:"#ff4d63" }}>{laneOpponent}</span>
            </div>
          </div>

          {/* 2. Win Condition */}
          <WinConditionCard text={result.win_condition} />

          {/* 3. Análisis */}
          <ResultSection icon="📊" title="Análisis" color="#d4a843">
            <p style={{ margin:"0 0 10px", color:"#c8c0b0", lineHeight:1.6, fontSize:15 }}>{result.matchup_summary}</p>
            <div style={{ background:"rgba(212,168,67,0.1)", borderRadius:8, padding:"10px 14px", fontSize:14, color:"#d4a843", fontWeight:600 }}>{result.damage_analysis}</div>
          </ResultSection>

          {/* 4. Sinergia de Equipo */}
          {result.team_synergy && (
            <ResultSection icon="🤝" title="Sinergia de Equipo" color="#2dd66a">
              <p style={{ margin:0, color:"#c8c0b0", lineHeight:1.6, fontSize:14 }}>{result.team_synergy}</p>
            </ResultSection>
          )}

          {/* 5. Threat Priority */}
          <ThreatPriority threats={result.threat_priority} />

          {/* 6. Build de Línea */}
          <ResultSection icon="⚔️" title={`Build de Línea vs ${laneOpponent}`} color="#ff4d63">
            {(result.laning_build?.items?.length ?? 0) > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {result.laning_build?.items?.map((item, i) => (
                  <ItemBadge key={i} name={item} itemData={itemData} index={i} color="#ff4d63" />
                ))}
              </div>
            )}
            <BuildRow label="Inicio" value={result.laning_build?.starter} itemData={itemData} />
            <BuildRow label="1er Recall" value={result.laning_build?.first_back} itemData={itemData} />
            <BuildRow label="Core" value={result.laning_build?.core_laning} itemData={itemData} />
            <BuildRow label="Botas" value={result.laning_build?.boots} itemData={itemData} />
            {result.laning_build?.explanation && (
              <div style={{ marginTop:12, background:"rgba(255,77,99,0.06)", borderRadius:8, padding:"10px 14px", fontSize:14, lineHeight:1.5, color:"#c8c0b0", fontStyle:"italic" }}>{result.laning_build.explanation}</div>
            )}
          </ResultSection>

          {/* 7. Build Completa */}
          <ResultSection icon="🏆" title="Build Completa" color="#12d9f5">
            {(result.teamfight_build?.full_build?.length ?? 0) > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {result.teamfight_build?.full_build?.map((item, i) => (
                  <ItemBadge key={i} name={item} itemData={itemData} index={i} color="#12d9f5" />
                ))}
              </div>
            )}
            <div style={{ background:"rgba(18,217,245,0.06)", borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
              <p style={{ margin:0, color:"#c8c0b0", fontSize:14, lineHeight:1.5 }}>{result.teamfight_build?.build_order}</p>
            </div>
            {result.teamfight_build?.situational && (
              <div style={{ background:"rgba(18,217,245,0.04)", borderRadius:8, padding:"10px 14px" }}>
                <BuildRow label="Situacional" value={result.teamfight_build.situational} itemData={itemData} />
              </div>
            )}
          </ResultSection>

          {/* 8. Runas */}
          <ResultSection icon="✨" title="Runas" color="#d07fff">
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#d07fff", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Primarias</div>
              <RunesList text={result.runes?.primary} runeData={runeData} color="#d07fff" />
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#d07fff", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>Secundarias</div>
              <RunesList text={result.runes?.secondary} runeData={runeData} color="#d07fff" />
            </div>
            {result.runes?.explanation && (
              <div style={{ marginTop:12, background:"rgba(208,127,255,0.06)", borderRadius:8, padding:"10px 14px", fontSize:14, lineHeight:1.5, color:"#c8c0b0", fontStyle:"italic" }}>{result.runes.explanation}</div>
            )}
          </ResultSection>

          {/* 9. Combos */}
          <CombosCard combos={result.combos} />

          {/* 10. Game Plan (con Power Spikes timeline arriba) */}
          <ResultSection icon="🗺️" title="Game Plan" color="#2dd66a">
            <PowerSpikesTimeline spikes={result.power_spikes} />
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

          {/* 11. Ward Spots */}
          <WardSpotsCard text={result.ward_spots} />
        </div>
      </ErrorBoundary>
    )}

    {screenshotModal && <ScreenshotConfirmModal composition={detectedComposition} onCancel={() => setScreenshotModal(false)} onConfirm={confirmDetectedComposition} />}

    </div>
  );
}

/* ─── UI Components ─── */
function Toast({ message, type, onClose }) {
  const icons = { success: "✅", error: "❌", warning: "⚠️" };
  const colors = { success: "#2dd66a", error: "#ff4d63", warning: "#ffd700" };
  
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      background: "rgba(18,18,31,0.95)", backdropFilter: "blur(12px)",
      border: `1px solid ${colors[type]}40`, borderRadius: 12,
      padding: "16px 24px", color: "#f0e6d2", fontSize: 15, fontWeight: 600,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 20px ${colors[type]}15`,
      animation: "toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), toastFadeOut 0.4s 2.6s forwards",
    }}>
      <span style={{ fontSize: 20 }}>{icons[type]}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#6a6a6a", cursor: "pointer", fontSize: 18, padding: "0 4px" }}>✕</button>
    </div>
  );
}

/* ─── Main App ─── */
export default function App() {
  const [page, setPage] = useState("home");
  const [ddragonVer, setDdragonVer] = useState(DEFAULT_DDRAGON_VER);
  const [scrollY, setScrollY] = useState(0);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const toolRef = useRef(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [authForm, setAuthForm] = useState({ email:"", password:"", confirmPassword:"", username:"", region:"LAS" });
  const [profileForm, setProfileForm] = useState({ username:"", region:"LAS" });
  const [passForm, setPassForm] = useState({ currentPassword:"", password:"", confirmPassword:"" });
  const [passLoading, setPassLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const captchaRef = useRef(null);
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [registerCaptchaNeeded, setRegisterCaptchaNeeded] = useState(false);

  const REGIONS = ["LAS","LAN","NA","EUW","EUNE","KR","JP","BR","OCE","TR","RU"];

  // FIX A: Centralizar carga de versión en App root
  useEffect(() => {
    const loadVersion = async () => {
      let currentVer = DEFAULT_DDRAGON_VER;
      try {
        const cached = JSON.parse(localStorage.getItem(DDRAGON_VER_CACHE_KEY) || "null");
        if (cached?.ver && Date.now() - cached.ts < DDRAGON_VER_TTL) {
          currentVer = cached.ver;
        } else {
          const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
          const v = await res.json();
          if (v?.[0]) currentVer = v[0];
          localStorage.setItem(DDRAGON_VER_CACHE_KEY, JSON.stringify({ ver: currentVer, ts: Date.now() }));
        }
      } catch (e) {}
      GLOBAL_DDRAGON_VER = currentVer;
      setDdragonVer(currentVer);
    };
    loadVersion();
  }, []);

  // Listen for auth state changes (login, logout, token refresh)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setSessionLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Limpiar tokens de OAuth de la URL si existen
        if (window.location.hash.includes('access_token') || window.location.search.includes('code=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        fetchProfile(session.user);
      } else {
        setUser(null);
        setSessionLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      // Intentar obtener el perfil existente
      let { data, error } = await supabase
        .from("profiles")
        .select("username, region, tier, generations_today, profile_setup_complete")
        .eq("id", authUser.id)
        .single();

      // Si no existe el perfil (común en primer login OAuth), intentamos crearlo
      if ((error && error.code === "PGRST116") || (!error && !data)) {
        // Problema 1 Fix: Siempre guardamos username como null en el primer login/upsert OAuth
        // para forzar al usuario a elegir su Summoner Name real.
        const newProfile = {
          id: authUser.id,
          email: authUser.email,
          username: null, 
          region: null,
          tier: "free",
          generations_today: 0,
          profile_setup_complete: false
        };

        const { data: upsertData, error: upsertError } = await supabase
          .from("profiles")
          .upsert(newProfile, { onConflict: "id" })
          .select()
          .single();
        
        if (!upsertError) data = upsertData;
      }

      if (data) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          provider: authUser.app_metadata?.provider || authUser.identities?.[0]?.provider || "email",
          username: data.username,
          region: data.region,
          tier: data.tier,
          generations_today: data.generations_today,
          profileSetupComplete: data.profile_setup_complete,
          isIncomplete: !data.profile_setup_complete
        });
        if (!data.profile_setup_complete) setShowCompleteModal(true);
      } else {
        // Fallback extremo
        setUser({
          id: authUser.id,
          email: authUser.email,
          provider: "unknown",
          username: null,
          region: "LAS",
          tier: "free",
          generations_today: 0,
          isIncomplete: true
        });
        setShowCompleteModal(true);
      }
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: 'https://untroll.gg'
        }
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(translateAuthError(err.message, err.code));
      setAuthLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
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
        if (authForm.password !== authForm.confirmPassword) {
          setAuthError("Las contraseñas no coinciden");
          setAuthLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              username: authForm.username,
              region: authForm.region,
            },
            captchaToken,
          },
        });

        if (error) {
          if (error.message.toLowerCase().includes("captcha") || error.code === "captcha_verification_failed") {
            setRegisterCaptchaNeeded(true);
            setAuthError("Por favor, completá la verificación de seguridad.");
          } else {
            setAuthError(translateAuthError(error.message, error.code));
          }
          setAuthLoading(false);
          return;
        }

        // If email confirmation is disabled, user is logged in immediately
        if (data.user && data.user.identities?.length === 0) {
          setAuthError("Este email ya está registrado. ¿Querés iniciar sesión?");
          setAuthLoading(false);
          return;
        }
        // Si hay sesión activa inmediata (confirm email desactivado), onAuthStateChange
        // se encarga de cargar el perfil. Solo redirigimos si no hay sesión todavía.
        if (!data.session) {
          setAuthError("Revisá tu email para confirmar tu cuenta.");
          setAuthLoading(false);
          return;
        }
        // Con sesión activa, onAuthStateChange dispara fetchProfile automáticamente
      } else {
        if (!authForm.email || !authForm.password) {
          setAuthError("Completá tu usuario/email y contraseña");
          setAuthLoading(false);
          return;
        }

        // Resolver username a email si no contiene @
        let loginEmail = authForm.email.trim();
        if (!loginEmail.includes("@")) {
          const { data: emailData, error: emailError } = await supabase
            .rpc("get_email_by_username", { p_username: loginEmail });

          if (emailError || !emailData) {
            setAuthError("No encontramos ese nombre de invocador");
            setAuthLoading(false);
            return;
          }
          loginEmail = emailData;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: authForm.password,
          options: { captchaToken: captchaToken || undefined },
        });

        if (error) {
          const newAttempts = loginAttempts + 1;
          setLoginAttempts(newAttempts);
          setAuthError(translateAuthError(error.message, error.code));
          captchaRef.current?.resetCaptcha();
          setCaptchaToken(null);
          setAuthLoading(false);
          return;
        }

        // Login exitoso: resetear contador
        setLoginAttempts(0);
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
        setPage("home");
      }

      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      setRegisterCaptchaNeeded(false);
      setAuthForm({ email:"", password:"", username:"", region:"LAS" });
    } catch (err) {
      setAuthError("Error de conexión. Intentá de nuevo.");
    } finally {
      setAuthLoading(false);
    }
  };

  const translateAuthError = (msg, code) => {
    if (!msg && !code) return "Ocurrió un error. Intentá de nuevo.";
    const str = msg || "";
    const map = {
      "Invalid login credentials": "Email o contraseña incorrectos",
      "invalid_credentials": "Email o contraseña incorrectos",
      "User already registered": "Este email ya está registrado",
      "Email not confirmed": "Confirmá tu email antes de iniciar sesión",
      "Signup requires a valid password": "La contraseña no es válida",
      "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
      "Email rate limit exceeded": "Demasiados intentos. Esperá unos minutos.",
      "For security purposes, you can only request this after": "Demasiados intentos. Esperá unos segundos.",
      "over_email_send_rate_limit": "Demasiados intentos. Esperá unos minutos.",
    };
    for (const [key, val] of Object.entries(map)) {
      if (str.includes(key) || code === key) return val;
    }
    return str || "Ocurrió un error. Intentá de nuevo.";
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPage("home");
    window.scrollTo({ top:0, behavior:"smooth" });
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (user) {
      setProfileForm({ username: user.username || "", region: user.region || "LAS" });
    }
  }, [user]);

  const scrollToTool = () => {
    setPage("home");
    setTimeout(() => toolRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  };

  const handleUpdateProfile = async (u, r) => {
    if (!u || !r) return;
    setProfileLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ username: u, region: r, profile_setup_complete: true })
        .eq("id", user.id);
      
      if (error) throw error;
      
      // Actualizar estado local directamente (evita race condition en re-fetch)
      const isFirstTime = !user.profileSetupComplete;
      setUser(prev => ({ ...prev, username: u, region: r, isIncomplete: false, profileSetupComplete: true }));
      
      // Enviar email de bienvenida si es la primera vez
      if (isFirstTime) {
        fetch('/api/welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, username: u })
        }).catch(err => console.error("Error sending welcome email:", err));
      }
      
      setShowCompleteModal(false);
      setProfileLoading(false);
      if (page === "settings") {
         showToast("Cambios guardados correctamente.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Error al actualizar el perfil.", "error");
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passForm.currentPassword) {
      showToast("Ingresá tu contraseña actual", "error");
      return;
    }
    if (passForm.password !== passForm.confirmPassword) {
      showToast("Las contraseñas no coinciden", "error");
      return;
    }
    if (passForm.password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    // Verificar contraseña actual intentando login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: passForm.currentPassword,
    });
    if (signInError) {
      showToast("La contraseña actual es incorrecta", "error");
      return;
    }
    
    setPassLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passForm.password });
      if (error) throw error;
      showToast("Contraseña actualizada correctamente", "success");
      setPassForm({ currentPassword: "", password: "", confirmPassword: "" });
    } catch (err) {
      console.error(err);
      showToast("Error al actualizar la contraseña", "error");
    } finally {
      setPassLoading(false);
    }
  };

  useEffect(() => {
    if (!showUserDropdown) return;
    const close = () => setShowUserDropdown(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showUserDropdown]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    input, button, select, textarea { font-family: inherit; }
    html { scroll-behavior:smooth; }
    body { background:#080810; color:#c8c8c8; font-family:'Outfit',sans-serif; overflow-x:hidden; }
    ::selection { background:rgba(200,155,60,0.3); color:#f0e6d2; }
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:rgba(0,0,0,0.3); }
    ::-webkit-scrollbar-thumb { background:rgba(200,155,60,0.3); border-radius:3px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
    @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
    @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes toastFadeOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); margin-bottom: -20px; } }
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

    /* ─── Mobile Responsive ─── */
    .nav-desktop { display:flex; gap:24; align-items:center; }
    .hamburger { display:none; background:none; border:none; color:#c89b3c; font-size:24px; cursor:pointer; padding:4px; }
    .mobile-menu { display:none; }

    @media (max-width: 768px) {
      .hamburger { display:flex; align-items:center; justify-content:center; }
      .nav-desktop { display:none !important; }
      .mobile-menu {
        display:flex; flex-direction:column; gap:8px;
        position:fixed; top:64px; left:0; right:0; z-index:999;
        background:rgba(8,8,16,0.98); backdrop-filter:blur(20px);
        border-bottom:1px solid rgba(200,155,60,0.15);
        padding:16px 24px 20px; animation:fadeUp 0.2s ease;
      }
      .mobile-menu .nav-link { display:block; padding:12px 0; font-size:15px; text-align:left; }
      .mobile-menu .mobile-auth { display:flex; gap:10; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); }
      .hero-section { padding:60px 16px 40px !important; min-height:auto !important; }
      .hero-title { font-size:36px !important; }
      .hero-subtitle { font-size:15px !important; margin-bottom:24px !important; }
      .hero-stats { gap:24px !important; margin-top:32px !important; }
      .hero-stats > div > div:first-child { font-size:22px !important; }
      .hero-buttons .btn-gold, .hero-buttons .btn-outline { padding:14px 28px !important; font-size:14px !important; }
      .tool-section { padding:40px 12px 60px !important; }
      .tool-section h2 { font-size:28px !important; }
      .coach-container { padding:0 !important; }
      .champ-lane-row { flex-direction:column !important; }
      .lane-selector { overflow-x:auto; -webkit-overflow-scrolling:touch; }
      .build-type-row button { font-size:11px !important; padding:7px 6px !important; }
      .allies-grid, .enemies-grid { grid-template-columns:1fr !important; }
      .vs-header { gap:12px !important; padding:12px 0 4px !important; }
      .vs-portrait { width:60px !important; height:60px !important; border-radius:10px !important; }
      .vs-name { font-size:12px !important; }
      .vs-text { font-size:18px !important; }
      .regen-btn { position:relative !important; right:auto !important; top:auto !important; margin:0 auto 8px !important; }
      .result-section { padding:16px 14px !important; border-radius:10px !important; }
      .features-section { padding:60px 16px !important; }
      .features-section h2 { font-size:28px !important; }
      .features-grid { grid-template-columns:1fr !important; }
      .card { padding:24px 20px !important; }
      .how-section { padding:40px 16px !important; }
      .how-section h2 { font-size:28px !important; }
      .legal-page { padding:80px 16px 40px !important; }
      .legal-page h1 { font-size:24px !important; }
      .footer-inner { flex-direction:column; text-align:center; }
      nav { padding:0 16px !important; }
    }

    @media (max-width: 380px) {
      .hero-title { font-size:28px !important; }
      .hero-stats { gap:16px !important; }
      .hero-stats > div > div:first-child { font-size:18px !important; }
      .btn-gold, .btn-outline { padding:12px 20px !important; font-size:13px !important; letter-spacing:1px !important; }
    }
  `;

  if (sessionLoading) {
    return (
      <>
        <style>{css}</style>
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#080810" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ width:48, height:48, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 16px", animation:"pulse 1.5s infinite" }}>⚡</div>
            <div style={{ color:"#5b5a56", fontSize:14, fontFamily:"'Outfit',sans-serif" }}>Cargando...</div>
          </div>
        </div>
      </>
    );
  }

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
          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={() => { setPage("home"); setMobileMenu(false); window.scrollTo({top:0,behavior:"smooth"}); }}>
            <div style={{ width:32, height:32, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17 }}>⚡</div>
            <span style={{ fontSize:18, fontWeight:900, color:"#f0e6d2", letterSpacing:"-0.5px" }}>UNTROLL</span>
          </div>
          <button className="hamburger" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? "✕" : "☰"}
          </button>
          <div className="nav-desktop" style={{ display:"flex", gap:24, alignItems:"center" }}>
            <button className={`nav-link ${page==="home"?"active":""}`} onClick={() => { setPage("home"); window.scrollTo({top:0,behavior:"smooth"}); }}>Inicio</button>
            <button className="nav-link" onClick={scrollToTool}>Coach</button>
            <button className={`nav-link ${page==="legal"?"active":""}`} onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Legal</button>
            <div style={{ width:1, height:20, background:"rgba(255,255,255,0.06)", marginLeft:8 }} />
            {user ? (
              <div style={{ position:"relative" }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowUserDropdown(!showUserDropdown); }} 
                  style={{ background:"none", border:"none", display:"flex", alignItems:"center", gap:10, cursor:"pointer", padding:"4px 8px", borderRadius:8, transition:"all 0.3s" }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,0.03)"}
                  onMouseLeave={e => e.currentTarget.style.background="none"}
                >
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"linear-gradient(135deg,#c89b3c,#785a28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, color:"#080810", border:"1px solid rgba(200,155,60,0.3)" }}>
                    {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div className="nav-user-info" style={{ display:"flex", flexDirection:"column", alignItems:"flex-start" }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f0e6d2", lineHeight:1.1 }}>{user.username || "Invocador"} ▾</div>
                  </div>
                </button>

                {showUserDropdown && (
                  <div style={{
                    position:"absolute", top:"calc(100% + 12px)", right:0, width:180,
                    background:"rgba(18,18,31,0.95)", backdropFilter:"blur(16px)",
                    border:"1px solid rgba(200,155,60,0.2)", borderRadius:12, padding:"8px",
                    boxShadow:"0 16px 48px rgba(0,0,0,0.6)", zIndex:1000, fontFamily: "'Outfit', sans-serif",
                    animation: "fadeUp 0.2s ease"
                  }}>
                    <button onClick={() => setPage("settings")} style={{
                      width:"100%", textAlign:"left", padding:"10px 12px", background:"none", border:"none",
                      color:"#c8c8c8", fontSize:13, fontWeight:600, borderRadius:8, cursor:"pointer", fontFamily: "inherit",
                      display:"flex", alignItems:"center", gap:10, transition:"all 0.2s"
                    }} onMouseEnter={e => { e.currentTarget.style.background="rgba(200,155,60,0.1)"; e.currentTarget.style.color="#c89b3c"; }} onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#c8c8c8"; }}>
                      <span>⚙️</span> Ajustes
                    </button>
                    <div style={{ height:1, background:"rgba(255,255,255,0.04)", margin:"4px 0" }} />
                    <button onClick={logout} style={{
                      width:"100%", textAlign:"left", padding:"10px 12px", background:"none", border:"none",
                      color:"#e84057", fontSize:13, fontWeight:600, borderRadius:8, cursor:"pointer", fontFamily: "inherit",
                      display:"flex", alignItems:"center", gap:10, transition:"all 0.2s"
                    }} onMouseEnter={e => e.currentTarget.style.background="rgba(232,64,87,0.08)"} onMouseLeave={e => e.currentTarget.style.background="none"}>
                      <span>🚪</span> Salir
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <button onClick={() => { setAuthMode("login"); setPage("auth"); setAuthError(null); setRegisterCaptchaNeeded(false); setCaptchaToken(null); window.scrollTo({top:0,behavior:"smooth"}); }}
                  style={{ background:"none", border:"1px solid rgba(200,155,60,0.3)", color:"#c89b3c", padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit'", transition:"all 0.3s", letterSpacing:"0.5px" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background="rgba(200,155,60,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background="none"; }}>
                  Iniciar Sesión
                </button>
                <button onClick={() => { setAuthMode("register"); setPage("auth"); setAuthError(null); setRegisterCaptchaNeeded(false); setCaptchaToken(null); window.scrollTo({top:0,behavior:"smooth"}); }}
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

      {/* Mobile Menu */}
      {mobileMenu && (
        <div className="mobile-menu">
          <button className="nav-link" onClick={() => { setPage("home"); setMobileMenu(false); window.scrollTo({top:0,behavior:"smooth"}); }}>Inicio</button>
          <button className="nav-link" onClick={() => { setMobileMenu(false); scrollToTool(); }}>Coach</button>
          <button className="nav-link" onClick={() => { setPage("legal"); setMobileMenu(false); window.scrollTo({top:0,behavior:"smooth"}); }}>Legal</button>
          <div className="mobile-auth">
            {user ? (
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#c89b3c,#785a28)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#080810" }}>
                    {user.username ? user.username.charAt(0).toUpperCase() : "?"}
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:"#f0e6d2" }} onClick={() => { setPage("settings"); setMobileMenu(false); }}>{user.username || "Invocador"}</span>
                </div>
                <button onClick={() => { setPage("settings"); setMobileMenu(false); }} style={{ background:"none", border:"none", color:"#c89b3c", fontSize:13, fontWeight:600 }}>Ajustes</button>
                <button onClick={() => { logout(); setMobileMenu(false); }} style={{ background:"none", border:"none", color:"#e84057", cursor:"pointer", fontSize:13, fontFamily:"'Outfit'", fontWeight:600 }}>Salir</button>
              </div>
            ) : (
              <>
                <button onClick={() => { setAuthMode("login"); setPage("auth"); setMobileMenu(false); setAuthError(null); setRegisterCaptchaNeeded(false); setCaptchaToken(null); }}
                  style={{ flex:1, background:"none", border:"1px solid rgba(200,155,60,0.3)", color:"#c89b3c", padding:"10px 16px", borderRadius:6, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Outfit'" }}>
                  Iniciar Sesión
                </button>
                <button onClick={() => { setAuthMode("register"); setPage("auth"); setMobileMenu(false); setAuthError(null); setRegisterCaptchaNeeded(false); setCaptchaToken(null); }}
                  style={{ flex:1, background:"linear-gradient(135deg,#c89b3c,#a07830)", border:"none", color:"#080810", padding:"10px 16px", borderRadius:6, fontSize:13, fontWeight:800, cursor:"pointer", fontFamily:"'Outfit'" }}>
                  Registrarse
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {page === "auth" ? (
        /* ─── Auth Page ─── */
        <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"80px 24px" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 50% 40% at 50% 50%, rgba(200,155,60,0.04) 0%, transparent 70%)" }} />
          <div style={{ width:"100%", maxWidth:420, position:"relative", zIndex:1 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:16 }}>
                <div style={{ width:36, height:36, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
                <span style={{ fontSize:20, fontWeight:900, color:"#f0e6d2" }}>UNTROLL</span>
              </div>
              <h2 style={{ fontSize:28, fontWeight:900, color:"#f0e6d2", marginBottom:8 }}>
                {authMode === "login" ? "Bienvenido de vuelta" : "Creá tu cuenta"}
              </h2>
              <p style={{ color:"#5b5a56", fontSize:14 }}>
                {authMode === "login" ? "Ingresá para acceder al coach" : "Registrate gratis y empezá a mejorar"}
              </p>
            </div>

            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:32 }}>
              {/* OAuth Buttons */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                <button onClick={() => handleOAuth("google")} style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                  padding:"12px", background:"#fff", color:"#000", border:"none", borderRadius:8,
                  fontSize:14, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                }} onMouseEnter={(e) => e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={(e) => e.currentTarget.style.transform="translateY(0)"}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.96H.957C.347 6.173 0 7.548 0 9s.347 2.827.957 4.04l3.007-2.328z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  Continuar con Google
                </button>
                <button onClick={() => handleOAuth("discord")} style={{
                  width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12,
                  padding:"12px", background:"#5865F2", color:"#fff", border:"none", borderRadius:8,
                  fontSize:14, fontWeight:700, cursor:"pointer", transition:"all 0.2s",
                }} onMouseEnter={(e) => e.currentTarget.style.transform="translateY(-1px)"} onMouseLeave={(e) => e.currentTarget.style.transform="translateY(0)"}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style={{ flexShrink:0 }}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                  Continuar con Discord
                </button>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, color:"#3a3a3a" }}>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
                <span style={{ fontSize:12, fontWeight:700, letterSpacing:1 }}>O</span>
                <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.06)" }} />
              </div>

              {/* Auth mode tabs */}
              <div style={{ display:"flex", gap:4, background:"rgba(0,0,0,0.3)", borderRadius:8, padding:3, marginBottom:24 }}>
                {["login","register"].map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthError(null); setRegisterCaptchaNeeded(false); setCaptchaToken(null); }}
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
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>{authMode === "login" ? "Email o nombre de invocador" : "Email"}</label>
                  <input className="auth-input" type={authMode === "login" ? "text" : "email"} placeholder={authMode === "login" ? "tu@email.com o NombreInvocador" : "tu@email.com"}
                    value={authForm.email} autoComplete="email" name="email" onChange={(e) => setAuthForm({...authForm, email: e.target.value})} />
                </div>

                <div style={{ position:"relative" }}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Contraseña</label>
                  <input className="auth-input" type={showPass ? "text" : "password"} placeholder={authMode === "register" ? "Mínimo 6 caracteres" : "Tu contraseña"}
                    value={authForm.password} autoComplete={authMode === "login" ? "current-password" : "new-password"} name="password" onChange={(e) => setAuthForm({...authForm, password: e.target.value})} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:12, bottom:12, background:"none", border:"none", color:"#5b5a56", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {showPass ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    )}
                  </button>
                </div>

                {authMode === "register" && (
                  <div style={{ position:"relative" }}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Repetir Contraseña</label>
                    <input className="auth-input" type={showConfirmPass ? "text" : "password"} placeholder="Repetí tu contraseña"
                      value={authForm.confirmPassword} onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})} />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position:"absolute", right:12, bottom:12, background:"none", border:"none", color:"#5b5a56", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {showConfirmPass ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      )}
                    </button>
                    {authForm.confirmPassword && authForm.password !== authForm.confirmPassword && (
                      <div style={{ color:"#e84057", fontSize:11, marginTop:4, fontWeight:600 }}>Las contraseñas no coinciden</div>
                    )}
                  </div>
                )}

                {authMode === "register" && (
                  <div>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:"1px", marginBottom:6 }}>Región</label>
                    <select className="auth-select" value={authForm.region}
                      onChange={(e) => setAuthForm({...authForm, region: e.target.value})}>
                      {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                )}

                {authMode === "register" && registerCaptchaNeeded && (
                  <div style={{ display:"flex", justifyContent:"center" }}>
                    <HCaptcha
                      sitekey="85bed5bc-7136-4836-9534-abb4b64af390"
                      onVerify={(token) => setCaptchaToken(token)}
                      onExpire={() => setCaptchaToken(null)}
                      ref={captchaRef}
                      theme="dark"
                    />
                  </div>
                )}

                {authMode === "login" && (
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
                    {loginAttempts >= 3 && (
                      <p style={{ color:"#5b5a56", fontSize:12, textAlign:"center" }}>
                        Varios intentos detectados. Confirmá que sos humano para continuar.
                      </p>
                    )}
                    {loginAttempts >= 3 ? (
                      <HCaptcha
                        sitekey="85bed5bc-7136-4836-9534-abb4b64af390"
                        onVerify={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        ref={captchaRef}
                        theme="dark"
                      />
                    ) : (
                      <div style={{ position:"absolute", opacity:0, pointerEvents:"none", width:0, height:0, overflow:"hidden" }}>
                        <HCaptcha
                          sitekey="85bed5bc-7136-4836-9534-abb4b64af390"
                          onVerify={(token) => setCaptchaToken(token)}
                          onExpire={() => setCaptchaToken(null)}
                          ref={captchaRef}
                          theme="dark"
                          size="invisible"
                        />
                      </div>
                    )}
                  </div>
                )}

                {authError && (
                  <div style={{ background:"rgba(232,64,87,0.12)", border:"1px solid rgba(232,64,87,0.4)", borderRadius:8, padding:"12px 16px", color:"#ff5a72", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
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
        <div className="legal-page" style={{ maxWidth:800, margin:"0 auto", padding:"100px 24px 60px" }}>
          <button onClick={() => setPage("home")} style={{ background:"none", border:"none", color:"#c89b3c", cursor:"pointer", fontSize:14, fontFamily:"'Outfit'", marginBottom:32, display:"flex", alignItems:"center", gap:6 }}>← Volver</button>
          <h1 style={{ fontSize:32, fontWeight:900, color:"#f0e6d2", marginBottom:40 }}>Legal</h1>

          <div style={{ marginBottom:48 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#c89b3c", marginBottom:16 }}>Términos de Servicio</h2>
            <div style={{ color:"#8a8a8a", lineHeight:1.8, fontSize:14 }}>
              <p style={{ marginBottom:16 }}>Al utilizar Untroll, aceptás estos términos. El servicio proporciona recomendaciones de builds y estrategias para League of Legends generadas por inteligencia artificial. Estas recomendaciones son orientativas y no garantizan resultados específicos en el juego.</p>
              <p style={{ marginBottom:16 }}>Untroll utiliza la API oficial de Riot Games para acceder a datos de partidas. Tu uso de este servicio está sujeto también a los Términos de Servicio de Riot Games.</p>
              <p style={{ marginBottom:16 }}>Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento. No somos responsables por decisiones tomadas en base a las recomendaciones de la IA.</p>
              <p style={{ marginBottom:16 }}>El servicio ofrece un tier gratuito con acceso a las funciones principales. Features premium adicionales pueden requerir suscripción.</p>
            </div>
          </div>

          <div style={{ marginBottom:48 }}>
            <h2 style={{ fontSize:22, fontWeight:800, color:"#c89b3c", marginBottom:16 }}>Política de Privacidad</h2>
            <div style={{ color:"#8a8a8a", lineHeight:1.8, fontSize:14 }}>
              <p style={{ marginBottom:16 }}>Untroll recopila únicamente la información necesaria para funcionar: nombre de invocador, región y datos de la partida en curso a través de la API de Riot Games.</p>
              <p style={{ marginBottom:16 }}>No almacenamos datos personales más allá de lo necesario para la sesión activa. No vendemos, compartimos ni transferimos tus datos a terceros.</p>
              <p style={{ marginBottom:16 }}>Podemos utilizar datos anonimizados y agregados para mejorar el servicio. Los datos de la API de Riot Games se manejan de acuerdo con sus políticas de desarrollador.</p>
              <p style={{ marginBottom:16 }}>Podés solicitar la eliminación de cualquier dato asociado a tu cuenta contactándonos directamente.</p>
            </div>
          </div>

          <div style={{ background:"rgba(200,155,60,0.05)", border:"1px solid rgba(200,155,60,0.12)", borderRadius:12, padding:24 }}>
            <p style={{ color:"#8a8a8a", fontSize:13, lineHeight:1.7, margin:0 }}>
              Untroll no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
            </p>
          </div>
        </div>
      ) : page === "settings" ? (
        /* ─── Settings Page ─── */
        <div style={{ minHeight:"100vh", padding:"100px 24px 60px" }}>
          <div style={{ maxWidth:600, margin:"0 auto", animation:"fadeUp 0.6s ease forwards" }}>
            <button onClick={() => setPage("home")} style={{ background:"none", border:"none", color:"#c89b3c", cursor:"pointer", fontSize:14, fontFamily:"'Outfit'", marginBottom:32, display:"flex", alignItems:"center", gap:6 }}>← Volver</button>
            <h1 style={{ fontSize:32, fontWeight:900, color:"#f0e6d2", marginBottom:8 }}>Ajustes de Perfil</h1>
            <p style={{ color:"#5b5a56", marginBottom:40 }}>Gestioná tu información de invocador y cuenta.</p>

            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:32, display:"flex", flexDirection:"column", gap:28 }}>
              
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Nombre de Invocador</label>
                  <input className="auth-input" type="text" value={profileForm.username} onChange={(e) => setProfileForm({...profileForm, username: e.target.value})} />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Región</label>
                  <select className="auth-select" value={profileForm.region} onChange={(e) => setProfileForm({...profileForm, region: e.target.value})}>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ height:1, background:"rgba(255,255,255,0.04)" }} />

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Email</div>
                  <div style={{ color:"#f0e6d2", fontSize:14, opacity:0.8 }}>{user?.email}</div>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Método de Login</div>
                  <div style={{ color:"#f0e6d2", fontSize:14, opacity:0.8, textTransform:"capitalize" }}>{user?.provider}</div>
                </div>
              </div>

              <button onClick={() => handleUpdateProfile(profileForm.username, profileForm.region)} disabled={profileLoading} style={{
                background:"linear-gradient(135deg,#c89b3c,#a07830)", color:"#080810", border:"none", padding:"14px 28px", borderRadius:10, 
                fontSize:15, fontWeight:800, cursor: profileLoading ? "wait" : "pointer", fontFamily:"'Outfit'", letterSpacing:1,
                alignSelf:"flex-start", marginTop:10
              }}>
                {profileLoading ? "Guardando..." : "Guardar cambios"}
              </button>

              {user && !['google', 'discord'].includes(user.provider) && (
                <>
                  <div style={{ height:1, background:"rgba(255,255,255,0.04)", margin:"8px 0" }} />
                  <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
                    <h3 style={{ fontSize:18, fontWeight:800, color:"#f0e6d2", margin:0 }}>Cambiar contraseña</h3>
                    <div style={{ position:"relative" }}>
                      <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Contraseña actual</label>
                      <input className="auth-input" type={showPass ? "text" : "password"} value={passForm.currentPassword} onChange={(e) => setPassForm({...passForm, currentPassword: e.target.value})} placeholder="Tu contraseña actual" />
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                      <div style={{ position:"relative" }}>
                        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Nueva contraseña</label>
                        <input className="auth-input" type={showPass ? "text" : "password"} value={passForm.password} onChange={(e) => setPassForm({...passForm, password: e.target.value})} placeholder="Mínimo 6 caracteres" />
                        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:"absolute", right:12, bottom:12, background:"none", border:"none", color:"#5b5a56", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {showPass ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          )}
                        </button>
                      </div>
                      <div style={{ position:"relative" }}>
                        <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#5b5a56", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Repetir nueva contraseña</label>
                        <input className="auth-input" type={showConfirmPass ? "text" : "password"} value={passForm.confirmPassword} onChange={(e) => setPassForm({...passForm, confirmPassword: e.target.value})} placeholder="Confirmá tu contraseña" />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position:"absolute", right:12, bottom:12, background:"none", border:"none", color:"#5b5a56", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {showConfirmPass ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          )}
                        </button>
                      </div>
                    </div>
                    {passForm.confirmPassword && passForm.password !== passForm.confirmPassword && (
                      <div style={{ color:"#e84057", fontSize:12, fontWeight:600 }}>Las contraseñas no coinciden</div>
                    )}
                    <button onClick={handleUpdatePassword} disabled={passLoading || !passForm.password || passForm.password !== passForm.confirmPassword} style={{
                      background:"rgba(200,155,60,0.1)", color:"#c89b3c", border:"1px solid rgba(200,155,60,0.3)", padding:"12px 24px", borderRadius:10, 
                      fontSize:14, fontWeight:700, cursor: passLoading ? "wait" : "pointer", fontFamily:"'Outfit'", transition:"all 0.3s", alignSelf:"flex-start"
                    }} onMouseEnter={e => { if(!passLoading) e.currentTarget.style.background="rgba(200,155,60,0.2)"; }} onMouseLeave={e => { if(!passLoading) e.currentTarget.style.background="rgba(200,155,60,0.1)"; }}>
                      {passLoading ? "Actualizando..." : "Actualizar contraseña"}
                    </button>
                  </div>
                </>
              )}

              {user && ['google', 'discord'].includes(user.provider) && (
                <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12 }}>
                  <span style={{ fontSize:20 }}>{user.provider === 'google' ? '🔵' : '🟣'}</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#f0e6d2", marginBottom:2 }}>Contraseña gestionada por {user.provider === 'google' ? 'Google' : 'Discord'}</div>
                    <div style={{ fontSize:12, color:"#5b5a56" }}>Cambiá tu contraseña directamente desde tu cuenta de {user.provider === 'google' ? 'Google' : 'Discord'}.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Hero */}
          <div className="hero-section" style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"80px 24px" }}>
            {user?.isIncomplete && (
              <div style={{
                position:"fixed", top:80, left:"50%", transform:"translateX(-50%)", zIndex:2000,
                width:"90%", maxWidth:600, background:"rgba(200,155,60,0.15)", backdropFilter:"blur(10px)",
                border:"1px solid rgba(200,155,60,0.3)", borderRadius:12, padding:"12px 20px",
                display:"flex", alignItems:"center", gap:15, boxShadow:"0 8px 32px rgba(0,0,0,0.4)",
                animation:"fadeUp 0.5s ease forwards"
              }}>
                <div style={{ fontSize:24 }}>⚠️</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#f0e6d2", marginBottom:2 }}>Perfil Incompleto</div>
                  <div style={{ fontSize:12, color:"#c8c0b0" }}>Para generar un game plan, primero debés configurar tu nombre de invocador y región.</div>
                </div>
                <button onClick={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setShowCompleteModal(true);
                }} style={{
                  background:"#c89b3c", color:"#080810", border:"none", borderRadius:6,
                  padding:"6px 14px", fontSize:12, fontWeight:800, cursor:"pointer"
                }}>Completar</button>
              </div>
            )}
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 50% at 50% 40%, rgba(200,155,60,0.06) 0%, transparent 70%)" }} />
            <div style={{ position:"absolute", top:"15%", left:"10%", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(200,155,60,0.04) 0%, transparent 70%)", filter:"blur(60px)" }} />
            <div style={{ position:"absolute", bottom:"20%", right:"10%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, rgba(10,203,230,0.03) 0%, transparent 70%)", filter:"blur(50px)" }} />

            <div style={{ textAlign:"center", maxWidth:800, position:"relative", zIndex:1 }}>
              <div className="fade-up" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:24, background:"rgba(200,155,60,0.08)", border:"1px solid rgba(200,155,60,0.15)", borderRadius:100, padding:"8px 20px" }}>
                <span style={{ fontSize:13 }}>🧠</span>
                <span style={{ color:"#c89b3c", fontSize:12, fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase" }}>Coaching con Inteligencia Artificial</span>
              </div>

              <h1 className="fade-up d1 hero-title" style={{ fontSize:"clamp(40px, 6vw, 72px)", fontWeight:900, lineHeight:1.05, marginBottom:24, letterSpacing:"-2px" }}>
                <span style={{ color:"#f0e6d2" }}>Tu coach</span><br/>
                <span style={{ background:"linear-gradient(90deg, #c89b3c, #e8c56d, #c89b3c)", backgroundSize:"200% auto", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", animation:"shimmer 4s linear infinite" }}>challenger</span><br/>
                <span style={{ color:"#f0e6d2" }}>personal</span>
              </h1>

              <p className="fade-up d2 hero-subtitle" style={{ fontSize:18, color:"#6a6a6a", lineHeight:1.7, maxWidth:560, margin:"0 auto 40px", fontWeight:400 }}>
                La primera herramienta que analiza ambas composiciones con IA y te da builds, runas y estrategia adaptada a tu partida exacta. No estadísticas genéricas. Razonamiento real.
              </p>

              <div className="fade-up d3 hero-buttons" style={{ display:"flex", gap:16, justifyContent:"center", flexWrap:"wrap" }}>
                <button className="btn-gold" onClick={scrollToTool}>Probar Ahora</button>
                <button className="btn-outline" onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>Ver Features</button>
              </div>

              <div className="fade-up d4 hero-stats" style={{ marginTop:48, display:"flex", justifyContent:"center", gap:48 }}>
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
          <div ref={toolRef} className="tool-section" style={{ padding:"80px 24px 100px", background:"linear-gradient(180deg, rgba(200,155,60,0.03) 0%, transparent 100%)", borderTop:"1px solid rgba(200,155,60,0.08)" }}>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <div style={{ fontSize:13, color:"#d4a843", textTransform:"uppercase", letterSpacing:"3px", fontWeight:700, marginBottom:12 }}>Herramienta</div>
              <h2 style={{ fontSize:42, fontWeight:900, color:"#f0e6d2", letterSpacing:"-1px", marginBottom:8 }}>AI Coach</h2>
              <p style={{ color:"#6a6a6a", fontSize:16 }}>Seleccioná los campeones y generá tu game plan</p>
            </div>
            <CoachTool user={user} ddragonVer={ddragonVer} />
          </div>

          {/* Features */}
          <div id="features" className="features-section" style={{ padding:"100px 24px", maxWidth:1100, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:64 }}>
              <div style={{ fontSize:12, color:"#c89b3c", textTransform:"uppercase", letterSpacing:"3px", fontWeight:700, marginBottom:12 }}>¿Por qué es diferente?</div>
              <h2 style={{ fontSize:40, fontWeight:900, color:"#f0e6d2", letterSpacing:"-1px" }}>Lo que ninguna app te da</h2>
            </div>
            <div className="features-grid" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))", gap:20 }}>
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
          <div className="how-section" style={{ padding:"80px 24px", maxWidth:700, margin:"0 auto" }}>
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
            <div className="footer-inner" style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:24, height:24, background:"linear-gradient(135deg,#c89b3c,#785a28)", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>⚡</div>
                <span style={{ fontSize:14, fontWeight:800, color:"#5b5a56" }}>UNTROLL</span>
              </div>
              <div style={{ display:"flex", gap:24 }}>
                <button className="nav-link" onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Términos</button>
                <button className="nav-link" onClick={() => { setPage("legal"); window.scrollTo({top:0,behavior:"smooth"}); }}>Privacidad</button>
              </div>
            </div>
            <div style={{ marginTop:24, paddingTop:24, borderTop:"1px solid rgba(255,255,255,0.03)" }}>
              <p style={{ color:"#2a2a2a", fontSize:11, lineHeight:1.7, maxWidth:700 }}>
                Untroll no está respaldado por Riot Games y no refleja las opiniones de Riot Games ni de ninguna persona involucrada oficialmente en la producción o gestión de las propiedades de Riot Games. Riot Games y todas las propiedades asociadas son marcas comerciales o marcas registradas de Riot Games, Inc.
              </p>
            </div>
          </footer>
        </div>
      )}
      {showCompleteModal && (
        <CompleteProfileModal 
          onSave={handleUpdateProfile} 
          loading={profileLoading} 
          initialUsername={profileForm.username} 
          initialRegion={profileForm.region} 
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
