import { useMemo, useState, useEffect } from "react";

/* ========= helpers ========= */
const fmt = (n, c = "EUR", l = "fr-FR") =>
  new Intl.NumberFormat(l, { style: "currency", currency: c }).format(n);
const cn = (...x) => x.filter(Boolean).join(" ");
const days = [
  { key: "mon", label: "Lundi" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mer" },
  { key: "thu", label: "Jeu" },
  { key: "fri", label: "Ven" },
  { key: "sat", label: "Sam" },
  { key: "sun", label: "Dim" },
];
const collaborators = [
  { id: "you", name: "Toi", color: "#0ea5e9" },
  { id: "co", name: "Collaborateur", color: "#8b5cf6" },
];

/* ========= données factices ========= */
const sampleTasks = {
  Pro: [
    { id: 1, title: "Refonte page d’accueil", status: "todo", day: "tue", assignee: "you", priority: 2 },
    { id: 2, title: "Rdv client Alpha (11h)", status: "upcoming", day: "thu", assignee: "you", priority: 1 },
    { id: 3, title: "Brief au collaborateur", status: "todo", day: "mon", assignee: "co", priority: 2 },
    { id: 4, title: "Facturation juillet", status: "done", day: "mon", assignee: "you", priority: 3 },
  ],
  Perso: [
    { id: 11, title: "Courses", status: "todo", day: "sat", assignee: "you", priority: 3 },
    { id: 12, title: "RDV Médecin (15h)", status: "upcoming", day: "wed", assignee: "you", priority: 1 },
    { id: 13, title: "Anniversaire à préparer", status: "todo", day: "fri", assignee: "co", priority: 2 },
  ],
};

const sampleFree = [
  { id: 101, title: "Idée article — productivité" },
  { id: 102, title: "Vérifier hébergement alternatif" },
  { id: 103, title: "Acheter cartouches imprimante" },
];

const tradingObjectives = {
  court: [
    { id: "o1", title: "Challenge Prop Firm X validé", progress: 0.8 },
    { id: "o2", title: "Respect du plan 10 jours", progress: 1 },
    { id: "o3", title: "+3% sur 1 semaine", progress: 0.6 },
  ],
  moyen: [
    { id: "o4", title: "3 challenges validés", progress: 0.33 },
    { id: "o5", title: "Capital propre 5 000 €", progress: 0.5 },
    { id: "o6", title: "3 mois consécutifs verts", progress: 0.33 },
  ],
  long: [
    { id: "o7", title: "Capital propre 50 000 €", progress: 0.1 },
    { id: "o8", title: "Payout total 100 000 $", progress: 0.05 },
    { id: "o9", title: "Vivre 100% du trading", progress: 0.02 },
  ],
};

const sampleJournal = [
  { id: "t1", date: "2025-08-01", asset: "NAS100", dir: "Long", entry: 18500, sl: 18460, tp: 18580, rrPlanned: 2, rrReal: 1.5, result: 150, setupRespected: true, comment: "Entrée sur FVG 5m après MSS.", proof: null },
  { id: "t2", date: "2025-08-02", asset: "DE40",  dir: "Short", entry: 18150, sl: 18190, tp: 18090, rrPlanned: 2, rrReal: -1,  result: -100, setupRespected: false, comment: "FOMO, hors plan.", proof: null },
  { id: "t3", date: "2025-08-03", asset: "NAS100", dir: "Short", entry: 18620, sl: 18660, tp: 18520, rrPlanned: 2, rrReal: 2.1, result: 210, setupRespected: true, comment: "Rejet zone 09:00-09:30.", proof: null },
  { id: "t4", date: "2025-08-04", asset: "DE40",  dir: "Long", entry: 18210, sl: 18180, tp: 18280, rrPlanned: 2, rrReal: 0,   result: 0,   setupRespected: true, comment: "BE après retour.", proof: null },
  { id: "t5", date: "2025-08-05", asset: "NAS100", dir: "Long", entry: 18710, sl: 18670, tp: 18810, rrPlanned: 2, rrReal: -1,  result: -100, setupRespected: false, comment: "Prise impulsive.", proof: null },
  { id: "t6", date: "2025-08-06", asset: "NAS100", dir: "Long", entry: 18740, sl: 18710, tp: 18800, rrPlanned: 2, rrReal: 1.2, result: 120, setupRespected: true, comment: "Bon timing.", proof: null },
  { id: "t7", date: "2025-08-07", asset: "DE40",  dir: "Short", entry: 18260, sl: 18290, tp: 18200, rrPlanned: 2, rrReal: 1,   result: 100, setupRespected: true, comment: "Cassure propre.", proof: null },
  { id: "t8", date: "2025-08-08", asset: "NAS100", dir: "Short", entry: 18820, sl: 18860, tp: 18740, rrPlanned: 2, rrReal: -1,  result: -100, setupRespected: false, comment: "Contre-tendance.", proof: null },
  { id: "t9", date: "2025-08-09", asset: "NAS100", dir: "Long", entry: 18700, sl: 18660, tp: 18780, rrPlanned: 2, rrReal: 2,   result: 200, setupRespected: true, comment: "Plan respecté.", proof: null },
  { id: "t10", date: "2025-08-10", asset: "DE40",  dir: "Long", entry: 18300, sl: 18270, tp: 18360, rrPlanned: 2, rrReal: 1.5, result: 150, setupRespected: true, comment: "Bonne lecture.", proof: null },
];

/* ========= composants UI ========= */
const Tag = ({ label, bg = "#e2e8f0", color = "#0f172a" }) => (
  <span style={{ background: bg, color, padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>{label}</span>
);

const Card = ({ title, children }) => (
  <div style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", borderRadius: 16, padding: 16, boxShadow: "0 6px 16px rgba(2,132,199,0.08), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
    {title && <div style={{ fontWeight: 600, marginBottom: 8, color: "#075985" }}>{title}</div>}
    {children}
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    todo: { label: "À réaliser", bg: "#dbeafe", color: "#1e40af" },
    done: { label: "Réalisée", bg: "#d1fae5", color: "#065f46" },
    upcoming: { label: "Évènement à venir", bg: "#fef3c7", color: "#92400e" },
  };
  const s = map[status] || map.todo;
  return <Tag label={s.label} bg={s.bg} color={s.color} />;
};

const Header = ({ active, setActive, canInstall, onInstall }) => {
  const tabs = ["Pro", "Perso", "Tâches libres", "Trading", "Vue Gantt"];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(90deg,#e0f2fe,white,#f0f9ff)", borderBottom: "1px solid #bae6fd" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, color: "#0369a1" }}>TkiezView — V1</div>
        <nav style={{ display: "flex", gap: 8, marginLeft: 12, flexWrap: "wrap" }}>
          {tabs.map((t) => (
            <button key={t} onClick={() => setActive(t)} className="chip" style={{ background: active === t ? "#0284c7" : "#e0f2fe", color: active === t ? "white" : "#075985" }}>
              {t}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {canInstall && (
            <button className="chip" onClick={onInstall} style={{ background: "#10b981", color: "white" }}>
              Installer l’app
            </button>
          )}
          <button className="chip" style={{ background: "#0ea5e9", color: "white" }}>+ Nouvelle tâche</button>
        </div>
      </div>
    </div>
  );
};

/* ========= vues ========= */
function Dashboard({ scope = "Pro" }) {
  const [assignee, setAssignee] = useState("all"); // all | you | co
  const [tasks, setTasks] = useState(sampleTasks[scope]);
  const [selectedDay, setSelectedDay] = useState("mon");

  const filtered = tasks.filter((t) => (assignee === "all" ? true : t.assignee === assignee));
  const byDay = useMemo(() => {
    const m = Object.fromEntries(days.map((d) => [d.key, []]));
    filtered.forEach((t) => m[t.day]?.push(t));
    return m;
  }, [filtered]);

  const toggleStatus = (id) => {
    setTasks((old) =>
      old.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "todo" : t.status === "todo" ? "done" : t.status } : t))
    );
  };

  const Progress = () => {
    const total = filtered.length || 1;
    const done = filtered.filter((t) => t.status === "done").length;
    const pct = Math.round((done / total) * 100);
    return (
      <div>
        <div className="barOuter"><div className="barInner" style={{ width: `${pct}%` }} /></div>
        <div style={{ fontSize: 12, color: "#075985", marginTop: 4 }}>{pct}% complété</div>
      </div>
    );
  };

  return (
    <div className="grid">
      <div className="col2">
        <Card title={`Calendrier — Vue semaine (${scope})`}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: "#075985" }}>Filtrer :</div>
            <button className="chip" onClick={() => setAssignee("all")} style={{ background: assignee === "all" ? "#0284c7" : "#e0f2fe", color: assignee === "all" ? "white" : "#075985" }}>Tous</button>
            {collaborators.map((c) => (
              <button key={c.id} className="chip" onClick={() => setAssignee(c.id)} style={{ background: assignee === c.id ? "#0284c7" : "#e0f2fe", color: assignee === c.id ? "white" : "#075985" }}>{c.name}</button>
            ))}
          </div>
          <div className="week">
            {days.map((d) => (
              <button key={d.key} onClick={() => setSelectedDay(d.key)} className={cn("day", selectedDay === d.key && "dayActive")}>
                <div className="dayTitle">{d.label}</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {byDay[d.key].map((t) => (
                    <div key={t.id} className="row">
                      <span className="truncate">{t.title}</span>
                      <StatusPill status={t.status} />
                    </div>
                  ))}
                  {byDay[d.key].length === 0 && <div className="empty">— rien de prévu —</div>}
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card title={`Détails du jour — ${days.find((d) => d.key === selectedDay)?.label}`}>
          <div style={{ display: "grid", gap: 8 }}>
            {byDay[selectedDay].map((t) => (
              <div key={t.id} className="item">
                <button onClick={() => toggleStatus(t.id)} className={cn("check", t.status === "done" && "checkOn")}>{t.status === "done" ? "✓" : ""}</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted">Priorité {t.priority} • Assigné à {collaborators.find((c) => c.id === t.assignee)?.name}</div>
                </div>
                <StatusPill status={t.status} />
              </div>
            ))}
            {byDay[selectedDay].length === 0 && <div className="muted">Ajoute une tâche à ce jour pour la voir ici.</div>}
          </div>
        </Card>
      </div>

      <div className="col1">
        <Card title="Aujourd’hui — Priorités">
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {filtered.filter((t) => t.status !== "done").slice(0, 3).map((t) => <li key={t.id} style={{ fontSize: 14 }}>{t.title}</li>)}
            {filtered.filter((t) => t.status !== "done").length === 0 && <li>Tu es à jour ✨</li>}
          </ul>
        </Card>
        <Card title="Progression"><Progress /></Card>
        <Card title="Discipline (streak)">
          <div style={{ fontWeight: 800, fontSize: 24, color: "#075985" }}>5 jours</div>
          <div className="muted">Objectif : 3 priorités/jour</div>
        </Card>
      </div>
    </div>
  );
}

function FreeTasks() {
  const [items, setItems] = useState(sampleFree);
  const [text, setText] = useState("");
  return (
    <div className="narrow">
      <Card title="Tâches non répertoriées (To-Do libre)">
        <div className="row" style={{ gap: 8, marginBottom: 8 }}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ajouter une idée / tâche…" className="input" />
          <button
            className="chip"
            style={{ background: "#0ea5e9", color: "white" }}
            onClick={() => {
              if (!text.trim()) return;
              setItems((o) => [{ id: Date.now(), title: text.trim() }, ...o]);
              setText("");
            }}
          >
            Ajouter
          </button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((it) => (
            <div key={it.id} className="item">
              <span>{it.title}</span>
              <button className="link" onClick={() => setItems((o) => o.filter((x) => x.id !== it.id))}>Retirer</button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const Bar = ({ value }) => (
  <div className="barOuter">
    <div className="barInner" style={{ width: `${Math.round(value * 100)}%` }} />
  </div>
);

function TradingObjectives() {
  const Block = ({ title, list }) => (
    <Card title={title}>
      <div style={{ display: "grid", gap: 10 }}>
        {list.map((o) => (
          <div key={o.id} className="objective">
            <div style={{ fontWeight: 600 }}>{o.title}</div>
            <Bar value={o.progress} />
            <div className="muted">{Math.round(o.progress * 100)}% complété</div>
          </div>
        ))}
      </div>
    </Card>
  );
  return (
    <div className="grid3">
      <Block title="Court terme (1j–3 mois)" list={tradingObjectives.court} />
      <Block title="Moyen terme (3 mois–1 an)" list={tradingObjectives.moyen} />
      <Block title="Long terme (+1 an)" list={tradingObjectives.long} />
    </div>
  );
}

const EquitySVG = ({ points }) => {
  const w = 600, h = 160, p = 20;
  const max = Math.max(...points), min = Math.min(...points);
  const sx = (i) => p + (i * (w - p * 2)) / (points.length - 1 || 1);
  const sy = (v) => p + (h - p * 2) * (1 - (v - min) / (max - min || 1));
  const d = points.length ? points.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ") : `M${p},${h - p}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%" }}>
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="#0284c7" strokeWidth="2" />
      <path d={`${d} L ${sx(points.length - 1)},${h - p} L ${sx(0)},${h - p} Z`} fill="url(#eq)" />
    </svg>
  );
};

function TradingStats({ journal }) {
  const stats = useMemo(() => {
    const wins = journal.filter((t) => t.result > 0);
    const losses = journal.filter((t) => t.result < 0);
    const profit = journal.reduce((a, b) => a + b.result, 0);
    const gw = wins.reduce((a, b) => a + b.result, 0);
    const gl = Math.abs(losses.reduce((a, b) => a + b.result, 0));
    const pf = gl ? gw / gl : gw ? Infinity : 0;
    const wr = journal.length ? Math.round((wins.length / journal.length) * 100) : 0;
    const respected = journal.filter((t) => t.setupRespected).length;
    const respectedPct = journal.length ? Math.round((respected / journal.length) * 100) : 0;
    const points = journal.reduce((arr, t) => {
      const last = arr.length ? arr[arr.length - 1] : 0;
      arr.push(last + t.result);
      return arr;
    }, []);
    return { wr, pf, profit, respectedPct, points };
  }, [journal]);

  return (
    <div className="grid2">
      <Card title="Indicateurs clés">
        <div className="stats">
          <div className="stat"><div className="muted">Win rate</div><div className="big">{stats.wr}%</div></div>
          <div className="stat"><div className="muted">Profit factor</div><div className="big">{stats.pf.toFixed(2)}</div></div>
          <div className="stat"><div className="muted">Résultat total</div><div className="big">{fmt(stats.profit, "USD")}</div></div>
          <div className="stat"><div className="muted">Setup respecté</div><div className="big">{stats.respectedPct}%</div></div>
        </div>
      </Card>
      <Card title="Courbe d’equity">
        <EquitySVG points={stats.points.length ? stats.points : [0]} />
      </Card>
    </div>
  );
}

function TradingJournal() {
  const [filterSetup, setFilterSetup] = useState("all"); // all | yes | no
  const [data, setData] = useState(sampleJournal);
  const filtered = data.filter((t) => (filterSetup === "all" ? true : filterSetup === "yes" ? t.setupRespected : !t.setupRespected));
  const toggleRespect = (id) => setData((o) => o.map((t) => (t.id === id ? { ...t, setupRespected: !t.setupRespected } : t)));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="muted">Filtrer “setup respecté” :</div>
        <button className="chip" onClick={() => setFilterSetup("all")} style={{ background: filterSetup === "all" ? "#0284c7" : "#e0f2fe", color: filterSetup === "all" ? "white" : "#075985" }}>Tous</button>
        <button className="chip" onClick={() => setFilterSetup("yes")} style={{ background: filterSetup === "yes" ? "#0284c7" : "#e0f2fe", color: filterSetup === "yes" ? "white" : "#075985" }}>Oui</button>
        <button className="chip" onClick={() => setFilterSetup("no")}  style={{ background: filterSetup === "no"  ? "#0284c7" : "#e0f2fe", color: filterSetup === "no"  ? "white" : "#075985" }}>Non</button>
      </div>

      <Card title="Statistiques (période filtrée)">
        <TradingStats journal={filtered} />
      </Card>

      <Card title="Journal de trading (exemples pré-remplis)">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Actif</th><th>Sens</th><th>Entrée</th><th>SL</th><th>TP</th>
                <th>R:R (plan/réal)</th><th>Résultat</th><th>Setup respecté</th><th>Commentaire</th><th>Preuve (image)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className={cn(t.setupRespected && t.result > 0 && "rowGood", !t.setupRespected && t.result < 0 && "rowBad")}>
                  <td>{t.date}</td>
                  <td>{t.asset}</td>
                  <td>{t.dir}</td>
                  <td>{t.entry}</td>
                  <td>{t.sl}</td>
                  <td>{t.tp}</td>
                  <td>{t.rrPlanned} / {t.rrReal}</td>
                  <td style={{ color: t.result >= 0 ? "#047857" : "#b91c1c" }}>{fmt(t.result, "USD")}</td>
                  <td><button className="chip" onClick={() => toggleRespect(t.id)} style={{ background: t.setupRespected ? "#d1fae5" : "#fee2e2", color: t.setupRespected ? "#065f46" : "#991b1b" }}>{t.setupRespected ? "Oui" : "Non"}</button></td>
                  <td title={t.comment} className="truncate">{t.comment}</td>
                  <td><div className="proof">Image</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TradingPage() {
  const [tab, setTab] = useState("Objectifs"); // Objectifs | Journal | Statistiques
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Objectifs", "Journal", "Statistiques"].map((t) => (
          <button key={t} className="chip" onClick={() => setTab(t)} style={{ background: tab === t ? "#0284c7" : "#e0f2fe", color: tab === t ? "white" : "#075985" }}>{t}</button>
        ))}
      </div>
      {tab === "Objectifs" && <TradingObjectives />}
      {tab === "Journal" && <TradingJournal />}
      {tab === "Statistiques" && (
        <Card title="Statistiques consolidées">
          <TradingStats journal={sampleJournal} />
        </Card>
      )}
    </div>
  );
}

function GanttView() {
  const projects = [
    { id: "p1", name: "Site vitrine client Alpha", start: 0, end: 3, color: "#0ea5e9" },
    { id: "p2", name: "Refonte portfolio",            start: 2, end: 6, color: "#8b5cf6" },
    { id: "p3", name: "SEO blog",                      start: 4, end: 7, color: "#10b981" },
  ];
  return (
    <Card title="Vue Gantt (semaine)">
      <div className="ganttHead">
        <div />
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => <div key={d} className="muted center">{d}</div>)}
      </div>
      {projects.map((p) => (
        <div key={p.id} className="ganttRow">
          <div style={{ fontSize: 14, fontWeight: 600, color: "#075985" }}>{p.name}</div>
          <div className="ganttBar">
            <div style={{ position: "absolute", left: `${(p.start/7)*100}%`, width: `${((p.end - p.start)/7)*100}%`, top: 0, bottom: 0, background: p.color, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.12)" }} />
          </div>
        </div>
      ))}
    </Card>
  );
}

