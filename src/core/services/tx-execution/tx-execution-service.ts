/**
 * Real implementation of Signing Service
 * Uses Hedera SDK to sign and execute transactions
 */
import {
  TxExecutionService,
  TransactionResult,
} from './tx-execution-service.interface';
import { Logger } from '../logger/logger-service.interface';
import { KmsService } from '../kms/kms-service.interface';
import { NetworkService } from '../network/network-service.interface';
import {
  Client,
  TransactionResponse,
  TransactionReceipt,
  Status,
  Transaction as HederaTransaction,
} from '@hashgraph/sdk';

export class TxExecutionServiceImpl implements TxExecutionService {
  private logger: Logger;
  private kms: KmsService;
  private networkService: NetworkService;

  constructor(
    logger: Logger,
    kmsState: KmsService,
    networkService: NetworkService,
  ) {
    this.logger = logger;
    this.kms = kmsState;
    this.networkService = networkService;
  }

  private getClient(): Client {
    this.logger.debug('[TX-EXECUTION] Creating client for current network');
    const network = this.networkService.getCurrentNetwork();
    return this.kms.createClient(network);
  }

  async signAndExecute(
    transaction: HederaTransaction,
  ): Promise<TransactionResult> {
    this.logger.debug(
      `[TX-EXECUTION] Signing and executing transaction with operator`,
    );

    const currentNetwork = this.networkService.getCurrentNetwork();
    const operator = this.networkService.getOperator(currentNetwork);
    if (!operator) {
      throw new Error(
        `[TX-EXECUTION] No operator configured for network: ${currentNetwork}`,
      );
    }

    const client = this.getClient();
    if (!transaction.isFrozen()) {
      transaction.freezeWith(client);
    }

    this.logger.debug(
      `[TX-EXECUTION] Signing with operator key: ${operator.keyRefId}`,
    );
    await this.kms.signTransaction(transaction, operator.keyRefId);

    return this.executeAndParseReceipt(transaction, client);
  }

  async signAndExecuteWith(
    transaction: HederaTransaction,
    keyRefIds: string[],
  ): Promise<TransactionResult> {
    this.logger.debug(`[TX-EXECUTION] Signing with ${keyRefIds.length} key(s)`);

    const client = this.getClient();
    if (!transaction.isFrozen()) {
      transaction.freezeWith(client);
    }

    const uniqueKeyRefIds = this.validateAndDeduplicateKeys(keyRefIds);

    for (const keyRefId of uniqueKeyRefIds) {
      this.logger.debug(`[TX-EXECUTION] Signing with key: ${keyRefId}`);
      await this.kms.signTransaction(transaction, keyRefId);
    }

    return this.executeAndParseReceipt(transaction, client);
  }

  /** Validate keys exist in KMS and deduplicate (preserves first occurrence order) */
  private validateAndDeduplicateKeys(keyRefIds: string[]): string[] {
    const uniqueKeyRefIds = new Set<string>();

    for (const keyRefId of keyRefIds) {
      const publicKey = this.kms.getPublicKey(keyRefId);
      // If key does not exist, skip it because its internal method and always receive validated keys
      if (publicKey) {
        uniqueKeyRefIds.add(keyRefId);
      }
    }

    if (uniqueKeyRefIds.size < keyRefIds.length) {
      this.logger.debug(
        `[TX-EXECUTION] Deduplicated ${keyRefIds.length} keys to ${uniqueKeyRefIds.size} unique key(s)`,
      );
    }

    return Array.from(uniqueKeyRefIds);
  }

  /** Execute transaction and parse receipt (shared by signAndExecute and signAndExecuteWith) */
  private async executeAndParseReceipt(
    transaction: HederaTransaction,
    client: Client,
  ): Promise<TransactionResult> {
    try {
      const response: TransactionResponse = await transaction.execute(client);
      const receipt: TransactionReceipt = await response.getReceipt(client);
      const record = await response.getRecord(client);

      const consensusTimestamp = record.consensusTimestamp
        .toDate()
        .toISOString();

      this.logger.debug(
        `[TX-EXECUTION] Transaction executed successfully: ${response.transactionId.toString()}`,
      );

      let accountId: string | undefined;
      let tokenId: string | undefined;
      let topicId: string | undefined;
      let topicSequenceNumber: number | undefined;

      if (receipt.accountId) {
        accountId = receipt.accountId.toString();
      }

      if (receipt.tokenId) {
        tokenId = receipt.tokenId.toString();
      }

      if (receipt.topicId) {
        topicId = receipt.topicId.toString();
      }

      if (receipt.topicSequenceNumber) {
        topicSequenceNumber = Number(receipt.topicSequenceNumber);
      }

      return {
        transactionId: response.transactionId.toString(),
        success: receipt.status === Status.Success,
        consensusTimestamp,
        accountId,
        tokenId,
        topicId,
        topicSequenceNumber,
        receipt: {
          status: {
            status: receipt.status === Status.Success ? 'success' : 'failed',
            transactionId: response.transactionId.toString(),
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `[TX-EXECUTION] Transaction execution failed: ${error?.toString()}`,
      );
      throw error;
    }
  }
}
