/**
 * Plugin Management Schema
 * Defines data types and output schemas for plugin management commands
 * and the persisted plugin state structure.
 */
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Persisted plugin state entry
 * Stored under the `plugin-management` namespace in .hedera-cli/state.
 *
 * Key convention (in StateService): plugin name, e.g. "account", "token".
 */
export const PluginStateEntrySchema = z.object({
  name: z.string().describe('Plugin name (unique identifier)'),
  path: z.string().describe('Filesystem path to the plugin root directory'),
  enabled: z.boolean().describe('Whether the plugin is enabled'),
  builtIn: z
    .boolean()
    .describe('Whether this is a built-in plugin shipped with the CLI'),
  status: z
    .enum(['loaded', 'unloaded', 'error'])
    .describe('Runtime load status of the plugin'),
  displayName: z
    .string()
    .optional()
    .describe('Optional human-friendly plugin name'),
  version: z
    .string()
    .optional()
    .describe('Optional plugin version from manifest'),
  description: z
    .string()
    .optional()
    .describe('Optional plugin description from manifest'),
});

export type PluginStateEntry = z.infer<typeof PluginStateEntrySchema>;

export const PLUGIN_STATE_ENTRY_JSON_SCHEMA = zodToJsonSchema(
  PluginStateEntrySchema,
);

// Plugin information schema
export const PluginInfoSchema = z.object({
  name: z.string().describe('Plugin name'),
  version: z.string().describe('Plugin version'),
  displayName: z.string().describe('Plugin display name'),
  description: z.string().describe('Plugin description'),
  status: z.enum(['loaded', 'unloaded', 'error']).describe('Plugin status'),
  commands: z.array(z.string()).describe('Available commands'),
  capabilities: z.array(z.string()).describe('Plugin capabilities'),
});

// Plugin list item schema
export const PluginListItemSchema = z.object({
  name: z.string().describe('Plugin name'),
  displayName: z.string().describe('Plugin display name'),
  version: z.string().describe('Plugin version'),
  status: z.enum(['loaded', 'unloaded', 'error']).describe('Plugin status'),
});

// Add plugin output schema
export const AddPluginOutputSchema = z.object({
  name: z.string().describe('Plugin name'),
  path: z.string().describe('Plugin path'),
  added: z.boolean().describe('Whether plugin was successfully added'),
  message: z.string().describe('Result message'),
});

// Remove plugin output schema
export const RemovePluginOutputSchema = z.object({
  name: z.string().describe('Plugin name'),
  removed: z.boolean().describe('Whether plugin was successfully removed'),
  message: z.string().describe('Result message'),
});

// List plugins output schema
export const ListPluginsOutputSchema = z.object({
  plugins: z.array(PluginListItemSchema).describe('List of plugins'),
  count: z.number().describe('Total number of plugins'),
});

// Plugin info output schema
export const PluginInfoOutputSchema = z.object({
  plugin: PluginInfoSchema.optional().describe('Plugin information'),
  found: z.boolean().describe('Whether plugin was found'),
  message: z.string().describe('Result message'),
});

// Type exports
export type PluginInfo = z.infer<typeof PluginInfoSchema>;
export type PluginListItem = z.infer<typeof PluginListItemSchema>;
export type AddPluginOutput = z.infer<typeof AddPluginOutputSchema>;
export type RemovePluginOutput = z.infer<typeof RemovePluginOutputSchema>;
export type ListPluginsOutput = z.infer<typeof ListPluginsOutputSchema>;
export type PluginInfoOutput = z.infer<typeof PluginInfoOutputSchema>;
