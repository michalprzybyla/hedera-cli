# Topic Plugin

Complete topic management plugin for the Hedera CLI following the plugin architecture (ADR-001) and result-oriented command handler contract (ADR-003).

## 🏗️ Architecture

- **Stateless handlers** – no shared globals; all dependencies injected via `CommandHandlerArgs`
- **Manifest-driven** – commands, options, capabilities, and output schemas declared in `manifest.ts`
- **Namespace isolation** – topic metadata persisted in `topic-topics`
- **Zod + JSON Schema** – single source of truth for topic state validation
- **ADR-003 compliance** – every handler returns `CommandExecutionResult`
- **Typed Core API access** – topic creation, mirror node queries, alias/KMS coordination

## 📁 Structure

```
src/plugins/topic/
├── manifest.ts              # Command definitions + output specs
├── schema.ts                # Zod schema + JSON Schema export
├── commands/
│   ├── create/
│   │   ├── handler.ts       # Create topic
│   │   ├── output.ts        # Output schema & template
│   │   └── index.ts
│   ├── list/
│   │   ├── handler.ts       # List topics from state
│   │   ├── output.ts
│   │   └── index.ts
│   ├── submit-message/
│   │   ├── handler.ts       # Submit HCS message
│   │   ├── output.ts
│   │   └── index.ts
│   └── find-message/
│       ├── handler.ts       # Mirror node lookups
│       ├── output.ts
│       └── index.ts
├── zustand-state-helper.ts  # Helper around `api.state`
└── index.ts                 # Plugin exports
```

## 🚀 Commands

All commands output `CommandExecutionResult` with structured JSON validated against the per-command Zod schema and rendered via Handlebars templates.

### Topic Create

Create a Hedera topic with optional memo and admin/submit keys. Keys may be resolved from aliases or imported into KMS on-the-fly.

```bash
hcli topic create \
  --name marketing-updates \
  --memo "Weekly digest" \
  --admin-key alice \
  --submit-key bob

# Provide raw private keys (imported into KMS automatically)
hcli topic create \
  --memo "Immutable topic" \
  --admin-key 302e020100300506032b6570... \
  --submit-key 302e020100300506032b6570...
```

### Topic List

List topics stored in the CLI state (filtered by network if needed) with quick stats about memos and attached keys.

```bash
hcli topic list
hcli topic list --network testnet
```

### Topic Submit Message

Submit a message to a topic using an alias or topic ID. Handles signing with the stored submit key when required.

```bash
# Using alias registered during topic creation
hcli topic submit-message \
  --topic marketing-updates \
  --message "Next AMA on Thursday"

# Using explicit topic ID
hcli topic submit-message \
  --topic-id 0.0.900123 \
  --message '{"event":"mint","amount":10}'
```

### Topic Find Message

Query mirror node data for a topic by sequence number or with range filters.

```bash
# Fetch a specific sequence number
hcli topic find-message \
  --topic marketing-updates \
  --sequence-number 42

# Fetch all messages after a sequence number
hcli topic find-message \
  --topic-id 0.0.900123 \
  --sequence-number-gt 100
```

## 📝 Parameter Formats

- **Topic reference**: alias registered in the CLI or explicit `0.0.x` ID
- **Keys**: account alias (resolved via `api.alias`) or raw private key string (imported into KMS and referenced via `keyRefId`)
- **Messages**: UTF-8 strings; mirror results are automatically Base64-decoded
- **Sequence filters**: `--sequence-number`, `--sequence-number-gt`, `--sequence-number-gte`, `--sequence-number-lt`, `--sequence-number-lte`, `--sequence-number-eq`, `--sequence-number-ne`

## 🔧 Core API Integration

- `api.topic` – topic creation + message submission transactions
- `api.txExecution` – signing with operator, admin, or submit keys
- `api.alias` – resolve/register topic aliases and key references
- `api.kms` – secure private key import for admin/submit keys
- `api.mirror` – query messages via Hedera Mirror Node
- `api.state` – namespaced topic storage through `ZustandTopicStateHelper`
- `api.network` – current network resolution for IDs and filters
- `api.logger` – progress logging (suppressed automatically in `--script` mode)

## 📤 Output Formatting (ADR-003)

- Each command defines a Zod schema (`commands/*/output.ts`) and Handlebars template.
- Handlers never call `process.exit()`; they return `{ status, errorMessage?, outputJson? }`.
- CLI handles validation, `--format human|json|yaml`, `--output <path>`, and script-mode suppression.

## 📊 State Management

Topics are stored under `topic-topics` with the schema defined in `schema.ts`:

```ts
interface TopicData {
  name: string;
  topicId: string;
  memo?: string;
  adminKeyRefId?: string;
  submitKeyRefId?: string;
  autoRenewAccount?: string;
  autoRenewPeriod?: number;
  expirationTime?: string;
  network: 'mainnet' | 'testnet' | 'previewnet' | 'localnet';
  createdAt: string;
  updatedAt: string;
}
```

Validation is enforced via Zod at runtime and the generated JSON Schema is embedded in the plugin manifest for manifest-level declarations.

## 🧪 Testing Notes

- Handlers are unit-tested in isolation with mocked Core API services.
- Schema parsing is covered through `TopicDataSchema`.
- ADR-003 compliance tests ensure every handler returns a valid `CommandExecutionResult`.
