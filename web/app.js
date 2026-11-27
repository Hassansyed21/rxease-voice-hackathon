import { QRCode, errorCorrection } from './vendor/qr.js';

const $ = id => document.getElementById(id);
const key = 'rxease-journey-v2';
const titles = { Patient: 'Patient workspace', Doctor: 'Clinician worklist', Pharmacist: 'Dispensing desk', 'Lab staff': 'Laboratory worklist', Administrator: 'Demo administration' };
const empty = () => ({ patient: null, verified: false, consent: false, checked: false, staff: {}, note: null, rx: null, fills: [], lab: null, reports: [], updates: [], plan: null, visit: null, caregiver: false, events: [] });
function read() {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : empty();
  } catch {
    return empty();
  }
}
let state = read();
let parent = $('panel');
let caregiverView = false;
let status = '';

function element(tag, text = '', target = parent) {
  const node = document.createElement(tag);
  node.textContent = text;
  target.append(node);
  return node;
}
function card(title, heading = 'h3') {
  parent = element('section', '', $('panel'));
  element(heading, title);
}
function line(text) { return element('p', text); }
function button(text, run, enabled = true, secondary = false) {
  const node = element('button', text);
  node.type = 'button';
  node.disabled = !enabled;
  if (secondary) node.className = 'secondary';
  node.onclick = run;
  return node;
}
function field(label, type = 'text', value = '') {
  const wrap = element('label', label);
  const node = element(type === 'textarea' ? 'textarea' : 'input', '', wrap);
  if (type === 'textarea') node.rows = 3;
  else node.type = type;
  node.maxLength = 1500;
  node.value = value;
  return node;
}
function checkbox(label) {
  const wrap = element('label', label);
  const node = document.createElement('input');
  node.type = 'checkbox';
  wrap.prepend(node);
  return node;
}
function feedback() {
  const node = line('');
  node.className = 'notice';
  node.setAttribute('role', 'status');
  return message => { node.textContent = message; };
}
function record(message, change) {
  const current = read();
  if (JSON.stringify(current) !== JSON.stringify(state)) {
    state = current;
    status = 'The case changed in another tab. Review the latest record and retry.';
    render();
    return;
  }
  const next = structuredClone(state);
  change(next);
  next.events.push({ message, role: $('role').value, at: new Date().toISOString() });
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    status = 'This browser could not save the record. Check its storage settings and retry.';
    render();
    return;
  }
  state = next;
  status = message;
  render();
}
function token(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return prefix + '-' + Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase();
}
function codeBlock(value, label) {
  const qr = new QRCode(-1, errorCorrection.M);
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const canvas = element('canvas');
  canvas.className = 'qr';
  canvas.width = canvas.height = count + 8;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000';
  for (let row = 0; row < count; row++) {
    for (let column = 0; column < count; column++) {
      if (qr.isDark(row, column)) ctx.fillRect(column + 4, row + 4, 1, 1);
    }
  }
  element('code', value);
}
function normalizeCode(value) { return value.trim().toUpperCase(); }
function supplied() { return state.fills.reduce((sum, fill) => sum + fill.quantity, 0); }
function outstanding() { return state.rx ? state.rx.quantity - supplied() : 0; }
function latestReport() { return state.reports.at(-1); }
function releasedReport() { return state.reports.findLast(report => report.released); }

