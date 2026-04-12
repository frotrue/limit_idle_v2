import Decimal from 'break_eternity.js';

export const equationCalc = (equation, x) => {
  let total = new Decimal(0);
  for (let i = 0; i < equation.length; i++) {
    if (equation[i].eq(0)) continue;
    total = total.plus(equation[i].times(Decimal.pow(x, i)));
  }
  return total;
};

export const differentiateEquation = (equation, x) => {
  const derivative = [];
  for (let i = 1; i < equation.length; i++) {
    derivative[i - 1] = equation[i].times(i);
  }
  while (derivative.length < equation.length) {
    derivative.push(new Decimal(0));
  }

  if (x !== undefined) return equationCalc(derivative, x);
  return derivative;
};

export const integrateEquationAt = (equation, x) => {
  let total = new Decimal(0);
  for (let i = 0; i < equation.length; i++) {
    if (equation[i].eq(0)) continue;
    total = total.plus(equation[i].div(i + 1).times(Decimal.pow(x, i + 1)));
  }
  return total;
};

