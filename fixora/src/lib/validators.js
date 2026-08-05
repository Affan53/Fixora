// Verhoeff checksum algorithm — this is the actual check-digit algorithm
// UIDAI uses for Aadhaar numbers. It confirms a number is *structurally*
// valid (correctly formed, not a typo/random digits) but cannot confirm it
// belongs to a real registered person — that requires UIDAI's restricted
// Aadhaar verification API, which isn't openly available to developers and
// needs government/licensed-entity approval to access.

const d = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const p = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function isValidAadhaarChecksum(number) {
  const digits = String(number).replace(/\D/g, "");
  if (digits.length !== 12) return false;
  // Aadhaar numbers never start with 0 or 1
  if (/^[01]/.test(digits)) return false;

  let c = 0;
  const reversed = digits.split("").reverse().map(Number);
  reversed.forEach((digit, i) => {
    c = d[c][p[i % 8][digit]];
  });
  return c === 0;
}

export function isValidPanFormat(pan) {
  // Real, official PAN structure: 5 letters, 4 digits, 1 letter.
  // The 4th letter also encodes holder type (P=individual, C=company, etc.)
  // but we only enforce the structural rule here.
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}
