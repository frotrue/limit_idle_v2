import Decimal from 'break_eternity.js';

export const SUPERSCRIPT_MAP = {
  0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴',
  5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' ,9: '⁹',
};

export const format = (num) => {
  const d = new Decimal(num);
  if (d.lt(1000)) return d.toNumber() % 1 === 0 ? d.toNumber() : d.toNumber().toFixed(2);
  return d.toExponential(2).replace(/\+/g, '');
};
