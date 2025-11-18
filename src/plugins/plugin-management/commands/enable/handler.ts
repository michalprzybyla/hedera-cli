/**
 * Enable Plugin Command Handler
 * Marks an existing plugin as enabled in the plugin-management state.
 * Follows ADR-003 contract: returns CommandExecutionResult.
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { AddPluginOutput } from '../add/output';
import { PluginStateEntry } from '../../../../core/plugins/plugin.interface';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

export async function enablePlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { state } = api;
  const { name } = args.args as { name: string };

  logger.log('✅ Enabling plugin...');

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

    if (wasEnabled) {
      const outputData: AddPluginOutput = {
        name,
        path: existing.path,
        added: false,
        message: `Plugin ${name} is already enabled`,
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(outputData),
      };
    }

    const updated: PluginStateEntry = {
      ...existing,
      enabled: true,
    };

    state.set<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE, name, updated);

    const outputData: AddPluginOutput = {
      name,
      path: updated.path,
      added: true,
      message: `Plugin ${name} enabled successfully`,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to enable plugin', error),
    };
  }
}
