import assert from 'assert';
import { describe, it } from 'mocha';
import { isAnswerAcceptable } from '../src/services/gemini/answerMatching';

describe('answerMatching numeric handling', () => {
  it('accepts decimal answers with different precision', () => {
    const acceptable = ['0.25'];
    const canonical = '0.25';
    assert.ok(isAnswerAcceptable('0.25', acceptable, canonical));
    assert.ok(isAnswerAcceptable('0.2500', acceptable, canonical));
    assert.ok(isAnswerAcceptable('.25', acceptable, canonical));
    assert.ok(isAnswerAcceptable('0.2500001', acceptable, canonical));
    assert.ok(!isAnswerAcceptable('0.26', acceptable, canonical));
  });

  it('accepts fractions and spoken numbers for the same canonical value', () => {
    const acceptable = ['0.25'];
    const canonical = '0.25';
    assert.ok(isAnswerAcceptable('1/4', acceptable, canonical));
    assert.ok(isAnswerAcceptable('one fourth', acceptable, canonical));
    assert.ok(isAnswerAcceptable('a quarter', acceptable, canonical));
    assert.ok(isAnswerAcceptable('point two five', acceptable, canonical));
    assert.ok(!isAnswerAcceptable('point three', acceptable, canonical));
  });

  it('accepts mixed number representations', () => {
    const acceptable = ['1.25'];
    const canonical = '1.25';
    assert.ok(isAnswerAcceptable('1 1/4', acceptable, canonical));
    assert.ok(isAnswerAcceptable('one and one quarter', acceptable, canonical));
    assert.ok(!isAnswerAcceptable('1 1/3', acceptable, canonical));
  });

  it('accepts percentages, fractions, and decimals within tolerance', () => {
    const acceptable = ['33.33%'];
    const canonical = '33.33%';
    assert.ok(isAnswerAcceptable('33.33%', acceptable, canonical));
    assert.ok(isAnswerAcceptable('0.3333', acceptable, canonical));
    assert.ok(isAnswerAcceptable('one third', acceptable, canonical));
    assert.ok(!isAnswerAcceptable('0.32', acceptable, canonical));
  });

  it('accepts scientific notation equivalents', () => {
    const acceptable = ['0.3687'];
    const canonical = '0.3687';
    assert.ok(isAnswerAcceptable('3.687e-1', acceptable, canonical));
    assert.ok(isAnswerAcceptable('3.687 × 10^-1', acceptable, canonical));
    assert.ok(!isAnswerAcceptable('3.6e-1', acceptable, canonical));
  });

  it('keeps textual matching behaviour for non-numeric answers', () => {
    const acceptable = ['Mount Everest', 'Everest'];
    assert.ok(isAnswerAcceptable('Mount Everest', acceptable));
    assert.ok(isAnswerAcceptable('Everest', acceptable));
    assert.ok(!isAnswerAcceptable('K2', acceptable));
  });
});
