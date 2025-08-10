import { useMemo, useState, useEffect } from "react";

/** ============ utils & storage ============ */
const fmt = (n, c = "EUR", l = "fr-FR") =>
  new Intl.NumberFormat(l, { style: "currency", currency: c }).format(n);
const cn = (...x) => x.filter(Boolean).join(" ");
const today = new Date();
const toKey = (d) => d.toISOString().slice(0, 10);
const pad = (n) => (n < 10 ? "0" + n : "" + n);
const dmy = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${(d.getFullYear() + "").slice(2)}`;
const dayName = (d) =>
  ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()];
function startOfWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 dim ... 6 sam
  const diff = (day === 0 ? -6 : 1) - day; // lundi comme début
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeek(date = new Date()) {
  const start = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// simple localStorage helpers
const LS = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  },
};

/** ============ couleurs & collaborateurs ============ */
const theme = {
  pro: { base: "#2563eb", light: "#dbeafe", dark: "#1e3a8a" }, // bleu
  perso: { base: "#8b5cf6", light: "#ede9fe", dark: "#5b21b6" }, // violet
};
const collaborators = [
  { id: "you", name: "Toi", color: "#0ea5e9" },
  { id: "co", name: "Collaborateur", color: "#8b5cf6" },
];

/** ============ données initiales (une seule fois si LS vide) ============ */
const seedTasksPro = [
  { id: 1, title: "Refonte page d’accueil", status: "todo", dayKey: toKey(new Date()), assignee: "you", priority: 2 },
  { id: 2, title: "Rdv client Alpha (11h)", status: "upcoming", dayKey: toKey(new Date()), assignee: "you", priority: 1 },
];
const seedTasksPerso = [
  { id: 11, title: "Courses", status: "todo", dayKey: toKey(new Date()), assignee: "you", priority: 3 },
  { id: 12, title: "RDV Médecin (15h)", status: "upcoming", dayKey: toKey(new Date()), assignee: "you", priority: 1 },
];
const seedFree = [
  { id: 101, title: "Idée article — productivité" },
  { id: 102, title: "Acheter cartouches imprimante" },
];
const seedJournal = [
  { id: "t1", date: "2025-08-01", asset: "NAS100", dir: "Long", entry: 18500, sl: 18460, tp: 18580, rrPlanned: 2, rrReal: 1.5, result: 150, setupRespected: true, comment: "Entrée sur FVG 5m après MSS.", proof: null },
  { id: "t2", date: "2025-08-02", asset: "DE40",  dir: "Short", entry: 18150, sl: 18190, tp: 18090, rrPlanned: 2, rrReal: -1,  result: -100, setupRespected: false, comment: "FOMO, hors plan.", proof: null },
];

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => LS.read(key, initialValue));
  useEffect(() => LS.write(key, state), [key, state]);
  return [state, setState];
}

/** ============ tags & cartes & header ============ */
const Tag = ({ label, bg = "#e2e8f0", color = "#0f172a" }) => (
  <span style={{ background: bg, color, padding: "4px 8px", borderRadius: 999, fontSize: 12 }}>{label}</span>
);

const Card = ({ title, children }) => (
  <div style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)", borderRadius: 16, padding: 16, boxShadow: "0 6px 16px rgba(2,132,199,0.08), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
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
  const tabs = ["Agenda pro", "Agenda perso", "Tâches libres", "Trading", "Vue Gantt"];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(90deg,#e0f2fe,white,#f0f9ff)", borderBottom: "1px solid #bae6fd" }}>
      <div className="wrap" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, color: "#0369a1" }}>TkiezView — V1.1</div>
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
        </div>
      </div>
    </div>
  );
};

/** ============ AGENDAS (avec dates réelles + CRUD) ============ */
function Agenda({ scope = "pro" }) {
  const them = scope === "pro" ? theme.pro : theme.perso;
  const lsKey = scope === "pro" ? "tkv_tasks_pro" : "tkv_tasks_perso";
  const [assignee, setAssignee] = useState("all");
  const [tasks, setTasks] = usePersistentState(
    lsKey,
    scope === "pro" ? seedTasksPro : seedTasksPerso
  );
  const [selectedDay, setSelectedDay] = useState(toKey(today));
  const [newTitle, setNewTitle] = useState("");
  const week = getWeek(today); // 7 dates réelles

  // group by dayKey
  const filtered = tasks.filter((t) => (assignee === "all" ? true : t.assignee === assignee));
  const byDay = useMemo(() => {
    const m = Object.fromEntries(week.map((d) => [toKey(d), []]));
    filtered.forEach((t) => {
      if (!m[t.dayKey]) m[t.dayKey] = [];
      m[t.dayKey].push(t);
    });
    return m;
  }, [filtered, week]);

  const toggleStatus = (id) =>
    setTasks((old) =>
      old.map((t) =>
        t.id === id ? { ...t, status: t.status === "done" ? "todo" : t.status === "todo" ? "done" : t.status } : t
      )
    );
  const removeTask = (id) => setTasks((old) => old.filter((t) => t.id !== id));
  const addTask = (dayKey) => {
    const title = newTitle.trim();
    if (!title) return;
    setTasks((old) => [
      { id: Date.now(), title, status: "todo", dayKey, assignee: "you", priority: 2 },
      ...old,
    ]);
    setNewTitle("");
  };

  const Progress = () => {
    const total = filtered.length || 1;
    const done = filtered.filter((t) => t.status === "done").length;
    const pct = Math.round((done / total) * 100);
    return (
      <div>
        <div className="barOuter"><div className="barInner" style={{ width: `${pct}%`, background: them.base }} /></div>
        <div style={{ fontSize: 12, color: them.dark, marginTop: 4 }}>{pct}% complété</div>
      </div>
    );
  };

  return (
    <div className="grid">
      <div className="col2">
        <Card title={`Calendrier — Vue semaine (${scope === "pro" ? "Agenda pro" : "Agenda perso"})`}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13, color: them.dark }}>Filtrer :</div>
            <button className="chip" onClick={() => setAssignee("all")} style={{ background: assignee === "all" ? them.base : them.light, color: assignee === "all" ? "white" : them.dark }}>Tous</button>
            {collaborators.map((c) => (
              <button key={c.id} className="chip" onClick={() => setAssignee(c.id)} style={{ background: assignee === c.id ? them.base : them.light, color: assignee === c.id ? "white" : them.dark }}>{c.name}</button>
            ))}
          </div>

          <div className="week">
            {week.map((d) => {
              const key = toKey(d);
              const label = `${dayName(d)} ${dmy(d)}`;
              return (
                <button key={key} onClick={() => setSelectedDay(key)} className={cn("day", selectedDay === key && "dayActive")} style={{ borderColor: them.light }}>
                  <div className="dayTitle" style={{ color: them.dark }}>{label}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {(byDay[key] || []).map((t) => (
                      <div key={t.id} className="row">
                        <span className="truncate">{t.title}</span>
                        <StatusPill status={t.status} />
                      </div>
                    ))}
                    {(byDay[key] || []).length === 0 && <div className="empty">— rien de prévu —</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={`Détails — ${(() => { const d = new Date(selectedDay); return `${dayName(d)} ${dmy(d)}`; })()}`}>
          <div className="row" style={{ gap: 8, marginBottom: 8 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Ajouter une tâche…" className="input" />
            <button className="chip" style={{ background: them.base, color: "white" }} onClick={() => addTask(selectedDay)}>Ajouter</button>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {(byDay[selectedDay] || []).map((t) => (
              <div key={t.id} className="item">
                <button onClick={() => toggleStatus(t.id)} className={cn("check", t.status === "done" && "checkOn")} style={{ borderColor: them.base, background: t.status === "done" ? "#10b981" : "white" }}>
                  {t.status === "done" ? "✓" : ""}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{t.title}</div>
                  <div className="muted">Priorité {t.priority} • Assigné à {collaborators.find((c) => c.id === t.assignee)?.name}</div>
                </div>
                <StatusPill status={t.status} />
                <button className="link" onClick={() => removeTask(t.id)}>Supprimer</button>
              </div>
            ))}
            {(byDay[selectedDay] || []).length === 0 && <div className="muted">Ajoute une tâche pour ce jour.</div>}
          </div>
        </Card>
      </div>

      <div className="col1">
        <Card title="Progression"><Progress /></Card>
        <Card title="Discipline (streak)">
          <div style={{ fontWeight: 800, fontSize: 24, color: them.dark }}>5 jours</div>
          <div className="muted">Objectif : 3 priorités/jour</div>
        </Card>
      </div>
    </div>
  );
}

/** ============ To-Do libre ============ */
function FreeTasks() {
  const [items, setItems] = usePersistentState("tkv_free", seedFree);
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

/** ============ Trading ============ */
const Bar = ({ value, color = "#0284c7" }) => (
  <div className="barOuter">
    <div className="barInner" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
  </div>
);

const EquitySVG = ({ points, color = "#0284c7" }) => {
  const w = 600, h = 160, p = 20;
  const max = Math.max(...points, 0), min = Math.min(...points, 0);
  const sx = (i) => p + (i * (w - p * 2)) / (points.length - 1 || 1);
  const sy = (v) => p + (h - p * 2) * (1 - (v - min) / (max - min || 1));
  const d = points.length ? points.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ") : `M${p},${h - p}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%" }}>
      <defs>
        <linearGradient id="eq" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
      <path d={`${d} L ${sx(points.length - 1)},${h - p} L ${sx(0)},${h - p} Z`} fill="url(#eq)" />
    </svg>
  );
};

