import { useState, useEffect, useRef } from "react";

const STATUS_CONFIG = {
  "Lead":                          { bg: "#579bfc", text: "#fff" },
  "Job":                           { bg: "#00c875", text: "#fff" },
  "Proposal Sent":                 { bg: "#fdab3d", text: "#fff" },
  "Proposal Sent - Not Happening": { bg: "#e2445c", text: "#fff" },
  "Complete":                      { bg: "#037f4c", text: "#fff" },
};
const STATUSES = Object.keys(STATUS_CONFIG);
const GROUPS = ["This Week", "Next Week", "Backlog"];
const TEAM = ["Matt", "Vince", "—"];

const genId = () => `${Date.now()}${Math.random().toString(36).slice(2,6)}`;

const SEED = [
  { id: genId(), name: "River Forest, Jill Bucholz", phone: "(708) 925-5550", location: "526 Forest Ave, River Forest, IL", email: "", status: "Proposal Sent", owner: "Matt", date: "", group: "This Week", comments: [{ id: genId(), author: "Matt", text: "Told them between $3k and $4500 ball park. Subject to moisture meter to assess, remove paint chip not media blast and go over solid silicate.", ts: Date.now() - 259200000 }], files: [] },
  { id: genId(), name: "PALOS HEIGHTS", phone: "(708) 822-0044", location: "12720 South Oak Park Avenue", email: "", status: "Proposal Sent", owner: "Vince", date: "", group: "This Week", comments: [], files: [] },
  { id: genId(), name: "Hoffman, Chris Litas", phone: "(847) 770-3190", location: "332 Pleasant St, Hoffman Estates", email: "chris.litas@gmail.com", status: "Proposal Sent", owner: "Matt", date: "Mar 5, 1:00 PM", group: "This Week", comments: [], files: [] },
];

const BLANK = { name:"", phone:"", location:"", email:"", status:"Lead", owner:"—", date:"", comments:[], files:[] };

const fmtDate = (ts) => {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) + ", " + d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
};

