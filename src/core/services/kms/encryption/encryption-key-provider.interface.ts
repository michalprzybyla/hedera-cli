/**
 * EncryptionKeyProvider manages the lifecycle of encryption keys.
 *
 * This abstraction allows different key storage strategies:
 * - LocalFileKeyProvider: Auto-generated key in .hedera-cli/.secret (current)
 * - Future: PasswordBasedKeyProvider, KeychainKeyProvider, HSM, etc.
 */
export interface EncryptionKeyProvider {
  /**
   * Gets the encryption key, generating and storing it if it doesn't exist.
   *
   * @returns Encryption key as Buffer
   */
  getOrCreateKey(): Buffer;

  /**
   * Gets the encryption key if it exists, throws an error otherwise.
   *
   * @returns Encryption key as Buffer
   * @throws Error if the encryption key does not exist
   */
  getOrThrow(): Buffer;
}
