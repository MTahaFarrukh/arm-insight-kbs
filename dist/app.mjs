import {diagnose} from './engine.mjs';
import {validateKB,validateWorkspace} from './state.mjs';
import {SOURCES,resolveClaims} from './evidence.mjs';
import {cloudEnabled,pullWorkspace,pushWorkspace} from './cloud.mjs';
const $=id=>document.getElementById(id), E=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),v=>v.toString(16).padStart(2,'0')).join('');
const KEY='arm-insight-v2',states=['unknown','yes','no','conflict'];let base,kb,demos,w,evidence={},records={},report,selected=new Set(),toastTimer,guideSeen=new Set(),cloudTimer=null,cloudBusy=false;
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3500);}
function download(name,data,type='application/json'){const u=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1500);}
function draft(){return {evidence:{...evidence},records:structuredClone(records),name:$('casename').value,asset:$('asset').value,notes:$('notes').value,policy:$('policy').value};}
function setSyncUI(mode,detail){
  const label=$('synclabel'),dot=$('syncdot'),info=$('syncdetail'),btn=$('cloudsync');
  if(!label)return;
  const map={local:['Local workspace','Saved in this browser<br>No robot connection'],ready:['Cloud sync ready','Supabase connected · browser + cloud'],syncing:['Syncing…','Pushing workspace to Supabase'],ok:['Synced to Supabase','Cases and tasks mirrored in cloud'],err:['Cloud sync issue',detail||'Check config / schema / network']};
  const [t,d]=map[mode]||map.local;label.textContent=t;info.innerHTML=d;if(btn)btn.hidden=!cloudEnabled();if(dot)dot.style.background=mode==='err'?'#c45c5c':mode==='ok'||mode==='ready'?'#3d9a78':'#6a7989';
}
async function syncCloud(manual=false){
  if(!cloudEnabled()||cloudBusy)return;
  cloudBusy=true;setSyncUI('syncing');
  try{
    w.kb=kb;w.draft=draft();
    await pushWorkspace(w);
    setSyncUI('ok');if(manual)toast('Workspace synced to Supabase.');
  }catch(err){setSyncUI('err',E(err.message));if(manual)toast('Supabase sync failed: '+err.message);}
  finally{cloudBusy=false;}
}
function queueCloudSync(){if(!cloudEnabled())return;clearTimeout(cloudTimer);cloudTimer=setTimeout(()=>syncCloud(false),1200);}
function persist(){w.kb=kb;w.draft=draft();try{localStorage.setItem(KEY,JSON.stringify(w));queueCloudSync();return true;}catch{toast('Storage unavailable or full. Export a backup to keep your work.');return false;}}
function modal(html){$('modalcontent').innerHTML=html;$('modal').showModal();}
function close(){ $('modal').close(); }
function pulseEnter(el){if(!el)return;el.classList.remove('pulse-in','reenter');void el.offsetWidth;el.classList.add('pulse-in','reenter');}
function page(id){document.querySelectorAll('.page').forEach(x=>x.hidden=x.id!==id);document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===id));$('pagetitle').textContent={studio:'Diagnostic studio',cases:'Case history',maintenance:'Maintenance board',rules:'Rule explorer',etl:'Dataset & ETL',evaluation:'Evaluation lab'}[id];const shown=$(id);if(shown)pulseEnter(shown);if(id==='cases')renderCases();if(id==='maintenance')renderBoard();if(id==='rules')renderRules();if(id==='etl')renderEtl();}
function setDraft(d){evidence={...d.evidence};records=structuredClone(d.records||{});$('casename').value=d.name||'';$('asset').value=d.asset||'';$('notes').value=d.notes||'';$('policy').value=d.policy||'Safety first';$('demo').value='';$('search').value='';$('component').value='';renderSymptoms();render();}
function useDemo(i){const c=demos[i];setDraft({evidence:c.evidence,name:c.name+' (demo)',asset:'DEMO-ARM-01',notes:'Synthetic demonstration scenario.',policy:'Safety first'});$('demo').value=i;}
function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function runVivaDemo(){
  const btn=$('vivademo');if(btn){btn.disabled=true;btn.textContent='Running…';}
  try{
    page('studio');
    toast('Viva demo · Step 1: supported payload fault');
    useDemo(0);
    await wait(1600);
    toast('Step 2: conflicting sources on the same symptom');
    setDraft({
      evidence:{protective_stop:'yes',payload_mismatch:'conflict'},
      records:{
        payload_mismatch:[
          {source:'Operator observation',state:'yes',note:'Viva demo · operator reports mismatch',at:new Date().toISOString()},
          {source:'Sensor / controller',state:'no',note:'Viva demo · controller disagrees',at:new Date().toISOString()}
        ]
      },
      name:'Conflicting payload reports (viva)',
      asset:'DEMO-ARM-01',
      notes:'Guided viva walkthrough: opposing Yes/No claims block full rule support.',
      policy:'Safety first'
    });
    await wait(1800);
    toast('Step 3: evaluation lab · 13 synthetic scenarios');
    page('evaluation');
    await wait(500);
    evaluate();
    toast('Viva demo complete · explain the PASS rows and conflict rule.');
  }finally{
    if(btn){btn.disabled=false;btn.textContent='▶ Viva demo';}
  }
}
function dismissSplash(){
  const s=$('splash');if(!s||s.classList.contains('done'))return;
  s.classList.add('done');s.setAttribute('aria-hidden','true');
}
function renderSymptoms(){let filter=$('component').value,term=$('search').value.toLowerCase(),conditions=kb.faults.find(f=>f.id===filter)?.conditions;
 $('symptoms').innerHTML=Object.entries(kb.symptoms).filter(([k,label])=>(!conditions||conditions.includes(k))&&label.toLowerCase().includes(term)).map(([k,label])=>`<div class="symptom" id="sym-${k}"><div class="slabel" id="lbl-${k}">${E(label)}${records[k]?.length?`<small>${records[k].length} source claim(s) logged</small>`:''}</div><div class="segments" role="group" aria-labelledby="lbl-${k}">${states.map((s,i)=>`<button data-key="${k}" data-state="${s}" aria-label="${s}" aria-pressed="${(evidence[k]||'unknown')===s}" class="${(evidence[k]||'unknown')===s?'chosen':''}">${['?','Yes','No','!'][i]}</button>`).join('')}</div></div>`).join('')||'<div class="empty">No matching observations.</div>';}