function voice(label, example, action, save, fields = {}) {
  line('Focus the text field and use your installed Wispr Flow shortcut, or type. Review the exact text and confirm before saving.');
  const permission = checkbox('I consent to saving this synthetic text');
  const transcript = field(label, 'textarea');
  const extra = Object.fromEntries(Object.entries(fields).map(([name, caption]) => [name, field(caption)]));
  button('Focus dictation field', () => transcript.focus(), true, true);
  button('Load simulated dictation', () => {
    transcript.value = example;
    transcript.dispatchEvent(new Event('input'));
    transcript.focus();
  }, true, true);
  const confirmation = checkbox('I reviewed the text, quantities and dates');
  const warn = feedback();
  const submit = button(action, () => {
    if (!valid()) return;
    save(transcript.value.trim(), Object.fromEntries(Object.entries(extra).map(([name, node]) => [name, node.value.trim()])));
  }, false);
  function valid() {
    const value = transcript.value.trim();
    const ambiguous = /(?:\b(?:four|4)\s*(?:or|\/|ya)\s*(?:fourteen|14)\b|\b(?:fourteen|14)\s*(?:or|\/|ya)\s*(?:four|4)\b|\b(?:\d+\s*(?:or|ya|\/|–|-)\s*\d+)\s*(?:tablets?|pills?|capsules?|goli)\b)/iu.test(value);
    const missing = Object.values(extra).some(node => !node.value.trim());
    if (!value) warn('Enter a transcript to continue.');
    else if (ambiguous) warn('Resolve the ambiguous quantity in the transcript before saving.');
    else if (missing) warn('Complete the structured fields.');
    else warn('');
    return permission.checked && confirmation.checked && Boolean(value) && !ambiguous && !missing;
  }
  function refresh() { submit.disabled = !valid(); }
  for (const node of [transcript, ...Object.values(extra)]) {
    node.oninput = () => { confirmation.checked = false; refresh(); };
  }
  permission.onchange = confirmation.onchange = refresh;
  refresh();
}

function patient() {
  card('Registration and check-in');
  if (!state.patient) {
    line('Register the fictional patient to begin the demo.');
    const name = field('Synthetic display name', 'text', 'Asha Demo');
    const warn = feedback();
    button('Register demo patient', () => {
      if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(name.value.trim())) return warn('Enter a fictional display name between 2 and 60 characters.');
      record('Synthetic patient registered', next => { next.patient = { name: name.value.trim(), code: token('CHECK') }; });
    });
    return;
  }
  line(state.patient.name + ' · RX-001');
  if (!state.verified) {
    line('Simulated verification code 0426. No message is sent.');
    const otp = field('Demo verification code');
    otp.inputMode = 'numeric';
    const warn = feedback();
    button('Verify demo contact', () => {
      if (otp.value.trim() !== '0426') return warn('Use the displayed simulation code.');
      record('Demo contact verified', next => { next.verified = true; });
    });
    return;
  }
  if (!state.consent) {
    line('Allow this fictional record to appear in the clinical demo workspaces.');
    button('Grant demo care consent', () => record('Patient granted care consent', next => { next.consent = true; }));
    return;
  }
  line(state.checked ? 'Checked in at the clinic' : 'Show this QR code at check-in or copy its token into the clinician workspace.');
  codeBlock(state.patient.code, 'Patient check-in QR');
  if (!state.checked) return;
  if (state.rx) {
    card('Demo prescription');
    line(state.rx.med + ' · ' + state.rx.quantity + ' prescribed · ' + supplied() + ' supplied · ' + outstanding() + ' outstanding');
    codeBlock(state.rx.code, 'Demo prescription QR');
  }
  if (state.lab) {
    card('Laboratory results');
    line(state.lab.test);
    if (!state.lab.consent) {
      button('Grant lab sharing consent', () => record('Patient granted lab sharing consent', next => { next.lab.consent = true; }));
    }
    const report = releasedReport();
    if (report) {
      line('Released version ' + report.version + ' · ' + report.filename);
      line(report.content);
    }
    if (latestReport() && !latestReport().released) line('A report version is awaiting clinician release.');
  }
  card('Voice follow-up');
  const latest = state.updates.at(-1);
  if (latest) line((latest.kind === 'clarification' ? 'Last clarification · ' : 'Last update · ') + latest.text);
  if (state.plan) {
    line('Care plan · ' + state.plan.text);
    line('Treatment goal · ' + state.plan.goal);
    if (state.plan.referral) line('Referral · ' + state.plan.referral);
    button(state.plan.ack ? 'Plan acknowledged' : 'Acknowledge care plan', () => record('Patient acknowledged the care plan', next => { next.plan.ack = true; }), !state.plan.ack);
  }
  voice('Follow-up transcript', 'I collected four of twelve tablets, aur report review ho gayi hai.',
    state.plan ? 'Send clarification' : 'Send follow-up', text => {
      const kind = state.plan ? 'clarification' : 'update';
      record('Patient sent a ' + kind, next => { next.updates.push({ text, kind, reviewed: false }); });
    });
  card('Appointments and caregiver');
  if (state.visit) line('Follow-up · ' + state.visit.date + (state.visit.attended ? ' · Attended' : ' · Booked'));
  const date = field('Follow-up date', 'date', state.visit && !state.visit.attended ? state.visit.date : '');
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().slice(0, 10);
  const warn = feedback();
  button(state.visit && !state.visit.attended ? 'Reschedule follow-up' : 'Book follow-up', () => {
    if (!date.value || date.value < date.min) return warn('Choose today or a future date.');
    const reschedule = state.visit && !state.visit.attended;
    if (reschedule && date.value === state.visit.date) return warn('Choose a different date.');
    record((reschedule ? 'Follow-up rescheduled to ' : 'Follow-up booked for ') + date.value, next => { next.visit = { date: date.value, attended: false }; });
  });
  button(state.caregiver ? 'Revoke caregiver access' : 'Share appointment and goal with caregiver', () => {
    record(state.caregiver ? 'Caregiver access revoked' : 'Caregiver access granted', next => { next.caregiver = !state.caregiver; });
  }, true, true);
  if (state.caregiver) button('Open caregiver view', () => { caregiverView = true; render(); }, true, true);
}

