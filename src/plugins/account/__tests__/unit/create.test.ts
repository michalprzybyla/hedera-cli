import { createAccount } from '../../commands/create/handler';
import type { CreateAccountOutput } from '../../commands/create';
import { ZustandAccountStateHelper } from '../../zustand-state-helper';
import type { CoreApi } from '../../../../core/core-api/core-api.interface';
import type { AccountService } from '../../../../core/services/account/account-transaction-service.interface';
import type { TransactionResult } from '../../../../core/services/tx-execution/tx-execution-service.interface';
import { Status } from '../../../../core/shared/constants';
import {
  makeLogger,
  makeArgs,
  makeNetworkMock,
  makeKmsMock,
  makeAliasMock,
  makeSigningMock,
  makeMirrorMock,
  setupExitSpy,
} from '../../../../../__tests__/helpers/plugin';
import BigNumber from 'bignumber.js';

jest.mock('../../zustand-state-helper', () => ({
  ZustandAccountStateHelper: jest.fn(),
}));

const MockedHelper = ZustandAccountStateHelper as jest.Mock;

/**
 * Balance constants for testing (in Tinybars)
 * These represent realistic Hbar amounts:
 * - OPERATOR_SUFFICIENT_BALANCE: 100000 Hbar (100000 * 10^8 tinybars)
 * - ACCOUNT_REQUEST_BALANCE: 10 Hbar (typical account creation)
 */
const OPERATOR_SUFFICIENT_BALANCE = 10_000_000_000_000n; // 100000 Hbar in tinybars
const OPERATOR_ACCOUNT_ID = '0.0.123';
const OPERATOR_KEY_REF_ID = 'kr_operator_test';

interface ApiMocksConfig {
  createAccountImpl?: jest.Mock;
  signAndExecuteImpl?: jest.Mock;
  network?: 'testnet' | 'mainnet' | 'previewnet';
  operatorBalance?: bigint;
}

/**
 * Factory function to create consistent API mocks for account creation tests
 * Follows Web3 testing best practices:
 * - Centralizes mock configuration
 * - Uses realistic balance values
 * - Provides sensible defaults
 * - Ensures all required dependencies are mocked
 */
const makeApiMocks = ({
  createAccountImpl,
  signAndExecuteImpl,
  network = 'testnet',
  operatorBalance = OPERATOR_SUFFICIENT_BALANCE,
}: ApiMocksConfig) => {
  const account: jest.Mocked<AccountService> = {
    createAccount: createAccountImpl || jest.fn(),
    getAccountInfo: jest.fn(),
    getAccountBalance: jest.fn(),
  };

  const signing = makeSigningMock({ signAndExecuteImpl });
  const networkMock = makeNetworkMock(network);

  // Configure network mock to return a valid operator for balance checks
  networkMock.getOperator = jest.fn().mockReturnValue({
    accountId: OPERATOR_ACCOUNT_ID,
    keyRefId: OPERATOR_KEY_REF_ID,
  });

  const kms = makeKmsMock();

  // Override createLocalPrivateKey for account creation tests
  kms.createLocalPrivateKey = jest.fn().mockReturnValue({
    keyRefId: 'kr_test123',
    publicKey: 'pub-key-test',
  });

  // Configure mirror node mock with sufficient operator balance
  const mirror = makeMirrorMock({
    hbarBalance: operatorBalance,
  });

  const alias = makeAliasMock();

  return { account, signing, networkMock, kms, alias, mirror };
};

describe('account plugin - create command (ADR-003)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates account successfully (happy path)', async () => {
    const logger = makeLogger();
    const saveAccountMock = jest.fn();
    MockedHelper.mockImplementation(() => ({ saveAccount: saveAccountMock }));

    const { account, signing, networkMock, kms, alias, mirror } = makeApiMocks({
      createAccountImpl: jest.fn().mockResolvedValue({
        transaction: {},
        publicKey: 'pub-key-test',
        evmAddress: '0x000000000000000000000000000000000000abcd',
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-123',
        success: true,
        accountId: '0.0.9999',
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      alias,
      mirror: mirror as any,
      logger,
    };

    const args = makeArgs(api, logger, {
      balance: 5000,
      'auto-associations': 3,
      name: 'myAccount',
    });

    const result = await createAccount(args);

    expect(kms.createLocalPrivateKey).toHaveBeenCalled();
    expect(account.createAccount).toHaveBeenCalledWith({
      balanceRaw: new BigNumber(500000000000),
      maxAutoAssociations: 3,
      publicKey: 'pub-key-test',
      keyType: 'ECDSA',
    });
    expect(signing.signAndExecute).toHaveBeenCalled();
    expect(alias.register).toHaveBeenCalledWith(
      expect.objectContaining({
        alias: 'myAccount',
        type: 'account',
        network: 'testnet',
        entityId: '0.0.9999',
        publicKey: 'pub-key-test',
        keyRefId: 'kr_test123',
      }),
    );
    expect(saveAccountMock).toHaveBeenCalledWith(
      'myAccount',
      expect.objectContaining({
        name: 'myAccount',
        accountId: '0.0.9999',
        type: 'ECDSA',
        network: 'testnet',
        keyRefId: 'kr_test123',
      }),
    );

    // Verify ADR-003 result
    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output: CreateAccountOutput = JSON.parse(result.outputJson!);
    expect(output.accountId).toBe('0.0.9999');
    expect(output.name).toBe('myAccount');
    expect(output.type).toBe('ECDSA');
    expect(output.network).toBe('testnet');
    expect(output.transactionId).toBe('tx-123');
    expect(output.evmAddress).toBe(
      '0x000000000000000000000000000000000000abcd',
    );
    expect(output.publicKey).toBe('pub-key-test');
  });

  test('returns failure when signAndExecute returns failure', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { account, signing, networkMock, kms, mirror, alias } = makeApiMocks({
      createAccountImpl: jest.fn().mockResolvedValue({
        transaction: {},
        privateKey: 'priv',
        publicKey: 'pub',
        evmAddress: '0x000000000000000000000000000000000000abcd',
      }),
      signAndExecuteImpl: jest.fn().mockResolvedValue({
        transactionId: 'tx-123',
        success: false,
        receipt: {} as any,
      } as TransactionResult),
    });

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      mirror: mirror as any,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'failAccount' });

    const result = await createAccount(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain('Invalid balance parameter');
  });

  test('returns failure when createAccount throws', async () => {
    const logger = makeLogger();
    MockedHelper.mockImplementation(() => ({ saveAccount: jest.fn() }));

    const { account, signing, networkMock, kms, mirror, alias } = makeApiMocks({
      createAccountImpl: jest
        .fn()
        .mockRejectedValue(new Error('network error')),
    });

    const api: Partial<CoreApi> = {
      account,
      txExecution: signing,
      network: networkMock,
      kms,
      mirror: mirror as any,
      alias,
      logger,
    };

    const args = makeArgs(api, logger, { name: 'errorAccount' });

    const result = await createAccount(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toBeDefined();
    expect(result.errorMessage).toContain('Invalid balance parameter');
  });
});
