/**
 * Disable Plugin Command Handler
 * Marks an existing plugin as disabled in the plugin-management state.
 * Follows ADR-003 contract: returns CommandExecutionResult.
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { PluginStateEntry } from '../../../../core/plugins/plugin.interface';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';
import { RemovePluginOutput } from '../../schema';

export async function disablePlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { logger, state } = args;
  const { name } = args.args as { name: string };

  logger.log('➖ Disabling plugin...');

  // Protect core plugin-management from being disabled via CLI
  if (name === 'plugin-management') {
    const protectedResult: RemovePluginOutput = {
      name,
      removed: false,
      message: 'Plugin plugin-management is protected and cannot be disabled.',
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(protectedResult),
    };
  }

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
      errorMessage: formatError('Failed to disable plugin', error),
    };
  }
}