function render(){report=diagnose(kb,evidence,$('policy').value);let known=Object.values(report.facts).filter(s=>s!=='unknown').length;const supported=report.results.filter(f=>f.status==='Supported');$('supported').textContent=supported.length;$('complete').innerHTML=Math.round(100*known/Object.keys(kb.symptoms).length)+'<em>%</em>';$('observedcount').textContent=`${known} of ${Object.keys(kb.symptoms).length} observations recorded`;$('conflicts').textContent=report.conflicts.length;$('alerts').textContent=report.alerts.length;$('rulecount').textContent=kb.faults.length+' prediction rules';$('mapstatus').textContent=known?`${supported.length} predicted faults · ${known} observations`:'Awaiting observations';
 document.querySelectorAll('.metrics strong').forEach(el=>{el.classList.remove('tick');void el.offsetWidth;el.classList.add('tick');});
 document.querySelectorAll('.hotspot').forEach(g=>g.classList.toggle('alerted',report.results.some(f=>f.id===g.dataset.component&&f.status==='Supported')));
 $('safety').innerHTML=(report.alerts.length?`<div class="alert"><b>Safety escalation</b> · ${report.alerts.map(k=>E(kb.symptoms[k])).join(' · ')}<br>Follow site emergency procedures, keep personnel clear and contact qualified maintenance. No automatic restart.</div>`:'')+(report.conflicts.length?`<div class="alert"><b>Conflicting evidence</b> · ${report.conflicts.map(k=>E(kb.symptoms[k])).join(' · ')}<br>Verify the source before these observations can support a conclusion.</div>`:'');
 const visible=report.results.filter(f=>f.status!=='Unassessed');$('findings').innerHTML=visible.length?visible.map((f,i)=>`<details class="fault" ${i===0?'open':''}><summary><span class="status ${f.status}">${f.status}</span><span class="badge">${f.severity}</span><h3>${E(f.name)}</h3><div class="micro">${E(f.component)} · ${f.coverage}% coverage</div><div class="meter"><i style="width:${f.coverage}%"></i></div></summary><div class="faultbody"><p>${E(f.cause)}</p>${Object.entries(f.groups).filter(([s,ks])=>ks.length).map(([s,ks])=>`<div class="evidence-line"><b>${s}</b>${ks.map(k=>E(kb.symptoms[k])).join(' · ')}</div>`).join('')}${f.status==='Supported'?`<div class="action"><b>Recommended maintenance</b><br>${E(f.action)}<p>Relative cost: ${f.cost} · Downtime: ${f.downtime}</p><button class="smallbutton" data-ticket="${f.id}">＋ Create maintenance task</button></div>`:''}<div class="micro">${E(f.provenance)}</div></div></details>`).join(''):`<div class="panel empty"><div class="target">◎</div><h3>Start with what you observe.</h3><p>Select symptoms, take a guided assessment, or explore a sample investigation.</p><button class="primary" id="trydemo">Explore a payload fault ↗</button></div>`;
 $('nextquestions').innerHTML=report.questions.length?`<div class="questionbox"><h3>Next best checks</h3>${report.questions.slice(0,4).map(k=>`<button data-question="${k}">↗ ${E(kb.symptoms[k])}</button>`).join('')}</div>`:'';$('tracecount').textContent=report.trace.length+' steps';$('trace').innerHTML=report.trace.map((t,i)=>`<div class="trace-step" style="--i:${i}">${String(i+1).padStart(2,'0')} / ${E(t)}</div>`).join('')||'<p class="micro">No inference steps yet.</p>';$('casebadge').textContent=w.cases.length;pulseEnter($('findings'));persist();}
