import type { StateService } from '../../state/state-service.interface';
import type { KeyManager } from './key-manager.interface';
import type { Signer } from '../signers/signer.interface';
import type { KeyAlgorithm, KmsCredentialSecret } from '../kms-types.interface';
import { LocalSecretStorage } from '../storage/local-secret-storage';
import { PrivateKeySigner } from '../signers/private-key-signer';
import { PrivateKey } from '@hashgraph/sdk';

/**
 * KeyManager for plaintext local storage.
 * Stores secrets without encryption.
 */
export class LocalKeyManager implements KeyManager {
  private readonly secretStorage: LocalSecretStorage;

  constructor(state: StateService) {
    this.secretStorage = new LocalSecretStorage(state);
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
    this.secretStorage.write(keyRefId, secret);
  }

  readSecret(keyRefId: string): KmsCredentialSecret | null {
    return this.secretStorage.read(keyRefId);
  }

  createSigner(
    keyRefId: string,
    publicKey: string,
    algorithm: KeyAlgorithm,
  ): Signer {
    const secret = this.readSecret(keyRefId);
    if (!secret) {
      throw new Error(`Secret not found for keyRefId: ${keyRefId}`);
    }

    return new PrivateKeySigner(publicKey, secret, algorithm);
  }

  removeSecret(keyRefId: string): void {
    this.secretStorage.remove(keyRefId);
  }
}
