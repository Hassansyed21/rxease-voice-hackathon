'use strict';
const $=id=>document.getElementById(id);
const names=['DemoMed A','DemoMed B','DemoMed AX'];
let reviewed=null, recognition=null;
function reset(){
 reviewed=null;
 $('names').textContent='Review a transcript first.';
 $('confirm').disabled=true;
 $('speak').disabled=true;
 $('result').textContent='No review yet.';
}
function setTranscript(value){
 $('transcript').value=value.slice(0,500);
 reset();
}
$('transcript').addEventListener('input',reset);
$('flow').onclick=()=>{
 $('transcript').focus();
 $('status').textContent='Use your installed Wispr Flow dictation shortcut now.';
};
$('example').onclick=()=>setTranscript('I take DemoMed A and DemoMed B');
$('review').onclick=()=>{
 reset();
 reviewed=$('transcript').value.trim();
 if(!reviewed){$('names').textContent='Enter a fictional transcript first.';return;}
 $('names').textContent='Confirm only the intended fictional names. Unknown names require pharmacist review.';
 for(const name of names){
  const label=document.createElement('label');
  const input=document.createElement('input');
  input.type='checkbox';
  input.value=name;
  input.checked=new RegExp('\\b'+name+'\\b','i').test(reviewed);
  label.append(input,document.createTextNode(' '+name));
  $('names').append(label);
 }
 $('confirm').disabled=false;
};
$('confirm').onclick=()=>{
 if(reviewed!==$('transcript').value.trim())return reset();
 const selected=[...$('names').querySelectorAll('input:checked')].map(x=>x.value);
 const flags=['SIMULATION ONLY — no clinical safety conclusion.'];
 if(!selected.length)flags.push('No confirmed name. Pharmacist review required.');
 if(selected.includes('DemoMed A')||selected.includes('DemoMed AX'))flags.push('Simulated LASA alert: DemoMed A / DemoMed AX. Verify exact name.');
 if(selected.includes('DemoMed A')&&selected.includes('DemoMed B'))flags.push('Simulated interaction alert. Pharmacist review required.');
 flags.push('Unknown names and all real medication questions require professional review. Never change treatment based on this tool.');
 $('result').textContent=flags.join('\n\n');
 $('speak').disabled=false;
};
$('names').addEventListener('change',()=>{
 $('result').textContent='Selection changed. Confirm again.';
 $('speak').disabled=true;
});
$('mic').onclick=()=>{
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){$('status').textContent='Browser recognition unavailable. Use Wispr Flow.';return;}
 if(recognition)return;
 recognition=new Speech();
 recognition.lang=$('language').value;
 recognition.onresult=e=>setTranscript(e.results[0][0].transcript);
 recognition.onerror=e=>{$('status').textContent='Speech error: '+e.error;};
 recognition.onend=()=>{recognition=null;$('mic').disabled=false;};
 try{recognition.start();$('mic').disabled=true;$('status').textContent='Listening…';}
 catch{recognition=null;$('status').textContent='Microphone could not start.';}
};
$('stop').onclick=()=>recognition?.stop();
$('speak').onclick=()=>{
 if(!window.speechSynthesis){$('status').textContent='Speech output unavailable.';return;}
 speechSynthesis.cancel();
 const utterance=new SpeechSynthesisUtterance($('result').textContent);
 utterance.lang='en-IN';
 speechSynthesis.speak(utterance);
};
$('clear').onclick=()=>{
 recognition?.abort();
 window.speechSynthesis?.cancel();
 setTranscript('');
 $('status').textContent='Session cleared.';
};