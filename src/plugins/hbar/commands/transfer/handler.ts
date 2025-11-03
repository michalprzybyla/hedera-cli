/**
 * HBAR Transfer Command Handler
 * Handles HBAR transfers using the Core API
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { formatError } from '../../../../utils/errors';
import {
  AccountIdKeyPairSchema,
  EntityIdSchema,
} from '../../../../core/schemas/common-schemas';
import { Status } from '../../../../core/shared/constants';
import { TransferInputSchema } from '../../schema';
import { TransferOutput } from './output';
import { CoreApi } from '../../../../core';
import { Logger } from '../../../../core/services/logger/logger-service.interface';
import { SupportedNetwork } from '../../../../core/types/shared.types';

/**
 * Parse and import an account-id:private-key pair
 *
 * @param idKeyPair - The colon-separated account-id:private-key string
 * @param api - Core API instance for importing the key
 * @returns Object with accountId, keyRefId, and publicKey
 * @throws Error if the format is invalid or account ID doesn't match expected pattern
 */
function parseAndImportAccountIdKeyPair(
  idKeyPair: string,
  api: CoreApi,
): { accountId: string; keyRefId: string; publicKey: string } {
  const parts = idKeyPair.split(':');
  if (parts.length !== 2) {
    throw new Error(
      'Invalid account format. Expected either an alias or account-id:account-key',
    );
  }

  const [accountId, privateKey] = parts;

  // Validate account ID format using shared schema
  if (!EntityIdSchema.safeParse(accountId).success) {
    throw new Error(
      `Invalid account ID format: ${accountId}. Expected format: 0.0.123456`,
    );
  }

  // Import the private key
  const imported = api.kms.importPrivateKey(privateKey);

  return {
    accountId,
    keyRefId: imported.keyRefId,
    publicKey: imported.publicKey,
  };
}

/**
 * Maps validation error paths to user-friendly error messages
 */
function getValidationErrorMessage(
  errorPath: string | number | undefined,
): string {
  const pathMap: Record<string, string> = {
    balance: 'Invalid balance value',
    to: 'Invalid or missing "to" field',
  };
  return pathMap[String(errorPath)] || 'Invalid input';
}

/**
 * Attempts to resolve a default "from" account when not provided
 * Falls back to the configured network operator
 */
function getDefaultFromAccount(
  api: CoreApi,
  logger: Logger,
):
  | { success: true; accountId: string }
  | { success: false; error: CommandExecutionResult } {
  const currentNetwork = api.network.getCurrentNetwork();
  const operator = api.network.getOperator(currentNetwork);

  if (operator) {
    const accountId = operator.accountId;
    logger.log(`[HBAR] Using default operator as from: ${accountId}`);
    return { success: true, accountId };
  }

  return {
    success: false,
    error: {
      status: Status.Failure,
      errorMessage:
        `No --from provided and no default operator configured for network ${currentNetwork}. ` +
        'Provide --from <accountId|name|alias> for the current network.',
    },
  };
}

/**
 * Resolves the "from" account ID and key reference
 * Handles both account-id:private-key pairs and alias lookups
 */
function resolveFromAccount(
  from: string,
  api: CoreApi,
  logger: Logger,
  currentNetwork: SupportedNetwork,
):
  | { success: true; fromAccountId: string; fromKeyRefId: string }
  | { success: false; error: CommandExecutionResult } {
  if (AccountIdKeyPairSchema.safeParse(from).success) {
    try {
      const parsed = parseAndImportAccountIdKeyPair(from, api);
      logger.log(
        `[HBAR] Using from as account ID with private key: ${parsed.accountId}`,
      );
      return {
        success: true,
        fromAccountId: parsed.accountId,
        fromKeyRefId: parsed.keyRefId,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          status: Status.Failure,
          errorMessage: `Invalid from account format: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  const fromAlias = api.alias.resolve(from, 'account', currentNetwork);
  const fromAccountId = fromAlias?.entityId;
  const fromKeyRefId = fromAlias?.keyRefId;

  if (!fromAccountId || !fromKeyRefId) {
    return {
      success: false,
      error: {
        status: Status.Failure,
        errorMessage: `Invalid from account: ${from} is neither a valid account-id:private-key pair, nor a known account name`,
      },
    };
  }

  logger.log(`[HBAR] Resolved from alias: ${from} -> ${fromAccountId}`);
  return {
    success: true,
    fromAccountId,
    fromKeyRefId,
  };
}

export async function transferHandler(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;

  logger.log('[HBAR] Transfer command invoked');

  try {
    const validationResult = TransferInputSchema.safeParse(args.args);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      const errorMessage = getValidationErrorMessage(firstError.path[0]);
      return {
        status: Status.Failure,
        errorMessage,
      };
    }

    const validatedInput = validationResult.data;
    const amount = validatedInput.balance;
    const to = validatedInput.to;
    const fromInput = validatedInput.from;
    const memo = validatedInput.memo;

    if (fromInput && fromInput === to) {
      return {
        status: Status.Failure,
        errorMessage: 'Cannot transfer to the same account',
      };
    }

    let from = fromInput;
    if (!from) {
      const result = getDefaultFromAccount(api, logger);
      if (!result.success) {
        return result.error;
      }
      from = result.accountId;
    }

    const currentNetwork = api.network.getCurrentNetwork();

    const fromResult = resolveFromAccount(from, api, logger, currentNetwork);
    if (!fromResult.success) {
      return fromResult.error;
    }
    const { fromAccountId, fromKeyRefId } = fromResult;
    let toAccountId = to;

    if (EntityIdSchema.safeParse(to).success) {
      toAccountId = to;
      logger.log(`[HBAR] Using to as account ID: ${to}`);
    } else {
      const toAlias = api.alias.resolve(to, 'account', currentNetwork);
      if (toAlias) {
        toAccountId = toAlias.entityId || to;
        logger.log(`[HBAR] Resolved to alias: ${to} -> ${toAccountId}`);
      } else {
        return {
          status: Status.Failure,
          errorMessage: `Invalid to account: ${to} is neither a valid account ID nor a known alias`,
        };
      }
    }

    logger.log(
      `[HBAR] Transferring ${amount} tinybars from ${fromAccountId} to ${toAccountId}`,
    );

    const transferResult = await api.hbar.transferTinybar({
      amount,
      from: fromAccountId,
      to: toAccountId,
      memo,
    });

    const result = fromKeyRefId
      ? await api.txExecution.signAndExecuteWith(transferResult.transaction, {
          keyRefId: fromKeyRefId,
        })
      : await api.txExecution.signAndExecute(transferResult.transaction);

    if (!result.success) {
      return {
        status: Status.Failure,
        errorMessage: `Transfer failed: ${result.receipt?.status?.status ?? 'UNKNOWN'}`,
      };
    }

    logger.log(
      `[HBAR] Transfer submitted successfully, txId=${result.transactionId}`,
    );

    const outputData: TransferOutput = {
      transactionId: result.transactionId || '',
      fromAccountId,
      toAccountId,
      amountTinybar: BigInt(amount),
      network: currentNetwork,
      ...(memo && { memo }),
      ...(result.receipt?.status && {
        status: result.receipt.status.status,
      }),
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData, (_key: string, value: unknown) =>
        typeof value === 'bigint' ? value.toString() : value,
      ),
    };
  } catch (error) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Transfer failed', error),
    };
  }
}
