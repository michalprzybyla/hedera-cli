### ADR-005: NFT Plugin for Hedera CLI

- Status: Proposed
- Date: 2025-11-06
- Owner: Tech Lead, Hedera CLI
- Related: `docs/adr/ADR-001-plugin-architecture.md`, `docs/adr/ADR-002-testing-strategy.md`, `docs/adr/ADR-003-command-handler-result-contract.md`, `src/plugins/token/*`, `src/core/*`, `src/api/*`

## Context

Non-fungible tokens (NFTs) are a first-class feature of Hedera via the Token Service (`TokenType.NON_FUNGIBLE_UNIQUE`). Today the CLI offers `token` commands geared toward fungible tokens. Users lack an opinionated, end-to-end workflow for NFTs covering creation, minting metadata, association, transfer, queries, and common admin operations (burn, allowances, fees, pause/kyc/freeze).

Other ecosystems (Ethereum ERC-721/1155 CLIs, Solana SPL/Metaplex, Flow) expose dedicated NFT UX: mint, transfer, approve, query metadata/owner, and collection management. Folding all NFT behaviors into the existing `token` plugin would overload its surface and hinder discoverability.

We propose a dedicated `nft` plugin that aligns with ADR-001 (plugin architecture) and ADR-003 (result-oriented handler contract), provides a clean command set, and maps directly to Hedera SDK capabilities and Mirror Node queries.

## Decision

Introduce a first-party `nft` plugin implementing a focused command set for Hedera NFTs:

- ADR-003 compliant handlers that return `CommandExecutionResult`
- Manifest-driven output schemas and human-readable templates
- Clear separation between token-level (collection) operations and per-NFT (serial) operations
- Read operations backed by Mirror Node; write operations via Token Service and `TxExecutionService`

The plugin will be distributed and versioned alongside core/built-in plugins and follow the same testing and telemetry policies.

## Specification

### Plugin Manifest (sketch)

```ts
export const nftPluginManifest: PluginManifest = {
  name: 'nft',
  version: '1.0.0',
  displayName: 'NFT Plugin',
  description: 'Manage Hedera NFTs (create, mint, transfer, query, admin)',
  compatibility: { cli: '^1.0.0', core: '^1.0.0', api: '^1.0.0' },
  capabilities: [
    'network:read',
    'network:write',
    'tx-execution:use',
    'state:namespace:nft-assets',
  ],
  commands: [
    /* see Command Set */
  ],
  stateSchemas: [
    {
      namespace: 'nft-assets',
      version: 1,
      jsonSchema: NFT_JSON_SCHEMA,
      scope: 'profile',
    },
  ],
};
```

### Command Set

The command set is grouped into MVP and Phase 2. Options align with existing conventions in the `token` plugin (account/id aliasing, `--file`, `--args`, etc.). All commands accept ADR-003 global flags (e.g., `--format`, `--output`, `--script`).

#### MVP

- create: Create an NFT collection (token) with `TokenType.NON_FUNGIBLE_UNIQUE`.

  - **Options**: `--name`, `--symbol`, `--treasury <account[:key]>`, `--admin-key?`, `--supply-key?`, `--freeze-key?`, `--kyc-key?`, `--wipe-key?`, `--pause-key?`, `--memo?`, `--royalties-file?`, `--auto-renew-account?`, `--auto-renew-period?`
  - **Notes**: Decimals fixed at 0; initial supply 0.

- mint: Mint one or more serials with metadata.

  - **Options**: `--token <id|alias>`, `--metadata <hex|base64|utf8>...`, `--metadata-file <path>...`, `--batch-size?`, `--chunk-delay-ms?`
  - **Notes**: Supports multiple metadata entries per transaction within SDK limits.

- transfer: Transfer one or more serials between accounts.

  - **Options**: `--token <id|alias>`, `--serials <n,n,...>`, `--from <account[:key]>`, `--to <account>`, `--memo?`

- associate: Associate a token with an account.

  - **Options**: `--token <id|alias>`, `--account <id|alias[:key]>`

- dissociate: Dissociate a token from an account.

  - **Options**: `--token <id|alias>`, `--account <id|alias[:key]>`

- info: Show collection (token) info.

  - **Options**: `--token <id|alias>`

- nft-info: Show specific NFT info by serial.

  - **Options**: `--token <id|alias>`, `--serial <n>`

- list: List NFTs for a collection (paginated via Mirror Node).

  - **Options**: `--token <id|alias>`, `--limit?`, `--start?` (cursor or serial), `--order?`

