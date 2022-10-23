/**
 * Converts string inputs to array buffers and compares the values using the crypto API
 * @param a
 * @param b
 */
export const compare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false

  const leftBuff = stringToArrayBuffer(a)
  const rightBuff = stringToArrayBuffer(b)

  return crypto.subtle.timingSafeEqual(leftBuff, rightBuff)
}


const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);

  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
