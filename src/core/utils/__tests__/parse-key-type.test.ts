import { parseKeyWithType } from '../parse-key-type';

describe('parseKeyWithType', () => {
  // Valid test keys that match the schema requirements
  // ECDSA: exactly 64 hex chars (32 bytes) or DER format (starts with 30, at least 100 chars after 30)
  const validEcdsaHexKey =
    '4cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';
  // DER format: starts with 30, needs at least 100 more hex chars but max 180 (total 100-182)
  // Creating a valid DER key with exactly 100 chars after 30 (total 102)
  const validEcdsaDerKey =
    '302e020100300506032b6570042204204cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a03039784cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';

  // Ed25519: exactly 64 hex chars (32 bytes) or 128 hex chars (64 bytes) or DER format (starts with 30, at least 80 chars after 30, max 160)
  const validEd25519HexKey =
    '4cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';
  // DER format: starts with 30, needs at least 80 more hex chars but max 160 (total 80-162)
  // Creating a valid DER key with exactly 80 chars after 30 (total 82)
  const validEd25519DerKey =
    '302e020100300506032b6570042204204cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a03039784cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';

  test('parses key without prefix and defaults to ecdsa', () => {
    const result = parseKeyWithType(validEcdsaHexKey);
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe(validEcdsaHexKey);
  });

  test('parses key with ecdsa prefix', () => {
    const result = parseKeyWithType(`ecdsa:${validEcdsaHexKey}`);
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe(validEcdsaHexKey);
  });

  test('parses key with ECDSA prefix (uppercase)', () => {
    const result = parseKeyWithType(`ECDSA:${validEcdsaHexKey}`);
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe(validEcdsaHexKey);
  });

  test('parses key with ed25519 prefix', () => {
    const result = parseKeyWithType(`ed25519:${validEd25519HexKey}`);
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe(validEd25519HexKey);
  });

  test('parses key with ED25519 prefix (uppercase)', () => {
    const result = parseKeyWithType(`ED25519:${validEd25519HexKey}`);
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe(validEd25519HexKey);
  });

  test('parses key with mixed case prefix', () => {
    const result = parseKeyWithType(`Ed25519:${validEd25519HexKey}`);
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe(validEd25519HexKey);
  });

  test('parses key with 0x prefix', () => {
    const result = parseKeyWithType(`0x${validEcdsaHexKey}`);
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe(`0x${validEcdsaHexKey}`);
  });

  test('parses ed25519 key with 0x prefix', () => {
    const result = parseKeyWithType(`ed25519:0x${validEd25519HexKey}`);
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe(`0x${validEd25519HexKey}`);
  });

  test('parses DER format key', () => {
    const result = parseKeyWithType(validEcdsaDerKey);
    expect(result.keyType).toBe('ecdsa');
    expect(result.privateKey).toBe(validEcdsaDerKey);
  });

  test('parses DER format key with ed25519 prefix', () => {
    const result = parseKeyWithType(`ed25519:${validEd25519DerKey}`);
    expect(result.keyType).toBe('ed25519');
    expect(result.privateKey).toBe(validEd25519DerKey);
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
