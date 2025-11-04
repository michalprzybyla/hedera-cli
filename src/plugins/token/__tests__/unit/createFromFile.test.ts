/**
 * Token Create From File Handler Unit Tests
 * Tests the token creation from file functionality of the token plugin
 */
import type { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { createTokenFromFileHandler } from '../../commands/createFromFile';
import { ZustandTokenStateHelper } from '../../zustand-state-helper';
import {
  makeLogger,
  makeApiMocks,
  mockProcessExit,
  makeTransactionResult as _makeTransactionResult,
} from './helpers/mocks';
import {
  validTokenFile,
  infiniteSupplyTokenFile,
  invalidTokenFileMissingName as _invalidTokenFileMissingName,
  invalidTokenFileInvalidAccountId as _invalidTokenFileInvalidAccountId,
  invalidTokenFileInvalidSupplyType as _invalidTokenFileInvalidSupplyType,
  invalidTokenFileNegativeSupply as _invalidTokenFileNegativeSupply,
  mockFilePaths as _mockFilePaths,
  mockTransactions,
  mockTransactionResults,
  expectedTokenTransactionParamsFromFile,
} from './helpers/fixtures';
import * as fs from 'fs/promises';
import * as path from 'path';

const { setupExit, cleanupExit, getExitSpy } = mockProcessExit();

// Mock fs/promises
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  access: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
}));

jest.mock('../../zustand-state-helper', () => ({
  ZustandTokenStateHelper: jest.fn(),
}));