- holdings: List NFTs held by an account (Mirror Node).

  - **Options**: `--account <id|alias>`, `--limit?`, `--start?`, `--order?`

- approve: Approve NFT allowances for a spender.

  - **Options**: `--token <id|alias>`, `--spender <account>`, `--serials <n,n,...> | --all-serials`, `--owner <account[:key]>?`

- revoke-approval: Revoke NFT allowances.
  - **Options**: `--token <id|alias>`, `--spender <account>`, `--serials <n,n,...> | --all-serials`, `--owner <account[:key]>?`

#### Phase 2 (Admin/Compliance)

- burn: Burn one or more serials.

  - **Options**: `--token <id|alias>`, `--serials <n,n,...>`

- freeze-account / unfreeze-account: Freeze state for an account (if freeze key present).

  - **Options**: `--token <id|alias>`, `--account <id|alias>`

- grant-kyc / revoke-kyc: Manage KYC for an account (if kyc key present).

  - **Options**: `--token <id|alias>`, `--account <id|alias>`

- pause / unpause: Pause or unpause the token (if pause key present).

  - **Options**: `--token <id|alias>`

- update: Update mutable token properties/keys (name, symbol, memo, admin keys, auto-renew settings).

  - **Options**: `--token <id|alias>`, `--name?`, `--symbol?`, `--memo?`, `--admin-key?`, `--supply-key?`, `--freeze-key?`, `--kyc-key?`, `--wipe-key?`, `--pause-key?`, `--auto-renew-account?`, `--auto-renew-period?`

- update-fees: Update custom fee schedule (royalties and fallback fees).

  - **Options**: `--token <id|alias>`, `--fees-file <path>`

- delete: Delete a token (subject to Hedera constraints).
  - **Options**: `--token <id|alias>`

### Output Contracts (ADR-003)

All handlers return `CommandExecutionResult` with `outputJson` validated against a manifest-declared JSON Schema and rendered via a human-readable template when `--format human`.

- create → `{ tokenId, tokenEvmAddress?, treasuryId, txId, network, keys }`
- mint → `{ tokenId, serials: number[], txId }`
- transfer → `{ tokenId, serials: number[], from, to, txId, status }`
- associate/dissociate → `{ tokenId, accountId, txId, status }`
- info → `{ tokenId, name, symbol, memo, supply, maxSupply?, paused, deleted, keys, customFees }`
- nft-info → `{ tokenId, serial, ownerId, spenderId?, metadataBase64, createdAt, isFrozen?, isKycGranted? }`
- list → `{ tokenId, items: NftSummary[], page: { next? } }`
- holdings → `{ accountId, items: AccountNftSummary[], page: { next? } }`
- approve/revoke-approval → `{ tokenId, spenderId, ownerId, serials?, allSerials?, txId }`

### Core API and SDK Mapping

- Write operations map to Hedera SDK transactions via Core API:
  - `TokenCreateTransaction` (NFT), `TokenMintTransaction` (metadata),
  - `TransferTransaction` (NFT transfers), `TokenBurnTransaction`,
  - `TokenAssociateTransaction`, `TokenDissociateTransaction`,
  - `TokenFreezeTransaction`/`TokenUnfreezeTransaction`, `TokenGrantKycTransaction`/`TokenRevokeKycTransaction`,
  - `TokenPauseTransaction`/`TokenUnpauseTransaction`, `TokenUpdateTransaction`, `TokenFeeScheduleUpdateTransaction`, `TokenDeleteTransaction`,
  - `AccountAllowanceApproveTransaction` / `AccountAllowanceDeleteTransaction` (NFT allowances).
- Read operations use Mirror Node endpoints via `api.mirror`: token info, NFT by serial, token NFTs (paginated), account NFTs/allowances.
- Execution and signing via `api.txExecution.signAndExecute`.

### State and Namespacing

- Namespace: `nft-assets`
- Suggested usage:
  - Cache recently created token ids and minted serials with aliasing for quick selection.
  - Store user-defined collection aliases.

### UX Conventions

- Account arguments support: `0.0.x`, `alias`, and `0.0.x:private-keyRef` when signing is needed.
- File inputs (`--metadata-file`, `--fees-file`) accept JSON; multiple files allowed.
- Reserved flags from ADR-003 are honored; plugin will not redeclare them.

### Human Output Examples

Below are examples of the human-readable output (per ADR-003 templates). Exact formatting may vary slightly but key fields are stable.

#### nft create