function TradingStats({ journal }) {
  const stats = useMemo(() => {
    const wins = journal.filter((t) => t.result > 0);
    const losses = journal.filter((t) => t.result < 0);
    const profit = journal.reduce((a, b) => a + Number(b.result || 0), 0);
    const gw = wins.reduce((a, b) => a + Number(b.result || 0), 0);
    const gl = Math.abs(losses.reduce((a, b) => a + Number(b.result || 0), 0));
    const pf = gl ? gw / gl : gw ? Infinity : 0;
    const wr = journal.length ? Math.round((wins.length / journal.length) * 100) : 0;
    const respected = journal.filter((t) => !!t.setupRespected).length;
    const respectedPct = journal.length ? Math.round((respected / journal.length) * 100) : 0;
    const points = journal.reduce((arr, t) => {
      const last = arr.length ? arr[arr.length - 1] : 0;
      arr.push(last + Number(t.result || 0));
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
  const [data, setData] = usePersistentState("tkv_journal", seedJournal);

  const filtered = data.filter((t) => (filterSetup === "all" ? true : filterSetup === "yes" ? t.setupRespected : !t.setupRespected));
  const toggleRespect = (id) => setData((o) => o.map((t) => (t.id === id ? { ...t, setupRespected: !t.setupRespected } : t)));
  const removeRow = (id) => setData((o) => o.filter((t) => t.id !== id));

  // add row form
  const emptyRow = { date: toKey(new Date()), asset: "NAS100", dir: "Long", entry: "", sl: "", tp: "", rrPlanned: 2, rrReal: "", result: "", setupRespected: true, comment: "", proof: null };
  const [form, setForm] = useState(emptyRow);

  const onPickImage = (file, id) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setData((o) => o.map((t) => (t.id === id ? { ...t, proof: reader.result } : t)));
    };
    reader.readAsDataURL(file);
  };

  const addRow = () => {
    const id = "t" + Date.now();
    setData((o) => [{ id, ...form }, ...o]);
    setForm(emptyRow);
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div className="muted">Filtrer “setup respecté” :</div>
        <button className="chip" onClick={() => setFilterSetup("all")} style={{ background: filterSetup === "all" ? "#0284c7" : "#e0f2fe", color: filterSetup === "all" ? "white" : "#075985" }}>Tous</button>
        <button className="chip" onClick={() => setFilterSetup("yes")} style={{ background: filterSetup === "yes" ? "#0284c7" : "#e0f2fe", color: filterSetup === "yes" ? "white" : "#075985" }}>Oui</button>
        <button className="chip" onClick={() => setFilterSetup("no")}  style={{ background: filterSetup === "no"  ? "#0284c7" : "#e0f2fe", color: filterSetup === "no"  ? "white" : "#075985" }}>Non</button>
      </div>

      <Card title="Statistiques (période filtrée)">
        <TradingStats journal={filtered} />
      </Card>

      <Card title="Ajouter un trade">
        <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
          <input className="input" style={{ width: 140 }} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} placeholder="YYYY-MM-DD" />
          <input className="input" style={{ width: 120 }} value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} placeholder="Actif" />
          <select className="input" style={{ width: 100 }} value={form.dir} onChange={(e) => setForm({ ...form, dir: e.target.value })}>
            <option>Long</option><option>Short</option>
          </select>
          <input className="input" style={{ width: 100 }} value={form.entry} onChange={(e) => setForm({ ...form, entry: e.target.value })} placeholder="Entrée" />
          <input className="input" style={{ width: 80 }}  value={form.sl} onChange={(e) => setForm({ ...form, sl: e.target.value })} placeholder="SL" />
          <input className="input" style={{ width: 80 }}  value={form.tp} onChange={(e) => setForm({ ...form, tp: e.target.value })} placeholder="TP" />
          <input className="input" style={{ width: 90 }}  value={form.rrPlanned} onChange={(e) => setForm({ ...form, rrPlanned: e.target.value })} placeholder="R:R plan" />
          <input className="input" style={{ width: 90 }}  value={form.rrReal} onChange={(e) => setForm({ ...form, rrReal: e.target.value })} placeholder="R:R réal" />
          <input className="input" style={{ width: 110 }} value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Résultat $" />
          <select className="input" style={{ width: 140 }} value={form.setupRespected ? "yes" : "no"} onChange={(e) => setForm({ ...form, setupRespected: e.target.value === "yes" })}>
            <option value="yes">Setup respecté: Oui</option>
            <option value="no">Setup respecté: Non</option>
          </select>
          <input className="input" style={{ width: 220 }} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Commentaire" />
          <button className="chip" style={{ background: "#0ea5e9", color: "white" }} onClick={addRow}>Ajouter</button>
        </div>
      </Card>

      <Card title="Journal de trading">
        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th><th>Actif</th><th>Sens</th><th>Entrée</th><th>SL</th><th>TP</th>
                <th>R:R (plan/réal)</th><th>Résultat</th><th>Setup</th><th>Commentaire</th><th>Preuve</th><th></th>
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
                  <td style={{ color: Number(t.result) >= 0 ? "#047857" : "#b91c1c" }}>{fmt(Number(t.result || 0), "USD")}</td>
                  <td>
                    <button className="chip" onClick={() => toggleRespect(t.id)} style={{ background: t.setupRespected ? "#d1fae5" : "#fee2e2", color: t.setupRespected ? "#065f46" : "#991b1b" }}>
                      {t.setupRespected ? "Oui" : "Non"}
                    </button>
                  </td>
                  <td title={t.comment} className="truncate">{t.comment}</td>
                  <td>
                    {t.proof ? (
                      <img src={t.proof} alt="preuve" style={{ width: 80, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #93c5fd" }} />
                    ) : (
                      <div className="proof">Image</div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <label className="chip" style={{ background: "#e0f2fe", color: "#075985", cursor: "pointer" }}>
                        Importer
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => onPickImage(e.target.files?.[0], t.id)} />
                      </label>
                    </div>
                  </td>
                  <td><button className="link" onClick={() => removeRow(t.id)}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TradingObjectives() {
  const data = {
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
      <Block title="Court terme (1j–3 mois)" list={data.court} />
      <Block title="Moyen terme (3 mois–1 an)" list={data.moyen} />
      <Block title="Long terme (+1 an)" list={data.long} />
    </div>
  );
}

function TradingPage() {
  const [tab, setTab] = useState("Objectifs"); // Objectifs | Journal | Statistiques
  const data = LS.read("tkv_journal", seedJournal);
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
          <TradingStats journal={data} />
        </Card>
      )}
    </div>
  );
}

/** ============ Gantt (identique) ============ */
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

/** ============ Diagnostics & Page ============ */
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
    await deferred.userChoice;
    setCanInstall(false);
  };

  return (
    <>
      <Card title="Diagnostics">
        <div className="muted">Service worker : <b>{sw}</b></div>
        <div className="muted">Install prompt : <b>{canInstall ? "disponible" : "—"}</b></div>
        <div className="muted" style={{ marginTop: 8 }}>Manifest & SW doivent répondre : <code>/manifest.webmanifest</code> et <code>/sw.js</code>.</div>
      </Card>
      {canInstall && (
        <div style={{ marginTop: 8 }}>
          <button className="chip" onClick={promptInstall} style={{ background: "#10b981", color: "white" }}>Installer l’app</button>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const [tab, setTab] = useState("Agenda pro");
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
        {tab === "Agenda pro" && <Agenda scope="pro" />}
        {tab === "Agenda perso" && <Agenda scope="perso" />}
        {tab === "Tâches libres" && <FreeTasks />}
        {tab === "Trading" && <TradingPage />}
        {tab === "Vue Gantt" && <GanttView />}
        <Diagnostics />
      </main>

      <footer className="wrap" style={{ padding: "24px 16px 48px", fontSize: 12, color: "#075985" }}>
        Prototype V1.1 — Données persistées en local (localStorage). Pour multi-appareils, on branchera un backend.
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
        .table th, .table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
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
