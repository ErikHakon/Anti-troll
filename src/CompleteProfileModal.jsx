import React, { useState, useEffect } from 'react';

const REGIONS = ["LAS", "LAN", "NA", "EUW", "EUNE", "KR", "JP", "BR", "OCE", "TR", "RU"];

const CompleteProfileModal = React.memo(({ onSave, loading, initialUsername = "", initialRegion = "LAS" }) => {
  const [username, setUsername] = useState(initialUsername);
  const [region, setRegion] = useState(initialRegion);

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername);
    if (initialRegion) setRegion(initialRegion);
  }, [initialUsername, initialRegion]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(8,8,16,0.9)", backdropFilter: "blur(12px)", padding: 24
    }}>
      <div style={{
        width: "100%", maxWidth: 400, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(200,155,60,0.3)",
        borderRadius: 20, padding: 32, boxShadow: "0 32px 64px rgba(0,0,0,0.6)", animation: "fadeUp 0.4s ease"
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, background: "rgba(200,155,60,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⚡</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#f0e6d2", marginBottom: 8 }}>Completá tu perfil</h2>
          <p style={{ color: "#6a6a6a", fontSize: 14 }}>Para usar UnTroll necesitamos tu Summoner Name en League of Legends.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5b5a56", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Nombre de Invocador</label>
            <input className="auth-input" type="text" placeholder="Tu nombre en LoL"
              value={username} onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && username) onSave(username, region); }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5b5a56", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Región</label>
            <select className="auth-select" value={region}
              onChange={(e) => setRegion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && username) onSave(username, region); }}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <button onClick={() => onSave(username, region)}
            disabled={loading || !username} style={{
              width: "100%", padding: 14, marginTop: 8, background: (loading || !username) ? "rgba(200,155,60,0.2)" : "linear-gradient(135deg,#c89b3c,#a07830)",
              color: "#080810", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 800, cursor: loading ? "wait" : "pointer",
              fontFamily: "'Outfit'", letterSpacing: 1, transition: "all 0.3s"
            }}>
            {loading ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </div>
    </div>
  );
});

export default CompleteProfileModal;
