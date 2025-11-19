# Core Api Reference

Complete reference documentation for the Hedera CLI Core Api, including all services, interfaces, and types.

## 📋 Overview

The Core Api provides a stable, typed interface for plugins to interact with Hedera networks and CLI functionality. All services are injected into command handlers via dependency injection.

## 🏗️ Core Api Structure

```typescript
interface CoreApi {
  account: AccountService;
  token: TokenService;
  topic: TopicService;
  txExecution: TxExecutionService;
  state: StateService;
  mirror: HederaMirrornodeService;
  network: NetworkService;
  config: ConfigService;
  logger: Logger;
  alias: AliasService;
  kms: KmsService;
  hbar: HbarService;
  output: OutputService;
}
```

## 🛠️ Service Interfaces

### Account Service

Handles Hedera account creation and management operations.

```typescript
interface AccountService {
  createAccount(params: CreateAccountParams): Promise<AccountCreateResult>;
  getAccountInfo(accountId: string): Promise<AccountInfoQuery>;
  getAccountBalance(
    accountId: string,
    tokenId?: string,
  ): Promise<AccountBalanceQuery>;
}

interface CreateAccountParams {
  balanceRaw: number;
  maxAutoAssociations?: number;
  publicKey: string;
  keyType?: 'ECDSA' | 'ED25519';
}

interface AccountCreateResult {
  transaction: AccountCreateTransaction;
  publicKey: string;
  evmAddress: string;
}
```

**Usage Example:**

```typescript
const result = await api.account.createAccount({
  balanceRaw: 100000000, // tinybars
  publicKey: '302e020100300506032b6570...',
  keyType: 'ECDSA',
  maxAutoAssociations: 10,
});
```

### TxExecutionService

Manages transaction signing and execution.

```typescript
interface TxExecutionService {
  signAndExecute(transaction: HederaTransaction): Promise<TransactionResult>;

  signAndExecuteWith(
    tx: HederaTransaction,
    signer: SignerRef,
  ): Promise<TransactionResult>;

  freezeTx(transaction: HederaTransaction): HederaTransaction;
}

interface TransactionResult {
  transactionId: string;
  success: boolean;
  receipt: TransactionReceipt;
  accountId?: string;
  tokenId?: string;
  topicId?: string;
  topicSequenceNumber?: number;
  consensusTimestamp: string;
}

type SignerRef = {
  keyRefId?: string;
  publicKey?: string;
};
```

**Usage Example:**

```typescript
const receipt = await api.txExecution.signAndExecute(transaction);
const status = await api.txExecution.getTransactionStatus(transactionId);
```

### State Service

Provides namespaced, versioned state management with Zustand.

```typescript
interface StateService {
  get<T>(namespace: string, key: string): T | undefined;
  set<T>(namespace: string, key: string, value: T): void;
  has(namespace: string, key: string): boolean;
  delete(namespace: string, key: string): void;
  clear(namespace: string): void;
  list(namespace: string): Array<{ key: string; value: unknown }>;
  getNamespaces(): string[];
  getKeys(namespace: string): string[];
}
```

**Usage Example:**

```typescript
// Store data
api.state.set('my-plugin-data', 'user-123', {
  name: 'John Doe',
  accountId: '0.0.123456',
});

// Retrieve data
const user = api.state.get('my-plugin-data', 'user-123');

// Check if data exists
const hasUser = api.state.has('my-plugin-data', 'user-123');

// List all data in namespace
const allUsers = api.state.list('my-plugin-data');
```

### Mirror Node Service

Provides comprehensive access to Hedera Mirror Node API.

```typescript
interface HederaMirrornodeService {
  // Account operations
  getAccount(accountId: string): Promise<AccountResponse>;
  getAccountHBarBalance(accountId: string): Promise<bigint>;
  getAccountTokenBalances(
    accountId: string,
    tokenId?: string,
  ): Promise<TokenBalancesResponse>;

  // Token operations
  getTokenInfo(tokenId: string): Promise<TokenInfo>;

  // Topic operations
  getTopicInfo(topicId: string): Promise<TopicInfo>;
  getTopicMessages(
    queryParams: TopicMessagesQueryParams,
  ): Promise<TopicMessagesResponse>;

  // Transaction operations
  getTransactionRecord(
    transactionId: string,
    nonce?: number,
  ): Promise<TransactionDetailsResponse>;

  // Contract operations
  getContractInfo(contractId: string): Promise<ContractInfo>;

  // Network operations
  getExchangeRate(timestamp?: string): Promise<ExchangeRateResponse>;
}
```

**Usage Examples:**

```typescript
// Get account information
const account = await api.mirror.getAccount('0.0.123456');
console.log(
  `Account: ${account.accountId}, Balance: ${account.balance.balance}`,
);

// Get HBAR balance
const balance = await api.mirror.getAccountHBarBalance('0.0.123456');
console.log(`Balance: ${balance.toString()} tinybars`);

// Get token balances
const tokenBalances = await api.mirror.getAccountTokenBalances('0.0.123456');
console.log(`Tokens: ${tokenBalances.tokens.length}`);

// Get topic messages
const messages = await api.mirror.getTopicMessages({
  topicId: '0.0.123456',
  limit: 10,
});
console.log(`Messages: ${messages.messages.length}`);
```