const MockedHelper = ZustandTokenStateHelper as jest.Mock;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('createTokenFromFileHandler', () => {
  const mockTokenTransaction = mockTransactions.token;
  const mockSignResult = mockTransactionResults.success;

  const createMockApi = () => {
    return makeApiMocks({
      tokenTransactions: {
        createTokenTransaction: jest.fn().mockReturnValue(mockTokenTransaction),
        createTokenAssociationTransaction: jest.fn(),
      },
      signing: {
        signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
      },
      kms: {
        importPrivateKey: jest.fn().mockReturnValue({
          keyRefId: 'treasury-key-ref-id',
          publicKey: 'treasury-key',
        }),
      },
    });
  };

  beforeEach(() => {
    setupExit();
    MockedHelper.mockClear();
    MockedHelper.mockImplementation(() => ({
      saveToken: jest.fn().mockResolvedValue(undefined),
    }));
    mockFs.readFile.mockClear();
    mockFs.access.mockClear();
    mockPath.join.mockClear();
    mockPath.resolve.mockClear();
  });

  afterEach(() => {
    cleanupExit();
  });

  describe('success scenarios', () => {
    test('should create token from valid file', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined); // File exists
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const mockAssociationTransaction = mockTransactions.association;
      const mockAssociationResult =
        mockTransactionResults.successWithAssociation;

      const { api, tokenTransactions, signing } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockImplementation((transaction) => {
            if (transaction === mockTokenTransaction) {
              return Promise.resolve(mockSignResult);
            }
            if (transaction === mockAssociationTransaction) {
              return Promise.resolve(mockAssociationResult);
            }
            return Promise.resolve(mockTransactionResults.failure);
          }),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(mockFs.readFile).toHaveBeenCalledWith(
        '/path/to/token.test.json',
        'utf-8',
      );
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith(
        expectedTokenTransactionParamsFromFile,
      );
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTokenTransaction,
        { keyRefId: 'treasury-key-ref-id' },
      );
      expect(mockAddToken).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });

    test('should create token from file using full path', async () => {
      const mockAddToken = jest.fn();
      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      const fullPath = './custom/path/token.json';
      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);

      const { api, tokenTransactions, signing } = createMockApi();

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: fullPath,
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      await createTokenFromFileHandler(args);

      expect(mockFs.readFile).toHaveBeenCalledWith(fullPath, 'utf-8');
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith(
        expectedTokenTransactionParamsFromFile,
      );
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTokenTransaction,
        { keyRefId: 'treasury-key-ref-id' },
      );
      expect(mockAddToken).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });

    test('should create token from file using absolute path', async () => {
      const mockAddToken = jest.fn();
      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      const absolutePath = '/absolute/path/to/token.json';
      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);

      const { api, tokenTransactions, signing } = createMockApi();

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: absolutePath,
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      await createTokenFromFileHandler(args);

      expect(mockFs.readFile).toHaveBeenCalledWith(absolutePath, 'utf-8');
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith(
        expectedTokenTransactionParamsFromFile,
      );
      expect(signing.signAndExecuteWith).toHaveBeenCalledWith(
        mockTokenTransaction,
        { keyRefId: 'treasury-key-ref-id' },
      );
      expect(mockAddToken).toHaveBeenCalled();
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });

    test('should handle infinite supply type', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = mockTransactions.token;
      const mockSignResult = mockTransactionResults.success;

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(
        JSON.stringify(infiniteSupplyTokenFile),
      );
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(tokenTransactions.createTokenTransaction).toHaveBeenCalledWith({
        name: 'TestToken',
        symbol: 'TEST',
        treasuryId: '0.0.123456',
        decimals: 2,
        initialSupplyRaw: 1000,
        supplyType: 'INFINITE',
        maxSupplyRaw: 0,
        adminKey: 'admin-key',
        customFees: [
          {
            type: 'fixed',
            amount: 10,
            unitType: 'HBAR',
            collectorId: '0.0.999999',
            exempt: undefined,
          },
        ],
      });
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });

    test('should process associations after token creation', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = mockTransactions.token;
      const _mockAssociationTransaction = mockTransactions.association;
      const mockSignResult = mockTransactionResults.success;

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
          createTokenAssociationTransaction: jest
            .fn()
            .mockReturnValue(_mockAssociationTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(
        tokenTransactions.createTokenAssociationTransaction,
      ).toHaveBeenCalledWith({
        tokenId: '0.0.123456', // This would be the actual token ID from the transaction result
        accountId: '0.0.789012',
      });
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });
  });

  describe('file handling scenarios', () => {
    test('should handle file not found', async () => {
      // Arrange
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'nonexistent',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle file read error', async () => {
      // Arrange
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle invalid JSON', async () => {
      // Arrange
      mockFs.readFile.mockResolvedValue('invalid json content');
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('validation scenarios', () => {
    test('should handle missing required fields', async () => {
      // Arrange
      const invalidFile = {
        // name missing
        symbol: 'TEST',
        decimals: 2,
        supplyType: 'finite',
        initialSupply: 1000,
        treasury: {
          accountId: '0.0.123456',
          key: 'treasury-key',
        },
        keys: {
          adminKey: 'admin-key',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle invalid account ID format', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        treasury: {
          accountId: 'invalid-account-id',
          key: 'treasury-key',
        },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle invalid supply type', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        supplyType: 'invalid-type',
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle negative initial supply', async () => {
      // Arrange
      const invalidFile = {
        ...validTokenFile,
        initialSupply: -100,
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const { api } = makeApiMocks({});
      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith('Token file validation failed');
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });
  });

  describe('error scenarios', () => {
    test('should handle token creation failure', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = mockTransactions.token;
      const mockSignResult = mockTransactionResults.failure;

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act & Assert
      await createTokenFromFileHandler(args);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('❌ Failed to create token from file:'),
      );
      expect(getExitSpy()).toHaveBeenCalledWith(1);
    });

    test('should handle association failure gracefully', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = mockTransactions.token;
      const mockSignResult = mockTransactionResults.success;

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
          createTokenAssociationTransaction: jest
            .fn()
            .mockImplementation(() => {
              throw new Error('Association failed');
            }),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert - Should continue despite association failure
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️  Failed to associate account 0.0.789012:'),
      );
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });
  });

  describe('logging and debugging', () => {
    test('should log file processing details', async () => {
      // Arrange
      const mockAddToken = jest.fn();
      const mockTokenTransaction = mockTransactions.token;
      const mockSignResult = mockTransactionResults.success;

      MockedHelper.mockImplementation(() => ({
        saveToken: mockAddToken,
      }));

      mockFs.readFile.mockResolvedValue(JSON.stringify(validTokenFile));
      mockFs.access.mockResolvedValue(undefined);
      mockPath.join.mockReturnValue('/path/to/token.test.json');
      mockPath.resolve.mockReturnValue('/resolved/path/to/token.test.json');

      const {
        api,
        tokenTransactions: _tokenTransactions,
        signing: _signing,
      } = makeApiMocks({
        tokenTransactions: {
          createTokenTransaction: jest
            .fn()
            .mockReturnValue(mockTokenTransaction),
        },
        signing: {
          signAndExecuteWith: jest.fn().mockResolvedValue(mockSignResult),
        },
        kms: {
          importPrivateKey: jest.fn().mockReturnValue({
            keyRefId: 'treasury-key-ref-id',
            publicKey: 'treasury-key',
          }),
        },
      });

      const logger = makeLogger();
      const args: CommandHandlerArgs = {
        args: {
          file: 'test',
        },
        api,
        state: {} as any,
        config: {} as any,
        logger,
      };

      // Act
      await createTokenFromFileHandler(args);

      // Assert
      expect(logger.log).toHaveBeenCalledWith('Creating token from file: test');
      expect(logger.log).toHaveBeenCalledWith(
        '🔑 Using treasury key for signing transaction',
      );
      expect(logger.log).toHaveBeenCalledWith(
        '✅ Token created successfully from file!',
      );
      expect(getExitSpy()).toHaveBeenCalledWith(0);
    });
  });
});
