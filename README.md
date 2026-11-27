# RxEase Voice

RxEase follows one fictional patient across clinic check-in, consultation, pharmacy dispensing, lab reporting and follow-up. It is a Scaler × Wispr Flow Hackathon 2026 demo.

## Run

Run `docker compose up --build` and open http://localhost:8080. For a buildless preview, run `python -m http.server 3000 --directory web`. No secrets or service accounts are required to run the app.

## Walk the case

1. Register Asha Demo as the patient, enter the displayed verification code and grant demo care consent. Copy the check-in QR token.
2. As administrator, approve each synthetic staff role. Switch to Doctor and verify the check-in token.
3. Focus the consultation field and use your installed Wispr Flow shortcut, type, or load the labeled simulated text. Fill the structured fields, confirm the text and approve the note.
4. Keep the demo prescription defaults to calculate 12 units. Review the simulated sensitivity alert and approve the fictional prescription. Order the synthetic lab test.
5. As patient, copy the prescription QR token and grant lab sharing consent. As pharmacist, verify the token and record 4 supplied to leave 8 outstanding.
6. As lab staff, download and upload the fictional sample report. As doctor, approve and release it. Lab staff can submit a corrected version with a reason. The previous version stays visible to the patient until the correction is released.
7. As patient, submit a consented follow-up. As doctor, respond with a care plan, measurable goal and optional referral. Acknowledge the plan or request clarification as patient.
8. Book or reschedule a follow-up, record attendance as doctor, and optionally open the limited caregiver view as patient.

## Verify and deploy

`npm ci`, `npx playwright install chromium`, then `npm test`. Keep the local app running first. Set `RXEASE_URL` to test another origin and `CHROMIUM_PATH` to use a system Chromium.

The Cloudflare deployment uses the asset directory in `wrangler.jsonc`. Deploy the existing Worker with `npx wrangler deploy` using authorized Cloudflare access. The target domain is [rxease.store](https://rxease.store).

See [Safety and privacy](SECURITY.md) for demo boundaries.

## Proposed pilot

Eight weeks, 200 patients, two clinics, four doctors, two pharmacies and one laboratory. The targets are 80% follow-up completion and a 25% reduction in documentation time.

## Submission materials

- [Pitch deck](submission/RxEase-Pitch.pdf)
- [Demo recording](submission/RxEase-Demo.mp4)
