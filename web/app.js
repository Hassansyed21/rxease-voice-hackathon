'use strict';
const $=id=>document.getElementById(id);
const initial=()=>({verified:false,checked:false,credentials:false,note:'',rx:false,dispensed:0,order:false,consent:false,report:0,released:0,update:'',reply:'',ack:false,appointment:'',events:[]});
let s=initial();
try{const raw=sessionStorage.getItem('rx-care-v1');if(raw)s={...initial(),...JSON.parse(raw)};}catch{}
const panel=$('panel');
function el(tag,text,parent=panel){
 const node=document.createElement(tag);
 node.textContent=text;
 parent.append(node);
 return node;
}
function action(label,fn,enabled=true){
 const b=el('button',label);
 b.disabled=!enabled;
 b.onclick=fn;
 return b;
}
function record(message){
 s.events.push(message);
 try{sessionStorage.setItem('rx-care-v1',JSON.stringify(s));}catch{}
 render();
}
function line(text){return el('p',text);}
function field(label){
 const l=el('label',label);
 const t=el('textarea','',l);
 t.rows=4;
 t.maxLength=1000;
 return t;
}
function dictate(label,example,submit){
 const consent=el('label','Consent to voice entry (fictional data only) ');
 const c=document.createElement('input');
 c.type='checkbox';
 consent.append(c);
 const t=field('Dictate with Wispr Flow — '+label);
 t.disabled=true;
 const hint=line('Enable consent, focus the field, then use your installed Wispr Flow shortcut. Typing is available.');
 const preview=line('');
 const confirm=el('label','I checked medicine names, quantities and dates ');
 const check=document.createElement('input');
 check.type='checkbox';
 confirm.append(check);
 const send=action(submit.label,()=>{
  if(!c.checked||!check.checked||!t.value.trim())return;
  submit.run(t.value.trim());
 },false);
 function refresh(){
  t.disabled=!c.checked;
  const value=t.value.trim();
  const tokens=value.match(/\b(?:\d+|four|fourteen|twelve|DemoMed)\b/gi)||[];
  preview.textContent=value?'Confirm extracted terms: '+(tokens.join(', ')||'No known terms; review original text.'):'No text received. Try again or type your update.';
  const ambiguous=/\b(14|fourteen)\b/i.test(value);
  if(ambiguous)preview.textContent+=' Did you receive four tablets or fourteen? Correct before sending.';
  send.disabled=!c.checked||!check.checked||!value||ambiguous;
 }
 c.onchange=refresh;
 check.onchange=refresh;
 t.oninput=()=>{check.checked=false;refresh();};
 action('Focus for Wispr Flow',()=>{if(c.checked)t.focus();else hint.textContent='Consent required first.';});
 action('Load fictional example (typed demo)',()=>{if(c.checked){t.value=example;check.checked=false;refresh();}});
}
function patient(){
 el('h2','Patient · Asha Demo');
 line('Synthetic case RX-001');
 action('Simulate contact verification',()=>{s.verified=true;record('Demo contact verified');},!s.verified);
 line(s.verified?'Contact verified (simulation)':'Contact not verified');
 action('Check in (demo code RX-001)',()=>{s.checked=true;record('Patient checked in');},s.verified&&!s.checked);
 line(s.checked?'Checked in':'Awaiting check-in');
 if(s.rx)line(s.dispensed+' dispensed · '+(12-s.dispensed)+' still to collect');
 if(s.order&&!s.consent)action('Approve sharing with Demo Lab',()=>{s.consent=true;record('Patient approved lab sharing');});
 if(s.report>s.released)line('Report awaiting clinician review');
 if(s.released&&s.report===s.released)line('Released synthetic report ACC-001 · version '+s.released+' · fictional screening result');
 if(s.rx&&s.report){
  dictate('patient update','I got four of the twelve tablets, aur report bhi aa gayi hai.',{label:'Send update',run:v=>{s.update=v;s.reply='';s.ack=false;record('Update sent to your clinic');}});
 }
 if(s.update)line('Sent update: '+s.update);
 if(s.reply){
  line('Clinician plan: '+s.reply);
  action('Acknowledge plan',()=>{s.ack=true;record('Patient acknowledged plan');},!s.ack);
  const d=el('input','');d.type='date';
  action('Book or reschedule follow-up',()=>{if(d.value){s.appointment=d.value;record('Follow-up booked: '+d.value);}});
 }
}
function doctor(){
 el('h2','Doctor · Demo clinician');
 line('Patient: Asha Demo · '+(s.checked?'Checked in':'Not checked in'));
 line('Credential status: '+(s.credentials?'Demo approved':'Pending'));
 if(!s.checked||!s.credentials)return;
 dictate('consultation note','Patient came to discuss a screening result. Review the lab report at the next visit.',{label:'Approve note',run:v=>{s.note=v;record('Visit note approved');}});
 if(s.note){
  line('Approved visit note: '+s.note);
  line('Fictional prescription: DemoMed · 12 tablets. Quantity check only; no clinical dose recommendation.');
  const label=el('label','Reviewed fictional quantity and safety limitations ');
  const c=document.createElement('input');c.type='checkbox';label.append(c);
  const b=action('Issue demo prescription RX-001',()=>{if(c.checked){s.rx=true;record('Demo prescription issued');}},false);
  c.onchange=()=>b.disabled=!c.checked||s.rx;
  action('Order synthetic screening test',()=>{s.order=true;record('Lab order placed');},!s.order);
 }
 if(s.report>s.released)action('Review and release report version '+s.report,()=>{s.released=s.report;record('Clinician released report version '+s.report);});
 if(s.update){
  line('Patient update: '+s.update);
  line('Supply: '+s.dispensed+'/12; report version '+s.report+'; released '+s.released);
  const t=field('Clinician follow-up plan');
  action('Send clinician plan',()=>{if(t.value.trim()){s.reply=t.value.trim();s.ack=false;record('Clinician plan sent');}});
 }
 if(s.appointment)action('Record attendance for '+s.appointment,()=>{record('Follow-up attendance recorded');});
}
function pharmacy(){
 el('h2','Pharmacist · Demo pharmacy');
 line(s.credentials?'Demo credentials approved':'Credentials pending');
 line(s.rx?'Demo prescription RX-001 found; not a cryptographic signature':'No prescription issued');
 if(!s.rx||!s.credentials)return;
 line('Prescribed: 12 · supplied: '+s.dispensed+' · outstanding: '+(12-s.dispensed));
 const q=el('input','');q.type='number';q.min=1;q.max=12-s.dispensed;q.value=Math.min(4,12-s.dispensed);
 action('Record quantity supplied',()=>{const n=Number(q.value);if(Number.isInteger(n)&&n>0&&n<=12-s.dispensed){s.dispensed+=n;record('Pharmacy supplied '+n+' tablets');}else line('Invalid quantity');},s.dispensed<12);
}
function lab(){
 el('h2','Lab staff · Demo Lab');
 line(s.order?'Order ACC-001 exists':'No order');
 line(s.consent?'Sharing approved':'Awaiting patient consent');
 if(!s.credentials||!s.order||!s.consent)return;
 line('Synthetic report only · accession ACC-001');
 action(s.report?'Submit corrected synthetic report':'Upload synthetic report',()=>{s.report++;record(s.report>1?'Updated report awaiting review':'Report ready for review');});
}
function admin(){
 el('h2','Administrator · Credential queue');
 line('Doctor, pharmacy and lab credentials are fictional.');
 action('Approve all demo credentials',()=>{s.credentials=true;record('Demo credentials approved');},!s.credentials);
}
function render(){
 panel.replaceChildren();
 const role=$('role').value;
 ({Patient:patient,Doctor:doctor,Pharmacist:pharmacy,'Lab staff':lab,Administrator:admin})[role]();
 $('timeline').replaceChildren();
 const pending=[];
 if(s.rx&&s.dispensed<12)pending.push((12-s.dispensed)+' tablets outstanding');
 if(s.order&&!s.consent)pending.push('Lab sharing consent pending');
 if(s.report>s.released)pending.push('Report review pending');
 if(s.update&&!s.reply)pending.push('Clinician response pending');
 if(s.reply&&!s.ack)pending.push('Patient acknowledgement pending');
 el('p','Outstanding: '+(pending.join(' · ')||'None recorded'),$('timeline'));
 for(const event of s.events)el('p',event,$('timeline'));
}
$('role').onchange=render;
$('reset').onclick=()=>{if(confirm('Reset this fictional case?')){s=initial();record('Case reset');}};
render();