import type { CredentialType, KeyAlgorithm } from './kms-types.interface';
import { KmsSignerService } from './kms-signer-service.interface';
import type { KeyManagerName } from './kms-types.interface';
import type { Signer } from './signers/signer.interface';
import { Client, Transaction as HederaTransaction } from '@hashgraph/sdk';
import { SupportedNetwork } from '../../types/shared.types';

export interface KmsService {
  /**
   * Creates a new private key using specified KeyManager.
   *
   * @param keyManager - KeyManager to use ('local' or 'localEncrypted')
   * @param labels - Optional labels for the key
   * @returns keyRefId and publicKey
   */
  createLocalPrivateKey(
    keyType: KeyAlgorithm,
    keyManager?: KeyManagerName,
    labels?: string[],
  ): {
    keyRefId: string;
    publicKey: string;
  };

  /**
   * Imports an existing private key using specified KeyManager.
   *
   * @param privateKey - Private key string to import
   * @param keyManager - KeyManager to use ('local' or 'localEncrypted')
   * @param labels - Optional labels for the key
   * @returns keyRefId and publicKey
   */
  importPrivateKey(
    keyType: KeyAlgorithm,
    privateKey: string,
    keyManager?: KeyManagerName,
    labels?: string[],
  ): { keyRefId: string; publicKey: string };

  /**
   * Gets public key for a keyRefId.
   */
  getPublicKey(keyRefId: string): string | null;

  getSignerHandle(keyRefId: string): KmsSignerService;

  /**
   * Gets a signer handle for signing transactions.
   */
  getSignerHandle(keyRefId: string): Signer;

  /**
   * Finds keyRefId by public key.
   */
  findByPublicKey(publicKey: string): string | null;

  /**
   * Lists all credential records.
   */
  list(): Array<{
    keyRefId: string;
    keyManager: KeyManagerName;
    publicKey: string;
    labels?: string[];
  }>;

  /**
   * Removes a credential (both metadata and secret).
   */
  remove(keyRefId: string): void;

  /**
   * Creates a Hedera client with operator credentials.
   */
  createClient(network: SupportedNetwork): Client;

  /**
   * Signs a transaction with specified key.
   */
  signTransaction(
    transaction: HederaTransaction,
    keyRefId: string,
  ): Promise<void>;
}