export default function App() {
  const [leads,      setLeads]      = useState(() => { try { const s = localStorage.getItem("mbs_leads"); return s ? JSON.parse(s) : SEED; } catch { return SEED; }});
  const [collapsed,  setCollapsed]  = useState({});
  const [editId,     setEditId]     = useState(null);
  const [editBuf,    setEditBuf]    = useState({});
  const [addGroup,   setAddGroup]   = useState(null);
  const [addBuf,     setAddBuf]     = useState({});
  const [detailId,   setDetailId]   = useState(null);
  const [detailTab,  setDetailTab]  = useState("Updates");
  const [newComment, setNewComment] = useState("");
  const [commenter,  setCommenter]  = useState("Matt");
  const [mobileMenu, setMobileMenu] = useState(false);

  const save = (next) => { setLeads(next); try { localStorage.setItem("mbs_leads",JSON.stringify(next)); } catch {} };
  const startEdit = (l) => { setEditId(l.id); setEditBuf({...l}); };
  const cancelEdit = () => { setEditId(null); setEditBuf({}); };
  const saveEdit = () => { if(editBuf.name?.trim()) save(leads.map(l=>l.id===editId?editBuf:l)); cancelEdit(); };
  const startAdd = (g) => { setAddGroup(g); setAddBuf({...BLANK,id:genId(),group:g}); };
  const cancelAdd = () => { setAddGroup(null); setAddBuf({}); };
  const saveAdd = () => { if(addBuf.name?.trim()) save([...leads,addBuf]); cancelAdd(); };
  const del = (id) => { if(window.confirm("Delete this lead?")) save(leads.filter(l=>l.id!==id)); };
  const cycleStatus = (id) => { const l=leads.find(x=>x.id===id); const idx=(STATUSES.indexOf(l.status)+1)%STATUSES.length; save(leads.map(x=>x.id===id?{...x,status:STATUSES[idx]}:x)); };
  const openDetail = (l) => { setDetailId(l.id); setDetailTab("Updates"); setNewComment(""); };
  const closeDetail = () => setDetailId(null);
  const detailLead = leads.find(l=>l.id===detailId);

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = { id: genId(), author: commenter, text: newComment.trim(), ts: Date.now() };
    save(leads.map(l => l.id===detailId ? {...l, comments:[...(l.comments||[]),comment]} : l));
    setNewComment("");
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const fileObj = { id: genId(), name: file.name, type: file.type, data: ev.target.result, ts: Date.now(), uploader: commenter };
        save(leads.map(l => l.id===detailId ? {...l, files:[...(l.files||[]),fileObj]} : l));
      };
      reader.readAsDataURL(file);
    });
  };

  const eF = (field, opts={}) => (
    <input style={inpStyle} {...opts} value={editBuf[field]??""} onChange={e=>setEditBuf(b=>({...b,[field]:e.target.value}))} onBlur={saveEdit} onKeyDown={e=>{if(e.key==="Enter")saveEdit();if(e.key==="Escape")cancelEdit();}} />
  );
  const aF = (field, opts={}) => (
    <input style={inpStyle} {...opts} value={addBuf[field]??""} onChange={e=>setAddBuf(b=>({...b,[field]:e.target.value}))} onKeyDown={e=>{if(e.key==="Enter")saveAdd();if(e.key==="Escape")cancelAdd();}} />
  );

  const inpStyle = { width:"100%",border:"none",borderBottom:"2px solid #0073ea",outline:"none",background:"#fffde7",fontSize:13,color:"#323338",padding:"2px 4px",borderRadius:"3px 3px 0 0" };

  return (
    <div style={{minHeight:"100vh",background:"#f5f6f8",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        input,select,button,textarea{font-family:inherit;}
        .row:hover td{background:#eef2ff!important;}
        .row:hover .del-btn{opacity:1!important;}
        .del-btn{opacity:0;transition:opacity .15s;}
        .pill{border-radius:4px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;border:none;white-space:nowrap;letter-spacing:.03em;transition:filter .15s;}
        .pill:hover{filter:brightness(1.1);}
        .add-btn{background:none;border:none;color:#676879;font-size:13px;cursor:pointer;padding:9px 14px;display:flex;align-items:center;gap:5px;}
        .add-btn:hover{color:#0073ea;}
        .tb-btn{background:none;border:1px solid #e0e3ea;border-radius:4px;padding:5px 11px;font-size:12px;font-weight:500;cursor:pointer;color:#323338;white-space:nowrap;}
        .tb-btn:hover{background:#eef2ff;border-color:#b0c0e8;}
        .chev{font-size:10px;color:#676879;transition:transform .2s;display:inline-block;}
        .tbl{width:100%;border-collapse:collapse;table-layout:fixed;}
        .tbl th{font-size:11px;font-weight:600;color:#676879;text-align:left;padding:7px 10px;background:#fff;border-right:1px solid #e6e9ef;border-bottom:2px solid #c3cfe0;white-space:nowrap;text-transform:uppercase;letter-spacing:.04em;}
        .tbl td{border-right:1px solid #e6e9ef;border-bottom:1px solid #e6e9ef;vertical-align:middle;background:#fff;}
        .cell{padding:8px 10px;font-size:13px;color:#323338;min-height:40px;display:flex;align-items:center;}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:100;display:flex;align-items:center;justify-content:center;}
        .modal{background:#fff;border-radius:8px;width:min(600px,95vw);max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3);}
        .modal-header{padding:16px 20px;border-bottom:1px solid #e6e9ef;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
        .modal-tabs{display:flex;border-bottom:1px solid #e6e9ef;flex-shrink:0;}
        .modal-tab{padding:10px 18px;font-size:13px;font-weight:500;cursor:pointer;color:#676879;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;}
        .modal-tab.active{color:#0073ea;border-bottom-color:#0073ea;}
        .modal-body{padding:16px 20px;overflow-y:auto;flex:1;}
        .comment-box{background:#f5f6f8;border-radius:8px;padding:12px;margin-bottom:12px;}
        .comment-author{font-weight:700;font-size:13px;color:#323338;margin-bottom:4px;}
        .comment-text{font-size:13px;color:#323338;line-height:1.6;}
        .comment-time{font-size:11px;color:#999;margin-top:4px;}
        .file-card{background:#f5f6f8;border-radius:6px;padding:10px 12px;margin-bottom:8px;display:flex;align-items:center;gap:10px;}
        @media(max-width:700px){
          .desktop-only{display:none!important;}
          .tbl th,.cell{font-size:12px;padding:6px 8px;}
        }
      `}</style>

      {/* ══ HEADER ══ */}
      <div style={{background:"#fff",borderBottom:"1px solid #e6e9ef",position:"sticky",top:0,zIndex:50,boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 16px",height:54}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20,fontWeight:700,color:"#323338"}}>🧱 MBS Leads</span>
            <span style={{fontSize:11,color:"#676879",background:"#e8eaf0",borderRadius:10,padding:"2px 8px",fontWeight:600}}>{leads.length}</span>
          </div>
          <button onClick={()=>{ const g="This Week"; startAdd(g); }} style={{background:"#0073ea",color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
            + New Lead
          </button>
        </div>
        <div style={{display:"flex",gap:6,padding:"8px 16px",borderTop:"1px solid #e6e9ef",overflowX:"auto"}}>
          {["📋 Main Table","👤 Person","⚡ Filter","↕ Sort"].map(b=>(
            <button key={b} className="tb-btn">{b}</button>
          ))}
        </div>
      </div>

      {/* ══ GROUPS ══ */}
      <div style={{padding:"12px 8px 60px"}}>
        {GROUPS.map(group => {
          const rows = leads.filter(l=>l.group===group);
          const open = !collapsed[group];
          const gc = group==="This Week"?"#0073ea":group==="Next Week"?"#a25ddc":"#676879";

          return (
            <div key={group} style={{marginBottom:24}}>
              <table className="tbl" style={{borderRadius:6,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.05)",border:"1px solid #e6e9ef"}}>
                <tbody>
                  {/* Group row */}
                  <tr>
                    <td colSpan={8} style={{background:"#f5f6f8",borderBottom:"1px solid #e6e9ef",padding:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 14px",cursor:"pointer",userSelect:"none"}} onClick={()=>setCollapsed(c=>({...c,[group]:!c[group]}))}>
                        <span className="chev" style={{transform:open?"rotate(90deg)":"rotate(0deg)"}}>▶</span>
                        <span style={{fontSize:14,fontWeight:700,color:gc}}>{group}</span>
                        <span style={{fontSize:11,color:"#676879",background:"#e0e3ea",borderRadius:10,padding:"1px 8px",fontWeight:600}}>{rows.length}</span>
                      </div>
                    </td>
                  </tr>

                  {open && (
                    <tr>
                      <th style={{width:200}}>Name</th>
                      <th style={{width:130}} className="desktop-only">Phone</th>
                      <th style={{width:170}} className="desktop-only">Location</th>
                      <th style={{width:160}} className="desktop-only">Email</th>
                      <th style={{width:185}}>Status</th>
                      <th style={{width:80}} className="desktop-only">Owner</th>
                      <th style={{width:110}} className="desktop-only">Date</th>
                      <th style={{width:40}}></th>
                    </tr>
                  )}

                  {open && rows.map(l => {
                    const isEdit = editId===l.id;
                    const sc = STATUS_CONFIG[l.status]||STATUS_CONFIG["Lead"];
                    return (
                      <tr key={l.id} className="row">
                        <td style={{width:200}}>
                          <div className="cell" style={{gap:6}}>
                            {isEdit ? eF("name",{autoFocus:true}) :
                              <span style={{cursor:"pointer",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:500}} onClick={()=>openDetail(l)}>
                                {l.name||<em style={{color:"#aaa"}}>—</em>}
                              </span>
                            }
                            {!isEdit && <span style={{fontSize:11,color:"#aaa",cursor:"pointer"}} onClick={()=>startEdit(l)} title="Edit">✏️</span>}
                          </div>
                        </td>
                        <td style={{width:130}} className="desktop-only">
                          <div className="cell">{isEdit?eF("phone",{placeholder:"(000) 000-0000"}):<a href={`tel:${l.phone}`} style={{color:"#0073ea",textDecoration:"none",fontSize:13}}>{l.phone||<span style={{color:"#ccc"}}>—</span>}</a>}</div>
                        </td>
                        <td style={{width:170}} className="desktop-only">
                          <div className="cell" style={{gap:4}}>
                            {l.location&&!isEdit&&<span style={{fontSize:11}}>📍</span>}
                            {isEdit?eF("location",{placeholder:"Address"}):<span style={{fontSize:12,color:"#555",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.location||<span style={{color:"#ccc"}}>—</span>}</span>}
                          </div>
                        </td>
                        <td style={{width:160}} className="desktop-only">
                          <div className="cell">{isEdit?eF("email",{type:"email",placeholder:"email@…"}):<a href={`mailto:${l.email}`} style={{color:"#0073ea",textDecoration:"none",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.email||<span style={{color:"#ccc"}}>—</span>}</a>}</div>
                        </td>
                        <td style={{width:185}}>
                          <div className="cell">
                            {isEdit
                              ? <select style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12,cursor:"pointer"}} value={editBuf.status} onChange={e=>setEditBuf(b=>({...b,status:e.target.value}))} onBlur={saveEdit}>
                                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                                </select>
                              : <button className="pill" style={{background:sc.bg,color:sc.text}} onClick={()=>cycleStatus(l.id)} title="Click to change status">{l.status}</button>
                            }
                          </div>
                        </td>
                        <td style={{width:80}} className="desktop-only">
                          <div className="cell">
                            {isEdit
                              ? <select style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12}} value={editBuf.owner} onChange={e=>setEditBuf(b=>({...b,owner:e.target.value}))} onBlur={saveEdit}>
                                  {TEAM.map(t=><option key={t}>{t}</option>)}
                                </select>
                              : l.owner&&l.owner!=="—"
                                ? <span style={{background:"#dde3ff",color:"#1f43b5",borderRadius:20,padding:"2px 9px",fontSize:11,fontWeight:700}}>{l.owner}</span>
                                : <span style={{color:"#ccc"}}>—</span>
                            }
                          </div>
                        </td>
                        <td style={{width:110}} className="desktop-only">
                          <div className="cell">
                            {isEdit?eF("date",{placeholder:"e.g. Mar 5"})
                              :l.date?<span style={{background:"#e8f4ff",color:"#0073ea",borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:500}}>{l.date}</span>
                              :<span style={{color:"#ccc"}}>—</span>}
                          </div>
                        </td>
                        <td style={{width:40}}>
                          <div className="cell" style={{justifyContent:"center",padding:4}}>
                            <button className="del-btn" style={{background:"none",border:"none",cursor:"pointer",color:"#e2445c",fontSize:14,padding:"2px 4px",borderRadius:3}} onClick={()=>del(l.id)} title="Delete">✕</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Add row */}
                  {open && (
                    addGroup===group
                      ? <tr style={{background:"#fafbfc"}}>
                          <td><div className="cell">{aF("name",{autoFocus:true,placeholder:"Client / project…"})}</div></td>
                          <td className="desktop-only"><div className="cell">{aF("phone",{placeholder:"Phone"})}</div></td>
                          <td className="desktop-only"><div className="cell">{aF("location",{placeholder:"Location"})}</div></td>
                          <td className="desktop-only"><div className="cell">{aF("email",{type:"email",placeholder:"Email"})}</div></td>
                          <td>
                            <div className="cell">
                              <select style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12}} value={addBuf.status} onChange={e=>setAddBuf(b=>({...b,status:e.target.value}))}>
                                {STATUSES.map(s=><option key={s}>{s}</option>)}
                              </select>
                            </div>
                          </td>
                          <td className="desktop-only">
                            <div className="cell">
                              <select style={{width:"100%",border:"none",outline:"none",background:"transparent",fontSize:12}} value={addBuf.owner} onChange={e=>setAddBuf(b=>({...b,owner:e.target.value}))}>
                                {TEAM.map(t=><option key={t}>{t}</option>)}
                              </select>
                            </div>
                          </td>
                          <td className="desktop-only"><div className="cell">{aF("date",{placeholder:"Date"})}</div></td>
                          <td>
                            <div className="cell" style={{gap:3,padding:4}}>
                              <button onClick={saveAdd} style={{background:"#00c875",color:"#fff",border:"none",borderRadius:3,padding:"3px 7px",fontSize:13,cursor:"pointer",fontWeight:700}}>✓</button>
                              <button onClick={cancelAdd} style={{background:"#e2445c",color:"#fff",border:"none",borderRadius:3,padding:"3px 6px",fontSize:13,cursor:"pointer"}}>✕</button>
                            </div>
                          </td>
                        </tr>
                      : <tr>
                          <td colSpan={8} style={{background:"#fff"}}>
                            <button className="add-btn" onClick={()=>startAdd(group)}>
                              <span style={{fontSize:16,color:"#0073ea",lineHeight:1}}>+</span> Add task
                            </button>
                          </td>
                        </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Legend */}
        <div style={{display:"flex",flexWrap:"wrap",gap:6,alignItems:"center",padding:"4px 8px"}}>
          <span style={{fontSize:11,color:"#999",marginRight:4}}>STATUSES →</span>
          {STATUSES.map(s=>{const sc=STATUS_CONFIG[s];return<span key={s} style={{background:sc.bg,color:sc.text,borderRadius:4,padding:"3px 10px",fontSize:11,fontWeight:700}}>{s}</span>;})}
        </div>
        <div style={{fontSize:11,color:"#bbb",padding:"8px 8px 0"}}>Click a name to open details · Click status pill to cycle · ✏️ to edit inline</div>
      </div>

      {/* ══ DETAIL MODAL ══ */}
      {detailLead && (
        <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)closeDetail();}}>
          <div className="modal">
            {/* Modal header */}
            <div className="modal-header">
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#323338"}}>{detailLead.name}</div>
                <div style={{fontSize:12,color:"#676879",marginTop:2}}>{detailLead.location}</div>
              </div>
              <button onClick={closeDetail} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#676879",padding:"2px 6px"}}>✕</button>
            </div>

            {/* Quick info strip */}
            <div style={{display:"flex",gap:16,padding:"10px 20px",background:"#f5f6f8",borderBottom:"1px solid #e6e9ef",flexWrap:"wrap"}}>
              {detailLead.phone&&<a href={`tel:${detailLead.phone}`} style={{color:"#0073ea",textDecoration:"none",fontSize:13}}>📞 {detailLead.phone}</a>}
              {detailLead.email&&<a href={`mailto:${detailLead.email}`} style={{color:"#0073ea",textDecoration:"none",fontSize:13}}>✉️ {detailLead.email}</a>}
              <span><button className="pill" style={{background:STATUS_CONFIG[detailLead.status]?.bg,color:"#fff"}}>{detailLead.status}</button></span>
              {detailLead.owner&&detailLead.owner!=="—"&&<span style={{background:"#dde3ff",color:"#1f43b5",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:700}}>👤 {detailLead.owner}</span>}
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              {["Updates","Files","Activity"].map(t=>(
                <button key={t} className={`modal-tab ${detailTab===t?"active":""}`} onClick={()=>setDetailTab(t)}>
                  {t==="Updates"?"💬 Updates / "+((detailLead.comments||[]).length):t==="Files"?"📎 Files / "+((detailLead.files||[]).length):"📋 Activity"}
                </button>
              ))}
            </div>

            {/* Tab body */}
            <div className="modal-body">
              {detailTab==="Updates" && (
                <>
                  {/* Write update */}
                  <div style={{marginBottom:16,background:"#f9f9fb",border:"1px solid #e6e9ef",borderRadius:6,padding:12}}>
                    <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#676879",fontWeight:600}}>Posting as:</span>
                      <select value={commenter} onChange={e=>setCommenter(e.target.value)} style={{border:"1px solid #e0e3ea",borderRadius:4,padding:"2px 8px",fontSize:12,background:"#fff"}}>
                        {["Matt","Vince","Other"].map(n=><option key={n}>{n}</option>)}
                      </select>
                    </div>
                    <textarea
                      value={newComment}
                      onChange={e=>setNewComment(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)addComment();}}
                      placeholder="Write an update… (Ctrl+Enter to post)"
                      style={{width:"100%",border:"1px solid #e0e3ea",borderRadius:4,padding:8,fontSize:13,resize:"vertical",minHeight:70,outline:"none",fontFamily:"inherit"}}
                    />
                    <button onClick={addComment} style={{marginTop:8,background:"#0073ea",color:"#fff",border:"none",borderRadius:4,padding:"6px 16px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                      Post Update
                    </button>
                  </div>

                  {/* Comments list */}
                  {(detailLead.comments||[]).slice().reverse().map(c=>(
                    <div key={c.id} className="comment-box">
                      <div className="comment-author">👤 {c.author}</div>
                      <div className="comment-text">{c.text}</div>
                      <div className="comment-time">{fmtDate(c.ts)}</div>
                    </div>
                  ))}
                  {!(detailLead.comments||[]).length && <div style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>No updates yet — be the first to add one.</div>}
                </>
              )}

              {detailTab==="Files" && (
                <>
                  <label style={{display:"inline-block",background:"#0073ea",color:"#fff",border:"none",borderRadius:4,padding:"7px 16px",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:16}}>
                    📎 Upload Files
                    <input type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{display:"none"}} onChange={handleFileUpload} />
                  </label>
                  {(detailLead.files||[]).map(f=>(
                    <div key={f.id} className="file-card">
                      {f.type?.startsWith("image/")
                        ? <img src={f.data} alt={f.name} style={{width:60,height:60,objectFit:"cover",borderRadius:4,flexShrink:0}} />
                        : <span style={{fontSize:28}}>📄</span>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                        <div style={{fontSize:11,color:"#999"}}>{f.uploader} · {fmtDate(f.ts)}</div>
                      </div>
                      <a href={f.data} download={f.name} style={{color:"#0073ea",fontSize:12,textDecoration:"none",fontWeight:600}}>↓ Save</a>
                    </div>
                  ))}
                  {!(detailLead.files||[]).length && <div style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"20px 0"}}>No files uploaded yet.</div>}
                </>
              )}

              {detailTab==="Activity" && (
                <div style={{fontSize:13,color:"#676879"}}>
                  <div style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>Lead created</div>
                  <div style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>Status: <strong>{detailLead.status}</strong></div>
                  {(detailLead.comments||[]).map(c=>(
                    <div key={c.id} style={{padding:"8px 0",borderBottom:"1px solid #f0f0f0"}}>
                      <strong>{c.author}</strong> added an update · {fmtDate(c.ts)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