```text
NFT Created
  Token: 0.0.123456  (Art Collection - ART)
  EVM Address: 0x7a2c...a1f9
  Treasury: 0.0.1001
  Keys: admin, supply, pause
  Network: testnet
  Transaction: 0.0.1001@1698930000.123456789
```

#### nft mint

```text
NFTs Minted
  Token: 0.0.123456
  Serials: [1, 2, 3]
  Transaction: 0.0.1001@1698930100.223344556
```

#### nft transfer

```text
NFT Transfer Successful
  Token: 0.0.123456
  Serials: [2, 3]
  From: 0.0.1001
  To: 0.0.2002
  Transaction: 0.0.1001@1698930200.998877665
```

#### nft info

```text
NFT Collection Info
  Token: 0.0.123456  (Art Collection - ART)
  Memo: Limited edition
  Supply: 120 / Max: 1000
  Paused: false   Deleted: false
  Keys: admin, supply, pause
  Custom Fees: 5% royalty to 0.0.3003 (fallback: 1 HBAR)
```

#### nft nft-info

```text
NFT Info
  Token: 0.0.123456
  Serial: 17
  Owner: 0.0.2002
  Spender: -
  Metadata: (base64) iVBORw0KGgoAAA... (truncated)
  Created At: 2025-11-03T12:34:56.000Z
  Frozen: false   KYC Granted: true
```

#### nft list

```text
NFTs in Collection 0.0.123456
  #   Owner       Created At
  1   0.0.2002    2025-11-03T12:34:56.000Z
  2   0.0.2002    2025-11-03T12:35:10.000Z
  3   0.0.4444    2025-11-03T12:36:02.000Z
```

#### nft holdings

```text
NFT Holdings for 0.0.2002
  Token         Serial
  0.0.123456    1
  0.0.123456    2
  0.0.789012    5
```

#### nft approve

```text
NFT Allowance Approved
  Token: 0.0.123456
  Owner: 0.0.2002
  Spender: 0.0.3003
  Serials: [1, 2, 3]
  Transaction: 0.0.2002@1698930300.111222333
```

## Rationale

- **Discoverability**: A dedicated `nft` namespace mirrors other chains and keeps `token` focused on fungible flows.
- **Parity**: Command set aligns with Ethereum (mint/transfer/approve/burn), Solana (mint/list/metadata), and Flow (mint/transfer/owner queries), while leveraging Hedera-specific admin keys and fee schedules.
- **Contractual Clarity**: ADR-003 output contracts make automation predictable for pipelines and scripts.

## Alternatives Considered

- Extend the existing `token` plugin with NFT commands: rejected for UX sprawl and mixed concerns.
- Minimal read-only NFT support first: rejected for low utility; mint/transfer are core to MVP.
- JSON-RPC style single `exec` command: rejected; poor ergonomics and discoverability.

## Consequences

- Additional maintenance surface (new plugin) and tests.
- Increased E2E runtime for NFT flows (mint/transfer) against testnet/localnet.
- Clearer docs and help output; simpler onboarding for NFT users.

## Implementation Plan

### Phase 1 (MVP)

- Scaffolding: `src/plugins/nft/manifest.ts`, `schema.ts`, command folders, templates, tests.
- Commands: `create`, `mint`, `transfer`, `associate`, `dissociate`, `info`, `nft-info`, `list`, `holdings`, `approve`, `revoke-approval`.
- Output schemas and human templates per ADR-003.
- Tests: unit (handler result schemas, error paths); E2E happy path (create→mint→associate→transfer→info).

### Phase 2 (Admin)

- Add: `burn`, `freeze-account`, `unfreeze-account`, `grant-kyc`, `revoke-kyc`, `pause`, `unpause`, `update`, `update-fees`, `delete`.
- Additional E2E for admin flows behind key-gated collections.

## Testing Strategy

Per ADR-002:

- Unit tests: mock Core API (`api.tokens`, `api.txExecution`, `api.mirror`) and validate handler `outputJson` against schemas; verify ADR-003 `Status` and error taxonomy mapping.
- E2E: run CLI against localnet/testnet, asserting output formatting, pagination, and global flags (`--format`, `--output`, `--script`). Include cleanup (burn/delete where allowed) and isolation.

## Open Questions & Future Work

- Metadata handling ergonomics (IPFS/CID helpers, directory minting, JSON metadata conventions).
- Large-batch minting strategies (SDK/consensus limits, backoff, resumable batches).
- Royalty fee presets/templates and guardrails.
- Potential `collection-verify` and `collection-migrate` utilities.
- Pagination enhancements: option to limit lists and continue fetches using Mirror Node "next" URL.
