/**
 * Remove Plugin Command Handler
 * Removes a plugin entry from the plugin-management state.
 * Follows ADR-003 contract: returns CommandExecutionResult.
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { RemovePluginOutput } from './output';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

export async function removePlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { state } = api;
  const { name } = args.args as { name: string };

  logger.log('🗑️ Removing plugin from state...');

  // Protect core plugin-management from being removed via CLI
  if (name === 'plugin-management') {
    const protectedResult: RemovePluginOutput = {
      name,
      removed: false,
      message:
        'Plugin plugin-management is a core plugin and cannot be removed from state via CLI.',
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(protectedResult),
    };
  }

  try {
    const exists = state.has(PLUGIN_MANAGEMENT_NAMESPACE, name);

    if (!exists) {
      const notFound: RemovePluginOutput = {
        name,
        removed: false,
        message: `Plugin ${name} is not registered in plugin-management state`,
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(notFound),
      };
    }

    state.delete(PLUGIN_MANAGEMENT_NAMESPACE, name);

    const outputData: RemovePluginOutput = {
      name,
      removed: true,
      message: `Plugin ${name} removed from plugin-management state`,
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