function Diagnostics() {
  const [sw, setSw] = useState("checking");
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => setSw(regs.length ? "ok" : "not-registered"));
      navigator.serviceWorker.ready.then(() => setSw("ok")).catch(() => {});
    } else setSw("not-supported");

    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setCanInstall(true); };
    const onInstalled = () => setCanInstall(false);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice; // result not used
    setCanInstall(false);
  };

  return (
    <>
      <Card title="Diagnostics">
        <div className="muted">Service worker : <b>{sw}</b></div>
        <div className="muted">Install prompt : <b>{canInstall ? "disponible" : "—"}</b></div>
        <div className="muted" style={{ marginTop: 8 }}>Manifest & SW doivent répondre : <code>/manifest.webmanifest</code> et <code>/sw.js</code>.</div>
      </Card>
      {/* bouton Install global si dispo */}
      {canInstall && (
        <div style={{ marginTop: 8 }}>
          <button className="chip" onClick={promptInstall} style={{ background: "#10b981", color: "white" }}>Installer l’app</button>
        </div>
      )}
    </>
  );
}

/* ========= page ========= */
export default function Home() {
  const [tab, setTab] = useState("Pro"); // Pro | Perso | Tâches libres | Trading | Vue Gantt
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState(null);
  useEffect(() => {
    const onBIP = (e) => { e.preventDefault(); setDeferred(e); setCanInstall(true); };
    const onInstalled = () => setCanInstall(false);
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBIP); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  const doInstall = async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; setCanInstall(false); };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#e0f2fe,white,#f0f9ff)", color: "#0f172a" }}>
      <Header active={tab} setActive={setTab} canInstall={canInstall} onInstall={doInstall} />

      <main className="wrap" style={{ display: "grid", gap: 16, padding: "16px 16px 40px" }}>
        {tab === "Pro" && <Dashboard scope="Pro" />}
        {tab === "Perso" && <Dashboard scope="Perso" />}
        {tab === "Tâches libres" && <FreeTasks />}
        {tab === "Trading" && <TradingPage />}
        {tab === "Vue Gantt" && <GanttView />}
        <Diagnostics />
      </main>

      <footer className="wrap" style={{ padding: "24px 16px 48px", fontSize: 12, color: "#075985" }}>
        Prototype V1 — Données factices. PWA activée (manifest + service worker).
      </footer>

      <style jsx global>{`
        * { box-sizing: border-box; }
        .wrap { max-width: 1120px; margin: 0 auto; }
        .chip { border: 0; padding: 8px 12px; border-radius: 999px; font-weight: 600; cursor: pointer; }
        .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
        @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 900px) { .grid2 { grid-template-columns: 1fr; } }
        .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        @media (max-width: 1000px) { .grid3 { grid-template-columns: 1fr; } }
        .col2 { display: grid; gap: 12px; }
        .col1 { display: grid; gap: 12px; }
        .week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        @media (max-width: 900px) { .week { grid-template-columns: repeat(2, 1fr); } }
        .day { text-align: left; border: 1px solid #bae6fd; border-radius: 12px; padding: 8px; background: white; }
        .dayActive { background: #f0f9ff; border-color: #7dd3fc; }
        .dayTitle { font-weight: 700; color: #075985; margin-bottom: 6px; }
        .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .item { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; background: white; }
        .check { width: 24px; height: 24px; border-radius: 999px; border: 2px solid #7dd3fc; color: white; background: white; font-weight: 700; }
        .checkOn { background: #10b981; border-color: #10b981; }
        .muted { color: #0369a1; font-size: 12px; }
        .truncate { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .barOuter { height: 8px; background: #e0f2fe; border-radius: 999px; overflow: hidden; }
        .barInner { height: 8px; background: #0284c7; }
        .table { width: 100%; border-collapse: collapse; font-size: 14px; }
        .table th, .table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .rowGood { background: #ecfdf5; }
        .rowBad { background: #fff1f2; }
        .proof { width: 80px; height: 40px; border: 2px dashed #93c5fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #0369a1; }
        .input { flex: 1; padding: 8px 10px; border-radius: 10px; border: 1px solid #bae6fd; }
        .link { background: transparent; border: 0; color: #0369a1; text-decoration: underline; cursor: pointer; }
        .ganttHead { display: grid; grid-template-columns: 1fr repeat(7, 1fr); gap: 8px; align-items: center; margin-bottom: 6px; }
        .center { text-align: center; }
        .ganttRow { display: grid; grid-template-columns: 1fr 7fr; gap: 8px; align-items: center; margin: 6px 0; }
        .ganttBar { position: relative; height: 28px; border-radius: 10px; background: #e0f2fe; overflow: hidden; }
      `}</style>
    </div>
  );
}
