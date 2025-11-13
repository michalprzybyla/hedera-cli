# Credentials Plugin

A plugin for managing operator credentials and keys in the Hedera CLI.

## 🏗️ Architecture

This plugin follows the plugin architecture principles:

- **Stateless**: Plugin is functionally stateless
- **Dependency Injection**: Services are injected into command handlers
- **Manifest-Driven**: Capabilities declared via manifest with output specifications
- **ADR-003 Compliance**: All command handlers return `CommandExecutionResult` with structured output
- **Type Safety**: Full TypeScript support

## 📁 Structure

```
src/plugins/credentials/
├── manifest.ts              # Plugin manifest with command definitions
├── schema.ts                # Credentials data schema with Zod validation
├── commands/
│   ├── list/
│   │   ├── handler.ts      # List credentials handler
│   │   ├── output.ts       # Output schema and template (ADR-003)
│   │   └── index.ts        # Command exports
│   └── remove/
│       ├── handler.ts      # Remove credentials handler
│       ├── output.ts       # Output schema and template
│       └── index.ts        # Command exports
├── __tests__/unit/         # Unit tests
└── index.ts                # Plugin exports
```

## 🚀 Commands

All commands follow ADR-003 contract: handlers return `CommandExecutionResult` with standardized output schemas and human-readable templates.

### List Credentials

Show all stored credentials and their metadata.

```bash
hcli credentials list
```

### Remove Credentials

Remove credentials for a specific key reference ID.

```bash
hcli credentials remove --key-ref-id key-ref-123
```

**Options:**

- `-k, --key-ref-id <string>` - Key reference ID to remove (required)

## 📊 State Management

The plugin stores credentials metadata in the `credentials-credentials` namespace using the following schema:

```typescript
{
  accountId: string; // Format: 0.0.123456
  privateKey: string; // Encrypted private key
  network: string; // mainnet|testnet|previewnet|localnet
  isDefault: boolean; // Whether this is the default credential set
  createdAt: string; // ISO timestamp
}
```

The schema is validated using Zod (`CredentialsDataSchema`) and stored as JSON Schema in the plugin manifest for runtime validation.

## 📤 Output Formatting (ADR-003)

All commands follow the ADR-003 contract for standardized output:

- **Output Schemas**: Each command defines a Zod schema in `output.ts` for type-safe output validation
- **Human Templates**: Handlebars templates provide human-readable output formatting
- **CommandExecutionResult**: All handlers return `CommandExecutionResult` with `status`, `errorMessage`, and `outputJson` fields
- **No process.exit()**: Handlers never call `process.exit()` directly; errors are returned in the result

Output format is controlled by the CLI's `--format` option (default: `human`, or `json` for machine-readable output).

## 🔧 Core API Integration

The plugin uses the Core API services:

- `api.kms` - Secure key storage and management
- `api.network` - Operator configuration per network
- `api.state` - Persistent credential metadata storage
- `api.logger` - Logging

## 🔐 Security Notes

- Private keys are stored securely via the KMS service
- Only key reference IDs and public keys are exposed in outputs
- Network-specific operator configuration prevents key reuse across environments
- Credentials are encrypted at rest and never logged in plaintext

## 🧪 Testing

Unit tests located in `__tests__/unit/`:

```bash
npm test -- src/plugins/credentials/__tests__/unit
```

Test coverage includes:

- Listing credentials
- Removing credentials by key reference ID
- Error handling for invalid inputs
- Missing credentials handling