function doctor() {
  card('Clinic check-in');
  if (!state.staff.Doctor) return line('Administrator approval is required for the demo clinician.');
  if (!state.consent) return line('Waiting for patient registration, verification and consent.');
  if (!state.checked) {
    const input = field('Patient check-in token');
    const warn = feedback();
    button('Verify and check in', () => {
      if (normalizeCode(input.value) !== state.patient.code) return warn('Token does not match this demo patient.');
      record('Clinician verified the check-in QR token', next => { next.checked = true; });
    });
    return;
  }
  line(state.patient.name + ' · Checked in');
  card('Consultation');
  if (state.note) {
    line('Approved concern · ' + state.note.concern);
    line('Approved assessment · ' + state.note.assessment);
    line('Approved transcript · ' + state.note.transcript);
  } else {
    voice('Consultation transcript', 'Patient asked about screening and follow-up. Review the synthetic report at the next visit.',
      'Approve structured note', (transcript, fields) => record('Clinician approved the structured consultation note', next => {
        next.note = { transcript, ...fields };
      }), { concern: 'Presenting concern', assessment: 'Assessment and next steps' });
  }
  if (!state.note) return;
  card('Prescription');
  if (state.rx) line(state.rx.med + ' · ' + state.rx.quantity + ' prescribed · ' + supplied() + ' supplied');
  else {
    line('Fictional medication DemoMed. The demo checks quantities and a simulated sensitivity flag.');
    const perDose = field('Units per dose', 'number', '1');
    const frequency = field('Doses per day', 'number', '2');
    const days = field('Days', 'number', '6');
    for (const node of [perDose, frequency, days]) node.min = node.step = '1';
    const sensitivity = checkbox('Simulate a conflicting sensitivity');
    const confirm = checkbox('I approve this fictional prescription and calculated quantity');
    const warn = feedback();
    const issue = button('Issue demo prescription', () => {
      const quantity = calculate();
      if (quantity) record('Clinician issued a demo prescription for ' + quantity + ' units', next => {
        next.rx = { code: token('RX'), quantity, med: 'DemoMed', perDose: +perDose.value, frequency: +frequency.value, days: +days.value };
      });
    }, false);
    function calculate() {
      const values = [perDose, frequency, days].map(node => Number(node.value));
      const quantity = values.reduce((total, value) => total * value, 1);
      const valid = values.every(value => Number.isInteger(value) && value > 0) && quantity <= 1000;
      warn(sensitivity.checked ? 'Simulated safety alert: sensitivity conflict. Issuing is blocked.' : valid ? 'Calculated quantity · ' + quantity + ' units' : 'Enter positive whole numbers with a total of at most 1,000.');
      issue.disabled = !valid || sensitivity.checked || !confirm.checked;
      return issue.disabled ? 0 : quantity;
    }
    for (const node of [perDose, frequency, days, sensitivity]) node.oninput = () => { confirm.checked = false; calculate(); };
    confirm.onchange = calculate;
    calculate();
  }
  card('Lab orders and release');
  if (!state.lab) button('Order synthetic screening', () => record('Clinician ordered synthetic screening', next => {
    next.lab = { test: 'Synthetic screening · ACC-001', consent: false };
  }));
  else line(state.lab.test + (state.lab.consent ? ' · Consent granted' : ' · Awaiting consent'));
  for (const report of state.reports) {
    line('Version ' + report.version + ' · ' + report.filename + ' · ' + (report.released ? 'Released' : report.approved ? 'Approved' : 'Pending review'));
    line(report.content);
    if (report.reason) line('Correction · ' + report.reason);
    if (report !== latestReport() || report.released) continue;
    if (report.approved) button('Release report version ' + report.version, () => record('Clinician released report version ' + report.version, next => { next.reports.at(-1).released = true; }));
    else button('Approve report version ' + report.version, () => record('Clinician approved report version ' + report.version, next => { next.reports.at(-1).approved = true; }));
  }
  card('Follow-up inbox');
  if (!state.updates.length) line('No patient messages yet.');
  for (const update of state.updates) line((update.reviewed ? 'Reviewed' : 'New') + ' ' + update.kind + ' · ' + update.text);
  if (state.updates.length) {
    const plan = field('Care plan', 'textarea', state.plan?.text);
    const goal = field('Treatment goal', 'text', state.plan?.goal);
    const referral = field('Referral (optional)', 'text', state.plan?.referral);
    const warn = feedback();
    button('Send care plan', () => {
      if (!plan.value.trim() || !goal.value.trim()) return warn('Enter a care plan and a measurable goal.');
      record('Clinician sent a care plan', next => {
        next.plan = { text: plan.value.trim(), goal: goal.value.trim(), referral: referral.value.trim(), ack: false };
        next.updates.forEach(update => { update.reviewed = true; });
      });
    });
  }
  if (state.visit) button(state.visit.attended ? 'Attendance recorded' : 'Record attendance for ' + state.visit.date,
    () => record('Clinician recorded follow-up attendance', next => { next.visit.attended = true; }), !state.visit.attended);
}

