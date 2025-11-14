import type { EncryptionService } from './encryption-service.interface';
import type { EncryptionKeyProvider } from './encryption-key-provider.interface';
import * as crypto from 'crypto';

/**
 * AES-256-GCM encryption implementation.
 *
 * Algorithm details:
 * - AES-256-GCM (Galois/Counter Mode)
 * - 256-bit key (from EncryptionKeyProvider)
 * - Random 128-bit IV per encryption
 * - Authenticated encryption (integrity + confidentiality)
 *
 * Output format: `iv:authTag:ciphertext` (all hex-encoded)
 */
export class EncryptionServiceImpl implements EncryptionService {
  private readonly algorithm = 'aes-256-gcm';

  constructor(private readonly keyProvider: EncryptionKeyProvider) {}

  encrypt(plaintext: string): string {
    try {
      const key = this.keyProvider.getOrCreateKey();
      const iv = crypto.randomBytes(16); // 128-bit IV

      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Format: iv:authTag:ciphertext (all hex)
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  decrypt(ciphertext: string): string {
    try {
      const parts = ciphertext.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid ciphertext format (expected iv:authTag:data)');
      }

      const [ivHex, authTagHex, encrypted] = parts;
      const key = this.keyProvider.getOrCreateKey();

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(ivHex, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
