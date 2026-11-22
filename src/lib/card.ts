// Validación de la tarjeta en el navegador, antes de enviarla a Wompi (que la vuelve a validar).

// Luhn: descarta números mal escritos antes de enviarlos a Wompi.
export function validCardNumber(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2) n = n * 2 > 9 ? n * 2 - 9 : n * 2;
    sum += n;
  }
  return sum % 10 === 0;
}

// MM/AA vigente (la tarjeta vale hasta el último día de ese mes).
export function parseExpiry(raw: string, now = new Date()) {
  const m = raw.replace(/\s/g, "").match(/^(\d{2})\/?(\d{2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return null;
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) return null;
  return { month: m[1], year: m[2] };
}
