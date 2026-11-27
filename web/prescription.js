const curve = { name: 'ECDSA', namedCurve: 'P-256' };
const algorithm = { name: 'ECDSA', hash: 'SHA-256' };

function payload(rx) {
  return new TextEncoder().encode(JSON.stringify([
    'rxease-demo-v1', rx.code, rx.med, rx.quantity, rx.perDose, rx.frequency, rx.days
  ]));
}

export async function signPrescription(rx) {
  const keys = await crypto.subtle.generateKey(curve, false, ['sign', 'verify']);
  const signature = await crypto.subtle.sign(algorithm, keys.privateKey, payload(rx));
  return {
    ...rx,
    publicKey: await crypto.subtle.exportKey('jwk', keys.publicKey),
    signature: btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
  };
}

export function prescriptionToken(rx) {
  return rx.signature ? rx.code + '.' + rx.signature : rx.code;
}

export async function verifyPrescription(rx, token) {
  const [code, signature, ...extra] = token.trim().split('.');
  if (code.toUpperCase() !== rx.code || extra.length) return false;
  if (!rx.signature) return signature === undefined;
  if (!signature || !/^[A-Za-z0-9_-]{86}$/.test(signature)) return false;
  const bytes = Uint8Array.from(atob(signature.replaceAll('-', '+').replaceAll('_', '/')),
    character => character.charCodeAt(0));
  const key = await crypto.subtle.importKey('jwk', rx.publicKey, curve, false, ['verify']);
  return crypto.subtle.verify(algorithm, key, bytes, payload(rx));
}
