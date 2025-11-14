import type { KmsService } from './kms-service.interface';
import type {
  KmsCredentialRecord,
  KeyAlgorithm,
  KeyManagerName,
} from './kms-types.interface';
import { KEY_MANAGERS } from './kms-types.interface';
import type { SupportedNetwork } from '../../types/shared.types';
import { randomBytes } from 'crypto';
import {
  PrivateKey,
  Client,
  PublicKey,
  AccountId,
  Transaction as HederaTransaction,
} from '@hashgraph/sdk';
import type { Signer } from './signers/signer.interface';
import type { Logger } from '../logger/logger-service.interface';
import type { StateService } from '../state/state-service.interface';
import type { NetworkService } from '../network/network-service.interface';
import type { KeyManager } from './key-managers/key-manager.interface';
import { CredentialStorage } from './storage/credential-storage';
import { LocalKeyManager } from './key-managers/local-key-manager';
import { EncryptedLocalKeyManager } from './key-managers/encrypted-local-key-manager';
import { EncryptionServiceImpl } from './encryption/encryption-service-impl';
import { LocalFileKeyProvider } from './encryption/local-file-key-provider';

/**
 * @TODO: Consider reorganizing KMS folder structure
 *
 * Currently, the KMS folder contains more files than typical service folders
 * (which usually have just interface + implementation). This was discussed
 * during review and we decided not to change it now, but we should consider
 * better organization in the future.
 *
 */

export class KmsServiceImpl implements KmsService {
  private readonly logger: Logger;
  private readonly credentialStorage: CredentialStorage;
  private readonly networkService: NetworkService;
  private readonly keyManagers: Map<KeyManagerName, KeyManager>;

  constructor(
    logger: Logger,
    state: StateService,
    networkService: NetworkService,
  ) {
    this.logger = logger;
    this.networkService = networkService;

    // Initialize metadata storage
    this.credentialStorage = new CredentialStorage(state);

    // Initialize encryption dependencies for localEncrypted key manager
    const keyProvider = new LocalFileKeyProvider();
    const encryptionService = new EncryptionServiceImpl(keyProvider);

    // Initialize KeyManagers (each creates its own SecretStorage internally)
    this.keyManagers = new Map<KeyManagerName, KeyManager>([
      [KEY_MANAGERS.local, new LocalKeyManager(state)],
      [
        KEY_MANAGERS.localEncrypted,
        new EncryptedLocalKeyManager(state, encryptionService),
      ],
    ]);
  }

  createLocalPrivateKey(
    keyManager: KeyManagerName = KEY_MANAGERS.local,
    labels?: string[],
  ): {
    keyRefId: string;
    publicKey: string;
  } {
    const keyRefId = this.generateId('kr');
    const manager = this.getKeyManager(keyManager);

    // 1. Generate key using the specified manager
    const { publicKey, secret } = manager.generateKey('ecdsa');

    // 2. Save secret using manager-specific storage strategy
    manager.saveSecret(keyRefId, secret);

    // 3. Save metadata record
    this.saveRecord({
      keyRefId,
      keyManager, // Track which manager owns this key
      publicKey,
      labels,
      keyAlgorithm: 'ecdsa',
      createdAt: new Date().toISOString(),
    });

    return { keyRefId, publicKey };
  }

  importPrivateKey(
    privateKey: string,
    keyManager: KeyManagerName = KEY_MANAGERS.local,
    labels?: string[],
  ): { keyRefId: string; publicKey: string } {
    const keyRefId = this.generateId('kr');

    // Determine algorithm from key format
    // TODO: Try to parse either ED25519 or ECDSA
    const pk: PrivateKey = PrivateKey.fromStringECDSA(privateKey);
    const algorithm: KeyAlgorithm = 'ecdsa';
    const publicKey = pk.publicKey.toStringRaw();

    // Check if key already exists
    const existingKeyRefId = this.findByPublicKey(publicKey);
    if (existingKeyRefId) {
      this.logger.debug(
        `[CRED] Passed key already exists, keyRefId: ${existingKeyRefId}`,
      );
      return { keyRefId: existingKeyRefId, publicKey };
    }

    const manager = this.getKeyManager(keyManager);

    // Create secret object
    const secret = {
      keyAlgorithm: algorithm,
      privateKey,
      createdAt: new Date().toISOString(),
    };

    // Save using specified manager
    manager.saveSecret(keyRefId, secret);

    // Save metadata
    this.saveRecord({
      keyRefId,
      keyManager,
      publicKey,
      labels,
      keyAlgorithm: algorithm,
      createdAt: new Date().toISOString(),
    });

    return { keyRefId, publicKey };
  }

  getPublicKey(keyRefId: string): string | null {
    return this.getRecord(keyRefId)?.publicKey || null;
  }

