# RxEase Voice

RxEase is a voice-first demo for small clinics in India. It follows one fictional patient across clinic check-in, consultation, pharmacy dispensing, lab reporting and follow-up. It is a Scaler × Wispr Flow Hackathon 2026 demo.

## Run

Run `docker compose up --build` and open http://localhost:8080. For a buildless preview, run `python -m http.server 3000 --directory web`. No secrets or service accounts are required to run the app.

## Review in a browser

Open [rxease.store](https://rxease.store) and register the sample patient. For the consultation and follow-up, give consent, open **Try a simulated example**, and load the transcript. Review it before approving or sending. Reviewers can also type. If Wispr Flow is installed on the device being used, focus the field and use the device’s Wispr Flow shortcut. The site requires no Wispr Flow installation, API key, or account to complete the demo.

## Walk the case

1. Register Asha Demo as the patient, enter the displayed verification code and grant demo care consent. Copy the check-in QR token.
2. As administrator, approve each synthetic staff role. Switch to Doctor and verify the check-in token.
3. Focus the consultation field and use your installed Wispr Flow shortcut, type, or load the labeled simulated text. Pilot examples include Kannada, Hindi, English and mixed-language text. Review highlighted terms and correct the transcript. Draft or edit the reason, observations and next steps, then confirm and approve the note.
4. Keep the demo prescription defaults to calculate 12 units. Review the simulated sensitivity alert and issue the signed fictional prescription. Order the synthetic lab test.
5. As patient, copy the prescription QR token and grant lab sharing consent. As pharmacist, verify the QR signature and record 4 supplied to leave 8 outstanding.
6. As lab staff, download and upload the fictional sample report. As doctor, approve and release it. Lab staff can submit a corrected version with a reason. Compare reviewed versions by accession. The previous version stays visible to the patient until the correction is released.
7. As patient, submit a consented follow-up. As doctor, respond with a care plan, measurable goal and optional referral. Acknowledge the plan, approve the referral, or request clarification as patient.
8. When the clinician advises a visit, book or reschedule it, record attendance as doctor, and optionally open the limited caregiver view as patient.

## Verify and deploy

`npm ci`, `npx playwright install chromium`, then `npm test`. Keep the local app running first. Set `RXEASE_URL` to test another origin and `CHROMIUM_PATH` to use a system Chromium.

The Cloudflare deployment uses the asset directory in `wrangler.jsonc`. Deploy the existing Worker with `npx wrangler deploy` using authorized Cloudflare access. The target domain is [rxease.store](https://rxease.store).

See [Safety and privacy](SECURITY.md) for demo boundaries and the [launch audit](LAUNCH-AUDIT.md) for the verification checklist and owner setup.

## Proposed pilot

Eight weeks, approximately 200 adult patients, two clinics, four doctors, two pharmacies and one laboratory. The initial focus is Kannada- and Hindi-speaking patients who prefer to describe a concern aloud.

The primary target is at least 80% closure of eligible routine follow-ups within 14 days, with clinician review, a documented next step, and patient acknowledgement or recorded successful contact. The secondary target is a 25% reduction in median consultation documentation time against the clinics’ existing workflow. Track unresolved partial fills, time to clinician report review and how often dictation corrections require assistance.

## Submission materials

- [Pitch deck](submission/RxEase-Pitch.pdf)
- [Demo recording](submission/RxEase-Demo.mp4) uses real application footage and generated adult male Indian English narration. [Voice model](https://huggingface.co/prasadvittaldev/pocket-tts-indian-english-male-indictts)