function guided(){const candidates=[...report.questions,...Object.keys(kb.symptoms).filter(k=>(evidence[k]||'unknown')==='unknown')];const k=candidates.find(k=>!guideSeen.has(k));if(!k){modal('<h2>Assessment complete</h2><p>All remaining observations were reviewed or skipped. Inspect the findings and resolve missing evidence when it becomes available.</p><button class="primary" data-close>View findings</button>');return;}modal(`<div class="eyebrow">GUIDED EVIDENCE COLLECTION</div><h2 style="margin-top:16px">One observation at a time.</h2><p>Record known information only. Do not perform physical tests without approved procedures.</p><div class="guidedquestion">${E(kb.symptoms[k])}?</div><div class="guidedanswers">${states.map((s,i)=>`<button class="${s==='yes'?'primary':'secondary'}" data-answer="${s}" data-key="${k}">${['Skip','Yes','No','Conflict'][i]}</button>`).join('')}</div><div class="modalbuttons"><button class="quiet" data-close>Finish assessment</button></div>`);}

function showEvidenceDialog(){
 modal(`<h2>Record an evidence source</h2><p>Separate reports are merged. A Yes and No on the same symptom produce a conflict that blocks full rule support.</p><form id="evidenceform"><label>Observation<select name="symptom">${Object.entries(kb.symptoms).map(([k,v])=>`<option value="${k}">${E(v)}</option>`).join('')}</select></label><div class="two"><label>Source<select name="source">${SOURCES.map(v=>`<option>${E(v)}</option>`).join('')}</select></label><label>Finding<select name="state"><option value="yes">Present (Yes)</option><option value="no">Absent (No)</option></select></label></div><label>Source detail / context<textarea name="note" maxlength="1000" placeholder="e.g. Operator shift log or controller alarm reference"></textarea></label><div id="previousclaims" class="claimlist"></div><div class="modalbuttons"><button type="button" class="secondary" data-close>Cancel</button><button class="primary" type="submit">Add source record</button></div></form>`);
 const select=$('modalcontent').querySelector('[name=symptom]');const list=$('previousclaims');
 const update=()=>{list.innerHTML=(records[select.value]||[]).map(c=>`<div><b>${E(c.source)} / ${c.state.toUpperCase()}</b> · ${E(c.note||'No detail')}<br>${new Date(c.at).toLocaleString()}</div>`).join('')||'<div>No logged source claims for this observation.</div>';};select.onchange=update;update();
}
function addSourceClaim(form){
 const key=form.get('symptom'),source=form.get('source'),state=form.get('state'),note=String(form.get('note')||'').trim();
 if(!(key in kb.symptoms)||!SOURCES.includes(source)||!['yes','no'].includes(state)||note.length>1000){toast('Check the evidence details.');return;}
 const old=records[key]||[],claim={source,state,note,at:new Date().toISOString()};
 if(old.length>=50){toast('Maximum 50 claims per observation.');return;}
 records[key]=[...old,claim];evidence[key]=resolveClaims(records[key]);renderSymptoms();render();close();toast(evidence[key]==='conflict'?'Conflicting sources flagged for review.':'Evidence source recorded.');
}

