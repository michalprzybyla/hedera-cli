/**
 * List Plugins Command Handler
 * Handles listing all available plugins
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { ListPluginsOutput } from './output';
import { PluginStateEntry } from '../../../../core/plugins/plugin.interface';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

export async function getPluginList(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { state } = api;

  logger.log('📋 Getting plugin list...');

  try {
    const entries = state.list<PluginStateEntry>(PLUGIN_MANAGEMENT_NAMESPACE);

    const plugins = entries.map((entry) => ({
      name: entry.name,
      displayName: entry.displayName ?? entry.name,
      version: entry.version ?? 'unknown',
      status: entry.status,
    }));

    const outputData: ListPluginsOutput = {
      plugins,
      count: plugins.length,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to list plugins', error),
    };
  }
}
