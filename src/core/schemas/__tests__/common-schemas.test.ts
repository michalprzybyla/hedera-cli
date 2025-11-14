import { AccountIdKeyPairSchema } from '../common-schemas';

describe('AccountIdKeyPairSchema', () => {
  // Sample data for tests
  const accountId = '0.0.123456';
  // DER format (starts with 30, at least 100 hex characters)
  const derKey =
    '302e020100300506032b6570042204204cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a03039784cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';
  // Hex format (64 hex characters)
  const hexKey =
    '4cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a03039784cd05bfda79692efc30a8011e81b48da825a3a5eedcbdf73c3f6e341a0303978';
  // 0xHex format (0x followed by 64 hex characters)
  const hexKeyWith0x = `0x${hexKey}`;
  const derKeyWith0x = `0x${derKey}`;

  describe('no prefix (default)', () => {
    test('validates DER format key', () => {
      const input = `${accountId}:${derKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates hex format key', () => {
      const input = `${accountId}:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x hex format key', () => {
      const input = `${accountId}:${hexKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x DER format key', () => {
      const input = `${accountId}:${derKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('ed25519 prefix', () => {
    test('validates DER format key', () => {
      const input = `${accountId}:ed25519:${derKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates hex format key', () => {
      const input = `${accountId}:ed25519:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x hex format key', () => {
      const input = `${accountId}:ed25519:${hexKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x DER format key', () => {
      const input = `${accountId}:ed25519:${derKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates uppercase ED25519 prefix', () => {
      const input = `${accountId}:ED25519:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates mixed case Ed25519 prefix', () => {
      const input = `${accountId}:Ed25519:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('ecdsa prefix', () => {
    test('validates DER format key', () => {
      const input = `${accountId}:ecdsa:${derKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates hex format key', () => {
      const input = `${accountId}:ecdsa:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x hex format key', () => {
      const input = `${accountId}:ecdsa:${hexKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates 0x DER format key', () => {
      const input = `${accountId}:ecdsa:${derKeyWith0x}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates uppercase ECDSA prefix', () => {
      const input = `${accountId}:ECDSA:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });

    test('validates mixed case Ecdsa prefix', () => {
      const input = `${accountId}:Ecdsa:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).not.toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(true);
    });
  });

  describe('invalid formats', () => {
    test('rejects account ID starting with 0', () => {
      const input = `0.0.0:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects invalid account ID format', () => {
      const input = `123.456.789:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects key that is too short (hex)', () => {
      const shortKey = 'abc123';
      const input = `${accountId}:${shortKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects DER key that is too short', () => {
      const shortDerKey = '302e02010030050603';
      const input = `${accountId}:${shortDerKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects invalid key type prefix', () => {
      const input = `${accountId}:rsa:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects key with invalid hex characters', () => {
      const invalidKey = `${hexKey.slice(0, 60)}xyz4`;
      const input = `${accountId}:${invalidKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects missing key part', () => {
      const input = `${accountId}:`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });

    test('rejects missing account ID', () => {
      const input = `:${hexKey}`;
      expect(() => AccountIdKeyPairSchema.parse(input)).toThrow();
      expect(AccountIdKeyPairSchema.safeParse(input).success).toBe(false);
    });
  });
});
