import test from 'node:test';
import assert from 'node:assert/strict';
import Decimal from 'break_eternity.js';
import {
  equationCalc,
  differentiateEquation,
  integrateEquationAt
} from '../src/game/math/polynomial.js';

const d = (value) => new Decimal(value);

const assertDecimalEq = (actual, expected) => {
  assert.equal(new Decimal(actual).toString(), new Decimal(expected).toString());
};

test('equationCalc evaluates polynomial coefficients at x', () => {
  // 1 + 2x + 3x^2 at x = 2 => 17
  const result = equationCalc([d(1), d(2), d(3)], d(2));
  assertDecimalEq(result, 17);
});

test('differentiateEquation returns derivative coefficients', () => {
  // d/dx (1 + 2x + 3x^2) => 2 + 6x
  const result = differentiateEquation([d(1), d(2), d(3)]);

  assert.equal(result.length, 3);
  assertDecimalEq(result[0], 2);
  assertDecimalEq(result[1], 6);
  assertDecimalEq(result[2], 0);
});

test('differentiateEquation can evaluate the derivative at x', () => {
  // 2 + 6x at x = 2 => 14
  const result = differentiateEquation([d(1), d(2), d(3)], d(2));
  assertDecimalEq(result, 14);
});

test('integrateEquationAt evaluates the antiderivative with C = 0', () => {
  // ∫(1 + 2x + 3x^2)dx from 0 to x = x + x^2 + x^3
  // at x = 2 => 2 + 4 + 8 = 14
  const result = integrateEquationAt([d(1), d(2), d(3)], d(2));
  assertDecimalEq(result, 14);
});

test('polynomial helpers skip zero coefficients safely', () => {
  const result = equationCalc([d(0), d(0), d(5)], d(3));
  assertDecimalEq(result, 45);
});
