/** Windows-1255 bytes 0x80–0xFF → Unicode (for runtimes without TextDecoder label support). */
const CP1255 = "€\u0081‚ƒ„…†‡ˆ‰\u008a‹\u008c\u008d\u008e\u008f\u0090‘’“”•–—˜™\u009a›\u009c\u009d\u009e\u009f \u00a0¡¢£₪¥¦§¨©×«¬\u00ad®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹ\uFFFDֻּֽ־ֿ׀ׁׂ׃װױײ׳״\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFDאבגדהוזחטיךכלםמןנסעףפץצקרשת\uFFFD\uFFFD\u200e\u200f\uFFFD";

const HEADER_MARKERS = [
  'first_name',
  'last_name',
  'display_name',
  'email',
  'שם פרטי',
  'שם משפחה',
  'שם מלא',
  'שם',
  'אימייל',
] as const;

function stripUtf8Bom(bytes: Uint8Array): Uint8Array {
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return bytes.subarray(3);
  }
  return bytes;
}

export function csvHeaderLooksRecognized(text: string): boolean {
  const line = text.split(/\r?\n/)[0] ?? '';
  return HEADER_MARKERS.some((marker) => line.includes(marker));
}

function decodeWindows1255Manual(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    out += b < 0x80 ? String.fromCharCode(b) : CP1255[b - 0x80];
  }
  return out;
}

function tryTextDecoder(bytes: Uint8Array, label: string): string | null {
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    return null;
  }
}

/** Decode CSV bytes, preferring UTF-8 and falling back to Hebrew Windows exports (cp1255). */
export function decodeCsvBytes(bytes: ArrayBuffer): string {
  const u8 = stripUtf8Bom(new Uint8Array(bytes));

  const attempts: string[] = [new TextDecoder('utf-8').decode(u8)];

  const win1255 = tryTextDecoder(u8, 'windows-1255') ?? decodeWindows1255Manual(u8);
  attempts.push(win1255);

  const iso88598 = tryTextDecoder(u8, 'iso-8859-8');
  if (iso88598 && iso88598 !== win1255) attempts.push(iso88598);

  for (const text of attempts) {
    if (csvHeaderLooksRecognized(text)) return text;
  }

  return attempts[0];
}
