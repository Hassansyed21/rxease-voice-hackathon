# Safety and privacy

Use fictional data only. DemoMed, the sensitivity flag and report content are simulated. The workspace provides no clinical advice or verified credentials.

The app stores the fictional case in this browser's local storage. Demo role switches and the caregiver preview demonstrate workflow visibility. They provide no authentication or server-side access control. A prescription QR encodes an opaque identifier and a P-256 digital signature covering the demo medication and dose calculation. The pharmacist verifies it against the public key and prescription held in the same browser; the signing key is discarded after issue. This trust model is browser-local and supplies no real clinician identity, legal signature, or cross-device verification. A legacy prescription issued before signing was added remains usable via its original token and is labeled accordingly. A check-in QR contains an opaque local token. Reset demo clears this origin's case.

RxEase provides editable fields for typing or dictation from the installed Wispr Flow client. RxEase does not call a Wispr API or perform speech recognition. The built-in example inserts labeled simulated text. Installed dictation software may process speech externally. The examples are simulated, including Kannada, Hindi, English and mixed-language text. Speech recognition quality and regional accents require testing with the installed client. Text is stored as entered and the quantity prompt flags selected ambiguous patterns for manual review.

Report an issue in this hackathon repository with fictional examples only.
