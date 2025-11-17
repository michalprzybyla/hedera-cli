/**
 * Add Plugin Command Handler
 * Enables or registers a plugin in the plugin-management state.
 *
 * - If the plugin already exists in state, it will be marked as enabled.
 * - If it does not exist, a new entry will be created (treated as non built-in).
 *
 * This affects which plugins will be loaded on the next CLI start.
 * Follows ADR-003 contract: returns CommandExecutionResult.
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { AddPluginOutput } from './output';
import { PluginStateEntry } from '../../../../core/plugins/plugin.interface';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

export async function addPlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { logger, state } = args;
  const { name } = args.args as { name: string };

  logger.log('➕ Enabling plugin...');

  try {
    const existing =
      state.get<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE, name) ||
      undefined;

    if (!existing) {
      return {
        status: Status.Failure,
        errorMessage: `Plugin '${name}' not found in plugin-management state`,
      };
    }

    const wasEnabled = existing.enabled;

    const updated: PluginStateEntry = {
      ...existing,
      enabled: true,
    };

    state.set<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE, name, updated);

    const outputData: AddPluginOutput = {
      name,
      path: updated.path,
      added: !wasEnabled,
      message: wasEnabled
        ? `Plugin ${name} is already enabled`
        : `Plugin ${name} enabled successfully`,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to add plugin', error),
    };
  }
}
