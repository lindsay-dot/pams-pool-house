// US units only. Everything in the model is stored in decimal feet.
export function ftIn(ft) {
  let inches = Math.round(ft * 12);
  const f = Math.floor(inches / 12);
  inches -= f * 12;
  return `${f}' ${inches}"`;
}
