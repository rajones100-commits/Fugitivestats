"use client";

import { useEffect, useMemo, useState } from "react";

type Player = {
  player: string; status: string; xis: number; matches: number; runs: number;
  batAverage: number; highScore: string; fifties: number; hundreds: number;
  wickets: number; bowlAverage: number; overs: string; catches: number;
  stumpings: number; victims: number; number: string; dataCheck: string;
};
type View = "players" | "batting" | "bowling" | "fielding" | "milestones" | "records";
type SortDirection = "asc" | "desc";

const views: { id: View; label: string }[] = [
  { id: "players", label: "All players" }, { id: "batting", label: "Batting" },
  { id: "bowling", label: "Bowling" }, { id: "fielding", label: "Fielding" },
  { id: "milestones", label: "Milestones" }, { id: "records", label: "Club records" },
];
const DATA_SOURCE = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRVw2p4gIUekrmVSfGgie2v7Np2QvHTBZcrUEldUn53YwTdgr-VTz6S9n8kRcv2gQ9P93fyN6XogqVE/pub?output=csv";

const fallback: Player[] = [
  { player: "Richard Jones", status: "Current player", xis: 2, matches: 468, runs: 14263, batAverage: 33.48, highScore: "186", fifties: 81, hundreds: 19, wickets: 116, bowlAverage: 22, overs: "494.4", catches: 252, stumpings: 3, victims: 255, number: "29", dataCheck: "OK" },
  { player: "David Adams", status: "Current player", xis: 3, matches: 412, runs: 12051, batAverage: 32.4, highScore: "181", fifties: 81, hundreds: 8, wickets: 40, bowlAverage: 26, overs: "197.3", catches: 132, stumpings: 0, victims: 135, number: "2", dataCheck: "Review source" },
  { player: "Matthew Evans", status: "Current player", xis: 2, matches: 337, runs: 5475, batAverage: 20.98, highScore: "161", fifties: 21, hundreds: 1, wickets: 3, bowlAverage: 24, overs: "12.5", catches: 109, stumpings: 0, victims: 109, number: "32", dataCheck: "OK" },
  { player: "Roy Emmott", status: "Retired", xis: 3, matches: 275, runs: 3342, batAverage: 19.66, highScore: "95*", fifties: 8, hundreds: 0, wickets: 536, bowlAverage: 18, overs: "2707.3", catches: 96, stumpings: 0, victims: 96, number: "5", dataCheck: "OK" },
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(value); value = ""; if (row.some(Boolean)) rows.push(row); row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
const num = (value = "") => Number(value.replace(/,/g, "")) || 0;
function toPlayers(text: string): Player[] {
  const [, ...rows] = parseCsv(text);
  return rows.filter((r) => r[0]?.trim()).map((r) => ({
    player:r[0].trim(), status:r[1]||"", xis:num(r[2]), matches:num(r[3]), runs:num(r[4]),
    batAverage:num(r[5]), highScore:r[6]||"–", fifties:num(r[7]), hundreds:num(r[8]), wickets:num(r[9]),
    bowlAverage:num(r[10]), overs:r[11]||"0.0", catches:num(r[12]), stumpings:num(r[13]), victims:num(r[14]),
    number:r[15]||"–", dataCheck:r[16]||"",
  }));
}
const fmt = new Intl.NumberFormat("en-GB");
const initialSort: Record<View, keyof Player> = { players:"matches", batting:"runs", bowling:"wickets", fielding:"victims", milestones:"runs", records:"runs" };
const statusClass = (status:string) => status.toLowerCase().includes("current") ? "current" : status.toLowerCase().includes("retired") ? "retired" : "left";

export default function Home() {
  const [players,setPlayers] = useState<Player[]>(fallback); const [loading,setLoading] = useState(true); const [live,setLive] = useState(false);
  const [view,setView] = useState<View>("players"); const [query,setQuery] = useState(""); const [status,setStatus] = useState("All");
  const [xiCount,setXiCount] = useState("All"); const [sortKey,setSortKey] = useState<keyof Player>("matches");
  const [direction,setDirection] = useState<SortDirection>("desc"); const [selected,setSelected] = useState<Player|null>(null);

  useEffect(() => {
    fetch("/stats.csv").then((r)=>r.text()).then((text)=>{const parsed=toPlayers(text);if(parsed.length)setPlayers(parsed)}).finally(()=>setLoading(false));
    Promise.any([fetch(DATA_SOURCE),fetch("/api/stats")]).then((r)=>{if(!r.ok)throw new Error();return r.text()}).then((text)=>{const parsed=toPlayers(text);if(parsed.length){setPlayers(parsed);setLive(true)}}).catch(()=>setLive(false));
  }, []);
  useEffect(() => { const close=(e:KeyboardEvent)=>{if(e.key==="Escape")setSelected(null)}; window.addEventListener("keydown",close); return()=>window.removeEventListener("keydown",close); },[]);
  function chooseView(next:View){setView(next);setSortKey(initialSort[next]);setDirection("desc");}
  function sortBy(key:keyof Player){if(sortKey===key)setDirection((d)=>d==="desc"?"asc":"desc");else{setSortKey(key);setDirection("desc");}}

  const filtered=useMemo(()=>{const needle=query.trim().toLowerCase();return players.filter((p)=>(!needle||p.player.toLowerCase().includes(needle)||p.number.toLowerCase().includes(needle))&&(status==="All"||p.status===status)&&(xiCount==="All"||p.xis===Number(xiCount))).sort((a,b)=>{const av=a[sortKey],bv=b[sortKey];const c=typeof av==="number"&&typeof bv==="number"?av-bv:String(av).localeCompare(String(bv));return direction==="desc"?-c:c;});},[players,query,status,xiCount,sortKey,direction]);
  const totals=useMemo(()=>({players:players.length,matches:players.reduce((s,p)=>s+p.matches,0),runs:players.reduce((s,p)=>s+p.runs,0),wickets:players.reduce((s,p)=>s+p.wickets,0)}),[players]);
  const records=useMemo(()=>{const max=(key:keyof Player)=>[...players].sort((a,b)=>Number(b[key])-Number(a[key]))[0];const hs=[...players].sort((a,b)=>num(b.highScore)-num(a.highScore))[0];return[
    {label:"Most appearances",value:fmt.format(max("matches")?.matches||0),player:max("matches")},{label:"Most runs",value:fmt.format(max("runs")?.runs||0),player:max("runs")},{label:"Highest score",value:hs?.highScore||"–",player:hs},{label:"Most centuries",value:fmt.format(max("hundreds")?.hundreds||0),player:max("hundreds")},{label:"Most wickets",value:fmt.format(max("wickets")?.wickets||0),player:max("wickets")},{label:"Most victims",value:fmt.format(max("victims")?.victims||0),player:max("victims")},];},[players]);
  const milestones=useMemo(()=>{const bands=[
    {title:"10,000 run club",key:"runs" as const,min:10000,tone:"gold"},{title:"5,000 run club",key:"runs" as const,min:5000,max:9999,tone:"silver"},{title:"2,000 run club",key:"runs" as const,min:2000,max:4999,tone:"blue"},{title:"500 wicket club",key:"wickets" as const,min:500,tone:"gold"},{title:"250 wicket club",key:"wickets" as const,min:250,max:499,tone:"silver"},{title:"100 wicket club",key:"wickets" as const,min:100,max:249,tone:"blue"},{title:"300 appearance club",key:"matches" as const,min:300,tone:"gold"},{title:"200 appearance club",key:"matches" as const,min:200,max:299,tone:"silver"},];return bands.map((b)=>({...b,members:players.filter((p)=>p[b.key]>=b.min&&(!b.max||p[b.key]<=b.max)).sort((a,c)=>c[b.key]-a[b.key])}));},[players]);
  const tableConfig:[keyof Player,string][]=view==="batting"?[["runs","Runs"],["batAverage","Average"],["highScore","High score"],["fifties","50s"],["hundreds","100s"]]:view==="bowling"?[["wickets","Wickets"],["bowlAverage","Average"],["overs","Overs"]]:view==="fielding"?[["catches","Catches"],["stumpings","Stumpings"],["victims","Victims"]]:[["matches","Matches"],["runs","Runs"],["wickets","Wickets"],["victims","Victims"]];

  return <main>
    <header className="hero"><div className="hero-glow"/><nav className="topbar wrap" aria-label="Main navigation"><button className="brand" onClick={()=>chooseView("players")} aria-label="Fugitives Statistics Centre home"><span className="crest"><span>NF</span><small>CC</small></span><span><strong>FUGITIVES</strong><small>STATISTICS CENTRE</small></span></button><div className={`live-pill ${live?"":"offline"}`}><span/>{loading?"Loading club data":live?"Live club data":"Club data"}</div></nav>
      <section className="hero-copy wrap"><div><p className="eyebrow">Newport Fugitives Cricket Club · 1990–present</p><h1>Every player.<br/><em>Every team.</em> One club.</h1><p className="intro">Career records from across the 1st XI, 2nd XI and 3rd XI—combined into one home for the whole Fugitives family.</p></div><div className="hero-mark" aria-hidden="true"><span>EST.</span><strong>1990</strong><i>ONE CLUB</i></div></section>
      <section className="summary wrap" aria-label="Club totals"><article><span>Players recorded</span><strong>{fmt.format(totals.players)}</strong></article><article><span>Combined appearances</span><strong>{fmt.format(totals.matches)}</strong></article><article><span>Runs scored</span><strong>{fmt.format(totals.runs)}</strong></article><article><span>Wickets taken</span><strong>{fmt.format(totals.wickets)}</strong></article></section>
    </header>
    <div className="nav-shell"><div className="view-tabs wrap" role="tablist" aria-label="Statistics category">{views.map((item)=><button key={item.id} className={view===item.id?"active":""} onClick={()=>chooseView(item.id)}>{item.label}</button>)}</div></div>
    <section className="content wrap">
      {view!=="milestones"&&view!=="records"&&<><div className="section-heading"><div><p className="eyebrow dark">Club career records</p><h2>{views.find((v)=>v.id===view)?.label}</h2></div><p>{filtered.length} {filtered.length===1?"player":"players"}</p></div>
        <div className="filters"><label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search player or playing number" aria-label="Search players"/></label><label><span>Status</span><select value={status} onChange={(e)=>setStatus(e.target.value)}><option>All</option><option>Current player</option><option>Retired</option><option>Left</option></select></label><label><span>XI records</span><select value={xiCount} onChange={(e)=>setXiCount(e.target.value)}><option value="All">All players</option><option value="1">One XI</option><option value="2">Two XIs</option><option value="3">All three XIs</option></select></label></div>
        <div className="table-card"><table><thead><tr><th className="rank">#</th><th><button onClick={()=>sortBy("player")}>Player</button></th><th className="hide-mobile">Status</th><th className="hide-mobile"><button onClick={()=>sortBy("xis")}>XIs</button></th>{tableConfig.map(([key,label])=><th key={key}><button onClick={()=>sortBy(key)}>{label}{sortKey===key&&<span>{direction==="desc"?" ↓":" ↑"}</span>}</button></th>)}</tr></thead><tbody>{filtered.map((p,index)=><tr key={`${p.player}-${p.number}`} onClick={()=>setSelected(p)} tabIndex={0} onKeyDown={(e)=>{if(e.key==="Enter")setSelected(p)}}><td className="rank">{index+1}</td><td><div className="player-cell"><span className="avatar">{p.player.split(" ").map((n)=>n[0]).slice(0,2).join("")}</span><span><strong>{p.player}</strong><small>Playing no. {p.number}</small></span></div></td><td className="hide-mobile"><span className={`status ${statusClass(p.status)}`}>{p.status}</span></td><td className="hide-mobile"><strong>{p.xis}</strong></td>{tableConfig.map(([key])=><td key={key}>{typeof p[key]==="number"?fmt.format(p[key] as number):p[key]}</td>)}</tr>)}</tbody></table>{!filtered.length&&<div className="empty">No player records match those filters.</div>}</div><p className="table-note">Select any player to open their full club career profile. Click a column heading to reorder the table.</p></>}
      {view==="milestones"&&<><div className="section-heading"><div><p className="eyebrow dark">Fugitives honours</p><h2>Milestone clubs</h2></div><p>Updated automatically</p></div><p className="section-intro">Celebrating achievement across every senior XI. Each player appears only in the highest band reached within each category.</p><div className="milestone-grid">{milestones.map((band)=><article className={`milestone ${band.tone}`} key={band.title}><div className="milestone-title"><span>{band.key==="runs"?"BAT":band.key==="wickets"?"BALL":"CAP"}</span><div><h3>{band.title}</h3><p>{band.members.length} members</p></div></div><div>{band.members.map((p)=><button key={p.player} onClick={()=>setSelected(p)}><span>{p.player}</span><strong>{fmt.format(p[band.key])}</strong></button>)}</div></article>)}</div></>}
      {view==="records"&&<><div className="section-heading"><div><p className="eyebrow dark">The record book</p><h2>Club records</h2></div><p>Across all senior XIs</p></div><p className="section-intro">The leading individual career marks in the combined Fugitives records.</p><div className="record-grid">{records.map((record,i)=><button key={record.label} className="record-card" onClick={()=>setSelected(record.player)}><span className="record-number">0{i+1}</span><p>{record.label}</p><strong>{record.value}</strong><span className="record-player">{record.player?.player}</span></button>)}</div></>}
    </section>
    <footer><div className="wrap"><span className="crest small"><span>NF</span></span><p>Newport Fugitives Cricket Club<br/><small>One club · Three teams · Every player counts</small></p><p className="source">Statistics update from the club’s published records.</p></div></footer>
    {selected&&<div className="modal-backdrop" onMouseDown={(e)=>{if(e.target===e.currentTarget)setSelected(null)}} role="presentation"><section className="profile" role="dialog" aria-modal="true" aria-labelledby="profile-name"><button className="close" onClick={()=>setSelected(null)} aria-label="Close player profile">×</button><div className="profile-head"><span className="profile-avatar">{selected.player.split(" ").map((n)=>n[0]).slice(0,2).join("")}</span><div><p>Fugitives career profile</p><h2 id="profile-name">{selected.player}</h2><div><span className={`status ${statusClass(selected.status)}`}>{selected.status}</span><span className="shirt">No. {selected.number}</span></div></div></div><div className="profile-strip"><div><span>Matches</span><strong>{fmt.format(selected.matches)}</strong></div><div><span>XI records</span><strong>{selected.xis}</strong></div><div><span>Data check</span><strong className={selected.dataCheck!=="OK"?"review":""}>{selected.dataCheck||"–"}</strong></div></div><div className="profile-sections"><article><h3>Batting</h3><dl><div><dt>Runs</dt><dd>{fmt.format(selected.runs)}</dd></div><div><dt>Average</dt><dd>{selected.batAverage.toFixed(2)}</dd></div><div><dt>High score</dt><dd>{selected.highScore}</dd></div><div><dt>50s / 100s</dt><dd>{selected.fifties} / {selected.hundreds}</dd></div></dl></article><article><h3>Bowling</h3><dl><div><dt>Wickets</dt><dd>{fmt.format(selected.wickets)}</dd></div><div><dt>Average</dt><dd>{selected.wickets?selected.bowlAverage.toFixed(2):"–"}</dd></div><div><dt>Overs</dt><dd>{selected.overs}</dd></div></dl></article><article><h3>Fielding</h3><dl><div><dt>Catches</dt><dd>{fmt.format(selected.catches)}</dd></div><div><dt>Stumpings</dt><dd>{fmt.format(selected.stumpings)}</dd></div><div><dt>Total victims</dt><dd>{fmt.format(selected.victims)}</dd></div></dl></article></div><p className="profile-note">Combined career record across every senior XI represented in the source data.</p></section></div>}
  </main>;
}