let verifiedRx = '';
function pharmacy() {
  card('Prescription verification');
  if (!state.staff.Pharmacist) return line('Administrator approval is required for the demo pharmacist.');
  if (!state.rx) return line('No prescription is available.');
  if (verifiedRx !== state.rx.code) {
    line('Scan the patient’s QR with a reader that enters text, or paste the token.');
    const input = field('Prescription token');
    const warn = feedback();
    const verify = () => {
      if (normalizeCode(input.value) !== state.rx.code) return warn('Unknown prescription token.');
      verifiedRx = state.rx.code;
      render();
    };
    button('Verify prescription token', verify);
    input.onkeydown = event => { if (event.key === 'Enter') verify(); };
    return;
  }
  line('Verified in this demo record · ' + state.rx.med);
  card('Dispensing');
  line(state.rx.quantity + ' prescribed · ' + supplied() + ' supplied · ' + outstanding() + ' outstanding');
  for (const fill of state.fills) line(fill.quantity + ' supplied · ' + new Date(fill.at).toLocaleString());
  if (!outstanding()) return line('Prescription fully supplied.');
  const amount = field('Quantity supplied', 'number', String(Math.min(4, outstanding())));
  amount.min = amount.step = '1';
  amount.max = String(outstanding());
  const warn = feedback();
  button('Record partial or full fill', () => {
    const quantity = Number(amount.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > outstanding()) return warn('Enter a whole number from 1 to ' + outstanding() + '.');
    record('Pharmacy supplied ' + quantity + ' units', next => { next.fills.push({ quantity, at: new Date().toISOString() }); });
  });
}

