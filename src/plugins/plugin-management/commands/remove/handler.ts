/**
 * Remove Plugin Command Handler
 * Disables a plugin in the plugin-management state.
 * Follows ADR-003 contract: returns CommandExecutionResult.
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { RemovePluginOutput } from './output';
import { PluginStateEntry } from '../../schema';

const PLUGIN_MANAGEMENT_NAMESPACE = 'plugin-management';

export async function removePlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { logger, state } = args;
  const { name } = args.args as { name: string };

  logger.log('➖ Disabling plugin...');

  try {
    const existing =
      state.get<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE, name) ||
      undefined;

    if (!existing) {
      const notFound: RemovePluginOutput = {
        name,
        removed: false,
        message: `Plugin ${name} is not registered in state`,
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(notFound),
      };
    }

    if (!existing.enabled) {
      const alreadyDisabled: RemovePluginOutput = {
        name,
        removed: false,
        message: `Plugin ${name} is already disabled`,
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(alreadyDisabled),
      };
    }

    const updated: PluginStateEntry = {
      ...existing,
      enabled: false,
      status: 'unloaded',
    };

    state.set<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE, name, updated);

    const outputData: RemovePluginOutput = {
      name,
      removed: true,
      message: `Plugin ${name} disabled successfully`,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to remove plugin', error),
    };
  }
}