### Network Service

Manages network configuration, selection, and per-network operator credentials.

```typescript
interface NetworkService {
  getCurrentNetwork(): SupportedNetwork;
  getAvailableNetworks(): string[];
  getNetworkConfig(network: string): NetworkConfig;
  switchNetwork(network: string): void;
  getLocalnetConfig(): LocalnetConfig;
  isNetworkAvailable(network: string): boolean;
  setOperator(
    network: SupportedNetwork,
    operator: { accountId: string; keyRefId: string },
  ): void;
  getOperator(
    network: SupportedNetwork,
  ): { accountId: string; keyRefId: string } | null;
}

interface NetworkConfig {
  name: string;
  rpcUrl: string;
  mirrorNodeUrl: string;
  chainId: string;
  explorerUrl?: string;
  isTestnet: boolean;
  operator?: {
    accountId: string;
    keyRefId: string;
  };
}

interface LocalnetConfig {
  localNodeAddress: string;
  localNodeAccountId: string;
  localNodeMirrorAddressGRPC: string;
}
```

**Usage Example:**

```typescript
const currentNetwork = api.network.getCurrentNetwork();
const config = api.network.getNetworkConfig(currentNetwork);
const availableNetworks = api.network.getAvailableNetworks();

// Set operator for specific network
api.network.setOperator('testnet', {
  accountId: '0.0.123456',
  keyRefId: 'kr_test123',
});

// Get operator for current network
const operator = api.network.getOperator(currentNetwork);
```

### Config Service

Provides read-only access to CLI configuration.

```typescript
interface ConfigService {
  getCurrentNetwork(): string;
  getNetworkConfig(network: string): NetworkConfig;
  getAvailableNetworks(): string[];
  getOperatorId(): string;
  getOperatorKey(): string;
}
```

**Usage Example:**

```typescript
const config = api.config.getConfig();
const network = api.config.getValue('network');
const hasCustomSetting = api.config.hasValue('custom.setting');
```

### Logger Service

Provides structured logging capabilities.

```typescript
interface Logger {
  log(message: string): void;
  verbose(message: string): void;
  error(message: string): void;
  warn(message: string): void;
  debug(message: string): void;
}
```

**Usage Example:**

```typescript
api.logger.log('Processing request...');
api.logger.warn('Deprecated feature used');
api.logger.error('Failed to process request');
api.logger.debug('Debug information...');
```

### KMS Service

Manages operator credentials and key management securely.

```typescript
interface KmsService {
  createLocalPrivateKey(labels?: string[]): {
    keyRefId: string;
    publicKey: string;
  };
  importPrivateKey(
    privateKey: string,
    labels?: string[],
  ): { keyRefId: string; publicKey: string };
  getPublicKey(keyRefId: string): string | null;
  getSignerHandle(keyRefId: string): KmsSignerService;
  findByPublicKey(publicKey: string): string | null;
  list(): Array<{
    keyRefId: string;
    type: CredentialType;
    publicKey: string;
    labels?: string[];
  }>;
  remove(keyRefId: string): void;
  createClient(network: SupportedNetwork): Client;
  signTransaction(
    transaction: HederaTransaction,
    keyRefId: string,
  ): Promise<void>;
}
```

**Usage Example:**

```typescript
// Create and import keys
const keyPair = api.kms.createLocalPrivateKey(['my-key']);
const imported = api.kms.importPrivateKey('private-key-string');

// Get public key
const publicKey = api.kms.getPublicKey(keyPair.keyRefId);

// List all keys
const allKeys = api.kms.list();

// Create Hedera client (automatically uses network-specific operator)
const client = api.kms.createClient('testnet');
```

## Command Handler Context

All plugin command handlers receive a `CommandHandlerArgs` object (defined in `src/core/plugins/plugin.interface.ts`) that provides:

- `args: Record<string, unknown>` – parsed CLI arguments
- `api: CoreApi` – the Core API instance described in this document
- `state: StateService` – namespaced access to persisted state
- `config: ConfigService` – read-only view over CLI configuration (TODO: real implementation pending)
- `logger: Logger` – structured logging

For handler patterns, result contracts, and testing examples, see `PLUGIN_ARCHITECTURE_GUIDE.md`.

## Output Schemas

Core API services are designed to work with structured command outputs defined via Zod schemas and templates. The full specification of output schemas and templates lives in:

- [Output Schemas Guide](./output-schemas-guide.md)

## 📚 Related Documentation

- [Plugin Development Guide](../PLUGIN_ARCHITECTURE_GUIDE.md)
- [Architecture Overview](./architecture.md)
- [Output Schemas Guide](./output-schemas-guide.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Architecture Decision Records](./adr/) - ADRs for interested developers