  getSignerHandle(keyRefId: string): Signer {
    // 1. Get metadata to know which manager owns this key
    const record = this.getRecord(keyRefId);
    if (!record) {
      throw new Error(`Credential not found: ${keyRefId}`);
    }

    // 2. Get the appropriate manager
    const manager = this.getKeyManager(record.keyManager);

    // 3. Create signer (manager reads & decrypts secret internally)
    return manager.createSigner(
      keyRefId,
      record.publicKey,
      record.keyAlgorithm,
    );
  }

  findByPublicKey(publicKey: string): string | null {
    const records = this.credentialStorage.list();
    const record = records.find((r) => r.publicKey === publicKey);
    return record?.keyRefId || null;
  }

  list(): Array<{
    keyRefId: string;
    keyManager: KeyManagerName;
    publicKey: string;
    labels?: string[];
  }> {
    const records = this.credentialStorage.list();
    return records.map(({ keyRefId, keyManager, publicKey, labels }) => ({
      keyRefId,
      keyManager,
      publicKey,
      labels,
    }));
  }

  remove(keyRefId: string): void {
    const record = this.getRecord(keyRefId);
    if (!record) {
      this.logger.debug(`[CRED] KeyRefId not found: ${keyRefId}`);
      return;
    }

    // Remove secret using appropriate manager
    const manager = this.getKeyManager(record.keyManager);
    manager.removeSecret(keyRefId);

    // Remove metadata
    this.credentialStorage.remove(keyRefId);

    this.logger.debug(`[CRED] Removed keyRefId=${keyRefId}`);
  }

  // Removed registerProvider - no longer needed

  createClient(network: SupportedNetwork): Client {
    const operator = this.networkService.getOperator(network);
    if (!operator) {
      throw new Error(`[CRED] No operator configured for network: ${network}`);
    }

    const { accountId, keyRefId } = operator;
    const privateKeyString = this.getPrivateKeyString(keyRefId);
    if (!privateKeyString) {
      throw new Error('[CRED] Default operator keyRef missing private key');
    }

    // Get the key algorithm from the record
    const record = this.getRecord(keyRefId);
    if (!record) {
      throw new Error('[CRED] Default operator keyRef record not found');
    }

    // Create client and set operator with credentials
    let client: Client;
    switch (network) {
      case 'mainnet':
        client = Client.forMainnet();
        break;
      case 'testnet':
        client = Client.forTestnet();
        break;
      case 'previewnet':
        client = Client.forPreviewnet();
        break;
      case 'localnet': {
        // For localnet, get configuration from NetworkService
        const localnetConfig = this.networkService.getLocalnetConfig();

        const node = {
          [localnetConfig.localNodeAddress]: AccountId.fromString(
            localnetConfig.localNodeAccountId,
          ),
        };
        client = Client.forNetwork(node);

        if (localnetConfig.localNodeMirrorAddressGRPC) {
          client.setMirrorNetwork(localnetConfig.localNodeMirrorAddressGRPC);
        }
        break;
      }
      default:
        throw new Error(`[CRED] Unsupported network: ${String(network)}`);
    }

    const accountIdObj = AccountId.fromString(accountId);

    // Use the correct PrivateKey.fromString method based on algorithm
    const privateKey =
      record.keyAlgorithm === 'ecdsa'
        ? PrivateKey.fromStringECDSA(privateKeyString)
        : PrivateKey.fromStringED25519(privateKeyString); // Default to ED25519

    // Set the operator on the client
    client.setOperator(accountIdObj, privateKey);

    return client;
  }

  async signTransaction(
    transaction: HederaTransaction,
    keyRefId: string,
  ): Promise<void> {
    const handle = this.getSignerHandle(keyRefId);
    const publicKey = PublicKey.fromString(handle.getPublicKey());

    // Use the opaque signer handle for signing
    // eslint-disable-next-line @typescript-eslint/require-await
    await transaction.signWith(publicKey, async (message: Uint8Array) =>
      handle.sign(message),
    );
  }

  getPrivateKeyString(keyRefId: string): string | null {
    const record = this.getRecord(keyRefId);
    if (!record) return null;

    const manager = this.getKeyManager(record.keyManager);
    const secret = manager.readSecret(keyRefId);
    return secret?.privateKey || null;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomBytes(8).toString('hex')}`;
  }

  private saveRecord(record: KmsCredentialRecord): void {
    this.credentialStorage.set(record.keyRefId, record);
    this.logger.debug(
      `[CRED] Saved keyRefId=${record.keyRefId} keyManager=${record.keyManager}`,
    );
  }

  private getRecord(keyRefId: string): KmsCredentialRecord | undefined {
    return this.credentialStorage.get(keyRefId);
  }

  private getKeyManager(name: KeyManagerName): KeyManager {
    const manager = this.keyManagers.get(name);
    if (!manager) {
      throw new Error(`Key manager not registered: ${name}`);
    }
    return manager;
  }
}
