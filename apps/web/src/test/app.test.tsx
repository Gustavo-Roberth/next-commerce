import { describe, expect, it } from 'vitest';

describe('App', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should test string concatenation', () => {
    expect('hello ' + 'world').toBe('hello world');
  });
});
