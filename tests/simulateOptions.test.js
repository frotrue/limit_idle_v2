import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateExpectations,
  parseDuration,
  parseSimTime
} from '../scripts/simulate.js';

test('parseSimTime accepts seconds, minutes, hours, and milliseconds', () => {
  assert.equal(parseSimTime('30'), 30);
  assert.equal(parseSimTime('45s'), 45);
  assert.equal(parseSimTime('2m'), 120);
  assert.equal(parseSimTime('1.5h'), 5400);
  assert.equal(parseSimTime('500ms'), 0.5);
});

test('parseDuration supports json and repeated milestone expectations', () => {
  const options = parseDuration([
    '--hours=1',
    '--json',
    '--expect=firstDifferentiation:15m:25m',
    '--expect=firstResearch:40m:55m'
  ]);

  assert.equal(options.totalMs, 3600000);
  assert.equal(options.json, true);
  assert.equal(options.progress, false);
  assert.equal(options.expectations.length, 2);
  assert.deepEqual(options.expectations[0], {
    key: 'firstDifferentiation',
    minSeconds: 900,
    maxSeconds: 1500
  });
});

test('evaluateExpectations reports pass, fail, and missing milestones', () => {
  const results = evaluateExpectations([
    { key: 'firstDifferentiation', minSeconds: 900, maxSeconds: 1500 },
    { key: 'firstExp', minSeconds: 1000, maxSeconds: 1200 },
    { key: 'firstResearch', minSeconds: 2400, maxSeconds: 3300 }
  ], {
    firstDifferentiation: 1074,
    firstExp: 1300
  });

  assert.equal(results[0].passed, true);
  assert.equal(results[1].passed, false);
  assert.equal(results[2].passed, false);
  assert.equal(results[2].actualSeconds, null);
});
