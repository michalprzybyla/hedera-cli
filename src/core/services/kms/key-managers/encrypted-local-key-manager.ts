import type { StateService } from '../../state/state-service.interface';
import type { KeyManager } from './key-manager.interface';
import type { Signer } from '../signers/signer.interface';
import type { KeyAlgorithm, KmsCredentialSecret } from '../kms-types.interface';
import type { EncryptionService } from '../encryption/encryption-service.interface';
import { EncryptedSecretStorage } from '../storage/encrypted-secret-storage';
import { PrivateKeySigner } from '../signers/private-key-signer';
import { PrivateKey } from '@hashgraph/sdk';

/**
 * KeyManager for encrypted local storage.
 * Encryption is handled by EncryptedSecretStorage.
 */
export class EncryptedLocalKeyManager implements KeyManager {
  private readonly secretStorage: EncryptedSecretStorage;

  constructor(state: StateService, encryptionService: EncryptionService) {
    this.secretStorage = new EncryptedSecretStorage(state, encryptionService);
  }

  generateKey(algorithm: KeyAlgorithm): {
    publicKey: string;
    secret: KmsCredentialSecret;
  } {
    const privateKey =
      algorithm === 'ecdsa'
        ? PrivateKey.generateECDSA()
        : PrivateKey.generateED25519();

    const publicKey = privateKey.publicKey.toStringRaw();

    const secret: KmsCredentialSecret = {
      keyAlgorithm: algorithm,
      privateKey: privateKey.toStringRaw(),
      createdAt: new Date().toISOString(),
    };

    return { publicKey, secret };
  }

  saveSecret(keyRefId: string, secret: KmsCredentialSecret): void {
    // Encryption happens inside EncryptedSecretStorage.write()
    this.secretStorage.write(keyRefId, secret);
  }

  readSecret(keyRefId: string): KmsCredentialSecret | null {
    // Decryption happens inside EncryptedSecretStorage.read()
    return this.secretStorage.read(keyRefId);
  }

  createSigner(
    keyRefId: string,
    publicKey: string,
    algorithm: KeyAlgorithm,
  ): Signer {
    const secret = this.readSecret(keyRefId); // Already decrypted
    if (!secret) {
      throw new Error(`Secret not found for keyRefId: ${keyRefId}`);
    }

    return new PrivateKeySigner(publicKey, secret, algorithm);
  }

  removeSecret(keyRefId: string): void {
    this.secretStorage.remove(keyRefId);
  }
}
