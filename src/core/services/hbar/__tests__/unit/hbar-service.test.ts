/**
 * Unit tests for HbarServiceImpl
 * Tests HBAR transfer transaction creation
 */
import { HbarServiceImpl } from '../../hbar-service';
import { makeLogger } from '../../../../../__tests__/mocks/mocks';
import type { Logger } from '../../../logger/logger-service.interface';

const mockTransferTransaction = {
  addHbarTransfer: jest.fn().mockReturnThis(),
  setTransactionMemo: jest.fn().mockReturnThis(),
};

jest.mock('@hashgraph/sdk', () => ({
  TransferTransaction: jest.fn(() => mockTransferTransaction),
  AccountId: {
    fromString: jest.fn(),
  },
  Hbar: jest.fn(),
  HbarUnit: {
    Tinybar: 'tinybar',
  },
}));

import { AccountId, Hbar, HbarUnit } from '@hashgraph/sdk';

describe('HbarServiceImpl', () => {
  let hbarService: HbarServiceImpl;
  let logger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();
    logger = makeLogger();
    hbarService = new HbarServiceImpl(logger);
  });

  describe('transferTinybar', () => {
    it('should create transfer transaction with correct parameters', async () => {
      const params = {
        amount: 100_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
      };

      const result = await hbarService.transferTinybar(params);

      expect(AccountId.fromString).toHaveBeenCalledWith('0.0.1111');
      expect(AccountId.fromString).toHaveBeenCalledWith('0.0.2222');
      expect(Hbar).toHaveBeenCalledWith(-100_000_000n, HbarUnit.Tinybar);
      expect(Hbar).toHaveBeenCalledWith(100_000_000n, HbarUnit.Tinybar);
      expect(mockTransferTransaction.addHbarTransfer).toHaveBeenCalledTimes(2);
      expect(result.transaction).toBe(mockTransferTransaction);
    });

    it('should set memo when provided', async () => {
      const params = {
        amount: 50_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
        memo: 'Test transfer memo',
      };

      await hbarService.transferTinybar(params);

      expect(mockTransferTransaction.setTransactionMemo).toHaveBeenCalledWith(
        'Test transfer memo',
      );
    });

    it('should not set memo when not provided', async () => {
      const params = {
        amount: 50_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
      };

      await hbarService.transferTinybar(params);

      expect(mockTransferTransaction.setTransactionMemo).not.toHaveBeenCalled();
    });

    it('should log debug messages during transfer creation', async () => {
      const params = {
        amount: 100_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
        memo: 'Debug test',
      };

      await hbarService.transferTinybar(params);

      expect(logger.debug).toHaveBeenCalledWith(
        '[HBAR SERVICE] Building transfer: amount=100000000 from=0.0.1111 to=0.0.2222 memo=Debug test',
      );
      expect(logger.debug).toHaveBeenCalledWith(
        '[HBAR SERVICE] Created transfer transaction: from=0.0.1111 to=0.0.2222 amount=100000000',
      );
    });

    it('should log empty memo when not provided', async () => {
      const params = {
        amount: 100_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
      };

      await hbarService.transferTinybar(params);

      expect(logger.debug).toHaveBeenCalledWith(
        '[HBAR SERVICE] Building transfer: amount=100000000 from=0.0.1111 to=0.0.2222 memo=',
      );
    });

    it('should handle different account IDs', async () => {
      const params = {
        amount: 1_000_000n,
        from: '0.0.5555',
        to: '0.0.9999',
      };

      await hbarService.transferTinybar(params);

      expect(AccountId.fromString).toHaveBeenCalledWith('0.0.5555');
      expect(AccountId.fromString).toHaveBeenCalledWith('0.0.9999');
    });

    it('should handle small amounts', async () => {
      const params = {
        amount: 1n,
        from: '0.0.1111',
        to: '0.0.2222',
      };

      await hbarService.transferTinybar(params);

      expect(Hbar).toHaveBeenCalledWith(-1n, HbarUnit.Tinybar);
      expect(Hbar).toHaveBeenCalledWith(1n, HbarUnit.Tinybar);
    });

    it('should handle large amounts', async () => {
      const params = {
        amount: 100_000_000_000_000n,
        from: '0.0.1111',
        to: '0.0.2222',
      };

      await hbarService.transferTinybar(params);

      expect(Hbar).toHaveBeenCalledWith(
        -100_000_000_000_000n,
        HbarUnit.Tinybar,
      );
      expect(Hbar).toHaveBeenCalledWith(100_000_000_000_000n, HbarUnit.Tinybar);
    });
  });
});
