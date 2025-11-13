import { parseKeyWithType } from '../parse-key-type';

describe('parseKeyWithType', () => {
  test('parses key without prefix and defaults to ecdsa', () => {
    const result = parseKeyWithType('302e020100300506032b657004220420abc123');
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('parses key with ecdsa prefix', () => {
    const result = parseKeyWithType(
      'ecdsa:302e020100300506032b657004220420abc123',
    );
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('parses key with ECDSA prefix (uppercase)', () => {
    const result = parseKeyWithType(
      'ECDSA:302e020100300506032b657004220420abc123',
    );
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('parses key with ed25519 prefix', () => {
    const result = parseKeyWithType(
      'ed25519:302e020100300506032b657004220420abc123',
    );
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('parses key with ED25519 prefix (uppercase)', () => {
    const result = parseKeyWithType(
      'ED25519:302e020100300506032b657004220420abc123',
    );
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('parses key with mixed case prefix', () => {
    const result = parseKeyWithType(
      'Ed25519:302e020100300506032b657004220420abc123',
    );
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe('302e020100300506032b657004220420abc123');
  });

  test('handles key with colon in the key part', () => {
    const result = parseKeyWithType('ecdsa:key:with:colons');
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe('key:with:colons');
  });

  test('throws error for empty key string', () => {
    expect(() => parseKeyWithType('')).toThrow('Private key cannot be empty');
  });

  test('throws error for key with only prefix', () => {
    expect(() => parseKeyWithType('ecdsa:')).toThrow(
      "Private key cannot be empty. Key type prefix 'ecdsa' provided but no key follows.",
    );
    expect(() => parseKeyWithType('ed25519:')).toThrow(
      "Private key cannot be empty. Key type prefix 'ed25519' provided but no key follows.",
    );
  });
});
