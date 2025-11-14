import type { StateService } from '../../state/state-service.interface';
import type { KmsCredentialRecord } from '../kms-types.interface';
import type { CredentialStorageInterface } from './credential-storage.interface';
import { KEY_MANAGERS } from '../kms-types.interface';

/**
 * Storage for metadata records (KmsCredentialRecord).
 * Refactored from KmsStorageService - removed secret operations.
 *
 * Responsibilities:
 * - Store/retrieve credential metadata (keyRefId, publicKey, keyManager, etc.)
 * - Provide migration for legacy records without keyManager field
 */
export class CredentialStorage implements CredentialStorageInterface {
  private readonly namespace = 'kms-credentials';

  constructor(private readonly state: StateService) {}

  get(keyRefId: string): KmsCredentialRecord | undefined {
    const record = this.state.get<KmsCredentialRecord>(
      this.namespace,
      keyRefId,
    );

    // Migration: Add default keyManager for legacy records
    if (record && !record.keyManager) {
      return {
        ...record,
        keyManager: KEY_MANAGERS.local, // Default to 'local' for legacy records
      };
    }

    return record;
  }

  set(keyRefId: string, record: KmsCredentialRecord): void {
    this.state.set<KmsCredentialRecord>(this.namespace, keyRefId, record);
  }

  remove(keyRefId: string): void {
    this.state.delete(this.namespace, keyRefId);
  }

  list(): KmsCredentialRecord[] {
    const records = this.state.list<KmsCredentialRecord>(this.namespace) || [];

    // Migration: Add default keyManager for legacy records
    return records.map((record) => {
      if (!record.keyManager) {
        return {
          ...record,
          keyManager: KEY_MANAGERS.local,
        };
      }
      return record;
    });
  }
}