function lab() {
  card('Laboratory order');
  if (!state.staff['Lab staff']) return line('Administrator approval is required for the demo lab.');
  if (!state.lab) return line('No order is available.');
  line(state.lab.test);
  if (!state.lab.consent) return line('Patient sharing consent is required before uploading.');
  line('Sharing consent granted. Upload a fictional UTF-8 text report, up to 8 KB.');
  const file = field('Synthetic text report', 'file');
  file.accept = '.txt,text/plain';
  const sample = element('a', 'Download a synthetic report to upload');
  sample.href = 'sample-report.txt';
  sample.download = 'sample-report.txt';
  const reason = state.reports.length ? field('Reason for correction') : null;
  const confirm = checkbox('This report contains synthetic data only');
  const warn = feedback();
  const submit = button(reason ? 'Submit corrected report' : 'Upload synthetic report', async () => {
    const chosen = file.files[0];
    const correction = reason?.value.trim() ?? '';
    if (!chosen || !/\.txt$/i.test(chosen.name) || chosen.size > 8192 || !confirm.checked || (reason && !correction)) {
      return warn('Choose a synthetic .txt file within 8 KB, confirm its origin and provide a reason for corrections.');
    }
    submit.disabled = true;
    try {
      const content = (await chosen.text()).trim();
      if (!content || content.includes('\0') || content.includes('\uFFFD')) {
        submit.disabled = false;
        return warn('Upload a nonempty UTF-8 text report.');
      }
      const version = state.reports.length + 1;
      record((version === 1 ? 'Lab uploaded' : 'Lab corrected') + ' report version ' + version, next => {
        next.reports.push({ version, content, filename: chosen.name, reason: correction, approved: false, released: false });
      });
    } catch {
      submit.disabled = false;
      warn('The report could not be read. Try the upload again.');
    }
  });
  for (const report of state.reports) line('Version ' + report.version + ' · ' + (report.released ? 'Released' : 'Awaiting clinician') + (report.reason ? ' · ' + report.reason : ''));
}

function admin() {
  card('Synthetic staff approvals');
  for (const role of ['Doctor', 'Pharmacist', 'Lab staff']) {
    button(state.staff[role] ? role + ' approved' : 'Approve ' + role,
      () => record('Administrator approved ' + role, next => { next.staff[role] = true; }), !state.staff[role]);
  }
  card('Proposed pilot');
  line('Eight weeks · 200 patients · two clinics · four doctors · two pharmacies · one laboratory');
  line('Targets · 80% follow-up completion and 25% lower documentation time');
}

function render() {
  const role = $('role').value;
  $('panel').replaceChildren();
  $('summary').replaceChildren();
  $('timeline').replaceChildren();
  for (const node of [$('summary'), $('role').parentElement, $('reset'), $('timeline').parentElement]) {
    if (node) node.hidden = caregiverView;
  }
  if (caregiverView) {
    if (!state.caregiver) { caregiverView = false; return render(); }
    $('panel').append($('caregiver').content.cloneNode(true));
    $('shared').textContent = [
      state.visit ? 'Follow-up · ' + state.visit.date + (state.visit.attended ? ' · Attended' : '') : 'No appointment booked.',
      state.plan ? 'Treatment goal · ' + state.plan.goal : 'No goal shared.'
    ].join('\n');
    $('return').onclick = () => { caregiverView = false; render(); };
    return;
  }
  for (const [label, value] of [
    ['Patient', state.patient?.name ?? 'Unregistered'],
    ['Clinic', state.checked ? 'Checked in' : 'Awaiting arrival'],
    ['Medication', state.rx ? outstanding() + ' outstanding' : 'Awaiting prescription']
  ]) {
    const metric = element('div', '', $('summary'));
    metric.className = 'metric';
    element('span', label, metric);
    element('strong', value, metric);
  }
  card(titles[role], 'h2');
  const announcement = line(status || 'Synthetic case RX-001');
  announcement.setAttribute('role', 'status');
  ({ Patient: patient, Doctor: doctor, Pharmacist: pharmacy, 'Lab staff': lab, Administrator: admin })[role]();
  const pending = [];
  if (outstanding()) pending.push(outstanding() + ' units outstanding');
  if (state.lab && !state.lab.consent) pending.push('Lab consent');
  if (latestReport() && !latestReport().released) pending.push('Report release');
  if (state.updates.some(update => !update.reviewed)) pending.push('Clinician response');
  if (state.plan && !state.plan.ack) pending.push('Patient acknowledgement');
  $('pending').textContent = pending.length ? pending.join(' · ') : 'No open handoffs';
  for (const event of state.events.toReversed()) {
    const item = element('li', event.message, $('timeline'));
    const time = element('time', event.role + ' · ' + new Date(event.at).toLocaleString(), item);
    time.dateTime = event.at;
  }
}

$('role').onchange = () => { verifiedRx = ''; status = ''; render(); };
$('reset').onclick = () => {
  if (!confirm('Reset all records for this fictional case?')) return;
  localStorage.removeItem(key);
  state = empty();
  verifiedRx = '';
  status = 'Demo reset';
  render();
};
window.addEventListener('storage', event => {
  if (event.key !== key && event.key !== null) return;
  state = read();
  verifiedRx = '';
  status = 'Case updated in another tab';
  render();
});
render();