function renderCases(){const q=$('casesearch').value.toLowerCase(),cs=w.cases.filter(c=>(c.name+' '+c.asset).toLowerCase().includes(q));$('caseitems').innerHTML=cs.length?`<div class="tablewrap"><table><thead><tr><th>SELECT</th><th>INVESTIGATION</th><th>HYPOTHESES</th><th>ACTIONS</th></tr></thead><tbody>${cs.map(c=>{const r=diagnose(c.kb,c.evidence,c.policy);return `<tr><td><input type="checkbox" data-select="${E(c.id)}" ${selected.has(c.id)?'checked':''} aria-label="Select ${E(c.name)}"></td><td>${E(c.name)}<small>${E(c.asset||'No asset ID')} · ${new Date(c.created).toLocaleDateString()}</small></td><td>${r.results.filter(f=>f.status==='Supported').length} supported<small>${Object.values(c.evidence).filter(v=>v!=='unknown').length} observations</small></td><td><div class="tableactions"><button class="quiet" data-open="${E(c.id)}">Open</button><button class="quiet" data-delete="${E(c.id)}">Delete</button></div></td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">No saved investigations found. Save a case from the diagnostic studio.</div>';}
function renderBoard(){$('board').innerHTML=['Open','In progress','Completed'].map(s=>`<div class="boardcolumn"><h2>${s} <span class="badge">${w.tickets.filter(t=>t.status===s).length}</span></h2>${w.tickets.filter(t=>t.status===s).map(t=>`<article class="ticket"><span class="status">${E(t.severity)}</span><h3>${E(t.name)}</h3><p>${E(t.asset||'Unassigned asset')}</p><p>${E(t.action)}</p><label>Work status<select data-task="${E(t.id)}">${['Open','In progress','Completed'].map(x=>`<option ${x===s?'selected':''}>${x}</option>`).join('')}</select></label><p class="micro">Tracking only; not a safety clearance.</p></article>`).join('')||'<p class="micro">No tasks in this stage.</p>'}</div>`).join('');}
function renderRules(){$('rulecards').innerHTML=kb.faults.map((f,i)=>`<article class="rulecard"><div class="eyebrow">R${String(i+1).padStart(2,'0')} / ${E(f.component)}</div><h3>${E(f.name)}</h3><code>IF ${f.conditions.map(k=>E(kb.symptoms[k])+' = YES').join('<br>AND ')}<br>THEN ${E(f.name)}</code><p>${E(f.provenance)}</p><div class="cardactions"><span class="badge">${f.severity} · ${f.cost} cost</span><button class="smallbutton" data-edit="${f.id}">Edit rule ↗</button></div></article>`).join('');}
function editRule(id){const f=kb.faults.find(f=>f.id===id);modal(`<h2>Edit diagnostic rule</h2><p>Changes affect future diagnoses. These are educational rules and require expert validation.</p><form id="ruleform" data-id="${id}"><label>Fault name<input name="name" value="${E(f.name)}" required maxlength="120"></label><div class="two"><label>Severity<select name="severity">${['Critical','High','Medium'].map(x=>`<option ${x===f.severity?'selected':''}>${x}</option>`).join('')}</select></label><label>Relative cost<select name="cost">${['Low','Medium','High'].map(x=>`<option ${x===f.cost?'selected':''}>${x}</option>`).join('')}</select></label></div><label>Downtime<select name="downtime">${['Short','Medium','Long'].map(x=>`<option ${x===f.downtime?'selected':''}>${x}</option>`).join('')}</select></label><p>Required observations (all must be Yes)</p><div class="checklist">${Object.entries(kb.symptoms).map(([k,l])=>`<label><input type="checkbox" name="condition" value="${k}" ${f.conditions.includes(k)?'checked':''}>${E(l)}</label>`).join('')}</div><label>Cause<textarea name="cause" required maxlength="2000">${E(f.cause)}</textarea></label><label>Maintenance action<textarea name="action" required maxlength="2000">${E(f.action)}</textarea></label><div id="ruleerror" class="error"></div><div class="modalbuttons"><button type="button" class="secondary" data-close>Cancel</button><button type="submit" class="primary">Save rule</button></div></form>`);}
function evaluate(){const rows=demos.map(c=>{const actual=diagnose(kb,c.evidence).results.filter(f=>f.status==='Supported').map(f=>f.id).sort(),expected=[...c.expected_supported].sort();return {name:c.name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)};});$('testresults').classList.remove('empty');$('testresults').innerHTML=`<div class="panelhead"><h2>${rows.filter(r=>r.pass).length} / ${rows.length} scenarios passed</h2><span class="badge">Current rules · ${new Date().toLocaleTimeString()}</span></div><div class="tablewrap"><table><thead><tr><th>SCENARIO</th><th>EXPECTED</th><th>ACTUAL</th><th>RESULT</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.name)}</td><td>${E(r.expected.join(', ')||'None')}</td><td>${E(r.actual.join(', ')||'None')}</td><td class="${r.pass?'pass':'fail'}">${r.pass?'PASS':'FAIL'}</td></tr>`).join('')}</tbody></table></div>`;}
let etlReport=null,etlCases=[];
function renderEtl(){
 if(!etlReport){$('etlmetrics').innerHTML='';$('etlsteps').innerHTML='<div class="empty">ETL report not loaded. Run parse + <code>dataset/run_etl_notebook_logic.py</code> (or open <code>etl_cleaning.ipynb</code>).</div>';$('etldrops').innerHTML='';$('etlcases').innerHTML='';return;}
 const c=etlReport.cleaning||{},src=etlReport.source||{};
 const srcLine=src.name?`<p class="micro"><b>Authentic source:</b> ${E(src.name)}${src.doi?` · DOI ${E(src.doi)}`:''}${src.license?` · ${E(src.license)}`:''}${src.url?` · <a href="${E(src.url)}" target="_blank" rel="noopener">UCI archive</a>`:''}</p>`:'';
 $('etlmetrics').innerHTML=`${srcLine}<div><span>UCI INSTANCES</span><strong>${c.rows_in??0}</strong><small>Authentic extract</small></div><div><span>SENSOR KEPT</span><strong>${c.sensor_rows_kept??c.kept??0}</strong><small>After cleaning</small></div><div><span>NOISE DROPPED</span><strong>${c.rows_removed??0}</strong><small>Outliers / duplicates</small></div><div><span>EVIDENCE ROWS</span><strong>${c.rows_out??0}</strong><small>After knowledge map</small></div><div><span>PRED. CASES</span><strong>${etlCases.length}</strong><small>LP1–LP5 assets</small></div>`;
 $('etlsteps').innerHTML=(c.steps||[]).map(s=>`<div class="trace-step"><b>Step ${s.step}: ${E(s.name)}</b><br>${E(s.detail)}</div>`).join('')||'<p class="micro">No steps recorded.</p>';
 const drops=c.drop_breakdown||c.dropped||{};
 $('etldrops').innerHTML=Object.keys(drops).length?`<div class="tablewrap"><table><thead><tr><th>NOISE / DROP REASON</th><th>COUNT</th></tr></thead><tbody>${Object.entries(drops).map(([k,v])=>`<tr><td>${E(k)}</td><td>${v}</td></tr>`).join('')}</tbody></table></div><p class="micro">Sensor rows kept: ${c.sensor_rows_kept??c.kept??0} · duplicates removed: ${c.duplicates_removed||0} · evidence rows after class→symptom map: ${c.rows_out??0}</p>`:'<p class="micro">No drops recorded.</p>';
 $('etlcasecount').textContent=etlCases.length+' assets';
 $('etlcases').innerHTML=etlCases.length?`<div class="tablewrap"><table><thead><tr><th>ASSET</th><th>EVIDENCE KEYS</th><th>PREDICT</th></tr></thead><tbody>${etlCases.map((c,i)=>{const keys=Object.keys(c.evidence||{});return `<tr><td>${E(c.asset)}</td><td>${E(keys.join(', ')||'—')}</td><td><button class="quiet" data-etlcase="${i}">Open prediction ↗</button></td></tr>`;}).join('')}</tbody></table></div>`:'<div class="empty">No prediction cases.</div>';
}
function openEtlCase(i){
 const c=etlCases[i];if(!c)return;
 setDraft({evidence:c.evidence||{},records:c.records||{},name:c.name,asset:c.asset,notes:c.notes||'',policy:'Safety first'});
 page('studio');toast('ETL case loaded · predictions updated from cleaned evidence.');
}
function runEtlPredictions(){
 if(!etlCases.length){toast('No ETL prediction cases loaded.');return;}
 const rows=etlCases.map(c=>{const r=diagnose(kb,c.evidence||{});const supported=r.results.filter(f=>f.status==='Supported').map(f=>f.id);return {asset:c.asset,supported,alerts:r.alerts};});
 $('etlcases').innerHTML=`<div class="panelhead"><h2>Batch predictions (forward chaining)</h2></div><div class="tablewrap"><table><thead><tr><th>ASSET</th><th>PREDICTED FAULTS</th><th>SAFETY ALERTS</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${E(r.asset)}</td><td>${E(r.supported.join(', ')||'None supported')}</td><td>${E(r.alerts.join(', ')||'—')}</td></tr>`).join('')}</tbody></table></div>`;
 toast('Predictions generated from cleaned ETL cases.');
}
try{[base,demos]=await Promise.all(['knowledge_base.json','sample_cases.json'].map(async p=>{const r=await fetch(p);if(!r.ok)throw Error('Data load failed');return r.json();}));
 try{const [er,ec]=await Promise.all(['etl_cleaning_report.json','prediction_cases.json'].map(async p=>{const r=await fetch(p);return r.ok?r.json():null;}));etlReport=er;etlCases=Array.isArray(ec)?ec:[];}catch{etlReport=null;etlCases=[];}
 w={format:KEY,kb:structuredClone(base),cases:[],tickets:[]};try{const raw=localStorage.getItem(KEY);if(raw)w=validateWorkspace(JSON.parse(raw),base);}catch{toast('Stored data could not be loaded. Starting a fresh session.');}
 if(cloudEnabled()){
  setSyncUI('ready');
  try{
   const remote=await pullWorkspace();
   if(remote?.workspace){
    const localEmpty=!w.cases.length&&!w.tickets.length;
    const cloudHas=(Array.isArray(remote.workspace.cases)&&remote.workspace.cases.length)||(Array.isArray(remote.workspace.tickets)&&remote.workspace.tickets.length);
    if(localEmpty&&cloudHas){w=validateWorkspace({...remote.workspace,format:KEY,kb:remote.workspace.kb||structuredClone(base)},base);localStorage.setItem(KEY,JSON.stringify(w));toast('Loaded shared workspace from Supabase.');setSyncUI('ok');}
   }
  }catch(err){setSyncUI('err',err.message);toast('Could not reach Supabase. Working offline.');}
 }else setSyncUI('local');
 kb=w.kb;
 for(const [i,c] of demos.entries())$('demo').add(new Option(c.name,i));for(const f of kb.faults)$('component').add(new Option(f.component,f.id));$('loading').hidden=true;$('studio').hidden=false;setDraft(w.draft||{evidence:{}});
 // Soft blended glow that follows the pointer
 const glow=$('cursor-glow');
 if(glow&&window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  let gx=-999,gy=-999,tx=-999,ty=-999;
  document.body.classList.add('has-cursor-glow');
  window.addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY;glow.classList.add('on');},{passive:true});
  window.addEventListener('pointerleave',()=>glow.classList.remove('on'));
  (function follow(){gx+=(tx-gx)*.14;gy+=(ty-gy)*.14;glow.style.transform=`translate3d(${gx}px,${gy}px,0) translate(-50%,-50%)`;requestAnimationFrame(follow);})();
 }
 document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));$('theme').onclick=()=>document.body.classList.toggle('light');$('search').oninput=renderSymptoms;$('component').onchange=renderSymptoms;$('policy').onchange=render;['casename','asset','notes'].forEach(k=>$(k).oninput=persist);$('demo').onchange=()=>{if($('demo').value!=='')useDemo(Number($('demo').value));};
 if($('cloudsync'))$('cloudsync').onclick=()=>syncCloud(true);
 $('symptoms').onclick=e=>{const b=e.target.closest('[data-key]');if(!b)return;evidence[b.dataset.key]=b.dataset.state;delete records[b.dataset.key];$('demo').value='';b.parentElement.querySelectorAll('button').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',x===b);x.classList.remove('pop');});b.classList.add('pop');render();};
 if($('vivademo'))$('vivademo').onclick=()=>runVivaDemo();
 setTimeout(dismissSplash,window.matchMedia('(prefers-reduced-motion: reduce)').matches?150:2100);
 if($('splash'))$('splash').onclick=dismissSplash;
 $('newcase').onclick=()=>{modal('<h2>Start a new investigation?</h2><p>The current draft will be cleared. Save it first if you need to keep it.</p><div class="modalbuttons"><button class="secondary" data-close>Cancel</button><button class="primary" id="confirmnew">Start new</button></div>');};
 $('guided').onclick=()=>{guideSeen=new Set();guided();};$('addevidence').onclick=showEvidenceDialog;$('savecase').onclick=()=>{const d=draft();if(!d.name.trim()){toast('Enter a case name first.');$('casename').focus();return;}const item={...d,id:uid(),created:new Date().toISOString(),kb:structuredClone(kb)};w.cases.unshift(item);if(!persist()){w.cases.shift();return;}render();toast('Investigation saved locally.');};
 $('findings').onclick=e=>{if(e.target.id==='trydemo')useDemo(0);const b=e.target.closest('[data-ticket]');if(b){const f=report.results.find(f=>f.id===b.dataset.ticket);const asset=$('asset').value;if(w.tickets.some(t=>t.fault===f.id&&t.asset===asset&&t.status!=='Completed')){toast('An active task already exists for this fault and asset.');return;}w.tickets.push({id:uid(),fault:f.id,name:f.name,action:f.action,severity:f.severity,asset,status:'Open'});persist();toast('Task added to maintenance board.');}};
 const focusQuestion=k=>{$('search').value='';$('component').value='';renderSymptoms();const r=$('sym-'+k);r.scrollIntoView({behavior:'smooth',block:'center'});r.querySelector('button').focus({preventScroll:true});};$('nextquestions').onclick=e=>{const b=e.target.closest('[data-question]');if(b)focusQuestion(b.dataset.question);};
 document.querySelectorAll('.hotspot').forEach(g=>{const action=()=>{$('component').value=g.dataset.component;renderSymptoms();$('symptoms').scrollIntoView({behavior:'smooth',block:'center'});};g.onclick=action;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};});$('allcomponents').onclick=()=>{$('component').value='';renderSymptoms();};
 $('casesearch').oninput=renderCases;$('caseitems').onchange=e=>{if(e.target.dataset.select){if(e.target.checked)selected.add(e.target.dataset.select);else selected.delete(e.target.dataset.select);}};
 $('caseitems').onclick=e=>{const open=e.target.dataset.open,del=e.target.dataset.delete;if(open){const c=w.cases.find(c=>c.id===open);kb=structuredClone(c.kb);setDraft(c);page('studio');toast('Case reopened with its saved rule snapshot.');}if(del)modal(`<h2>Delete this investigation?</h2><p>This removes the saved case from this browser.</p><div class="modalbuttons"><button class="secondary" data-close>Cancel</button><button class="primary" data-confirm-delete="${E(del)}">Delete case</button></div>`);};
 $('compare').onclick=()=>{if(selected.size!==2){toast('Select exactly two investigations.');return;}const cs=[...selected].map(id=>w.cases.find(c=>c.id===id));$('comparison').innerHTML=`<div class="panel method"><h2>Evidence comparison</h2><div class="tablewrap"><table><thead><tr><th>OBSERVATION</th>${cs.map(c=>`<th>${E(c.name)}</th>`).join('')}</tr></thead><tbody>${Object.entries(kb.symptoms).filter(([k])=>cs.some(c=>(c.evidence[k]||'unknown')!=='unknown')).map(([k,l])=>`<tr><td>${E(l)}</td>${cs.map(c=>`<td>${E(c.evidence[k]||'unknown')}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;};
 $('board').onchange=e=>{if(e.target.dataset.task){w.tickets.find(t=>t.id===e.target.dataset.task).status=e.target.value;persist();renderBoard();toast('Task status updated.');}};
 $('rulecards').onclick=e=>{const b=e.target.closest('[data-edit]');if(b)editRule(b.dataset.edit);};$('runtests').onclick=evaluate;
 if($('runetlpred'))$('runetlpred').onclick=runEtlPredictions;
 if($('etlcases'))$('etlcases').onclick=e=>{const b=e.target.closest('[data-etlcase]');if(b)openEtlCase(Number(b.dataset.etlcase));};
 $('modalcontent').onclick=e=>{if(e.target.hasAttribute('data-close'))close();if(e.target.id==='confirmnew'){close();setDraft({evidence:{}});}if(e.target.dataset.answer){evidence[e.target.dataset.key]=e.target.dataset.answer;delete records[e.target.dataset.key];guideSeen.add(e.target.dataset.key);renderSymptoms();render();close();guided();}if(e.target.dataset.confirmDelete){w.cases=w.cases.filter(c=>c.id!==e.target.dataset.confirmDelete);selected.delete(e.target.dataset.confirmDelete);persist();renderCases();$('comparison').innerHTML='';close();}};
 $('modalcontent').onsubmit=e=>{if(e.target.id==='evidenceform'){e.preventDefault();addSourceClaim(new FormData(e.target));return;}if(e.target.id!=='ruleform')return;e.preventDefault();const form=new FormData(e.target),old=kb.faults.find(f=>f.id===e.target.dataset.id),updated={...old};for(const k of ['name','severity','cost','downtime','cause','action'])updated[k]=form.get(k).trim();updated.conditions=form.getAll('condition');updated.provenance='User-edited educational rule; requires expert validation.';const next=structuredClone(kb);next.faults[next.faults.findIndex(f=>f.id===updated.id)]=updated;try{validateKB(next,base);kb=next;render();renderRules();close();$('testresults').innerHTML='Rules changed. Run evaluation again.';toast('Rule updated. Run the evaluation suite to check its effects.');}catch(err){$('ruleerror').textContent=err.message;}};
 $('kbexport').onclick=()=>download('arm_insight_knowledge_base.json',JSON.stringify(kb,null,2));$('backup').onclick=()=>{persist();download('arm_insight_workspace.json',JSON.stringify(w,null,2));};$('restore').onclick=()=>$('restorefile').click();
 $('restorefile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5000000)throw Error('Backup exceeds 5 MB.');const incoming=validateWorkspace(JSON.parse(await f.text()),base);modal('<h2>Replace local workspace?</h2><p>This replaces current cases, tasks, rules and draft with the selected backup. Export your current workspace first if needed.</p><div class="modalbuttons"><button class="secondary" data-close>Cancel</button><button class="primary" id="applyrestore">Restore backup</button></div>');$('applyrestore').onclick=()=>{w=incoming;kb=w.kb;selected.clear();setDraft(w.draft||{evidence:{}});close();page('studio');toast('Workspace restored.');};}catch(err){toast(err.message);}e.target.value='';};
 $('exportreport').onclick=()=>{const d=draft();let lines=['ARM / INSIGHT — Investigation Report',d.name||'Untitled investigation','Asset: '+d.asset,new Date().toISOString(),'Policy: '+report.policy,'Academic prototype. Coverage is not probability.','', 'SAFETY ALERTS',...report.alerts.map(k=>kb.symptoms[k]),'', 'OBSERVATIONS',...Object.entries(report.facts).map(([k,v])=>kb.symptoms[k]+': '+v),'','FINDINGS'];for(const f of report.results.filter(f=>f.status!=='Unassessed'))lines.push('',`${f.name} | ${f.status} | ${f.coverage}% coverage`,f.cause,...Object.entries(f.groups).map(([s,ks])=>s+': '+ks.map(k=>kb.symptoms[k]).join('; ')),...(f.status==='Supported'?[f.action]:[]),f.provenance);lines.push('','NOTES',d.notes,'','REASONING TRACE',...report.trace,'','No result certifies equipment safety.');download('arm_insight_report.txt',lines.join('\n'),'text/plain');};
}catch(err){$('loading').textContent='Unable to load the project. Please refresh. '+err.message;console.error(err);}
