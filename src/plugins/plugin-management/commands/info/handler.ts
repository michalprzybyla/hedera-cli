/**
 * Plugin Info Command Handler
 * Handles getting detailed information about a specific plugin
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import {
  CommandHandlerArgs,
  PluginStateEntry,
} from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { PluginInfoOutput } from './output';

export async function getPluginInfo(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { name } = args.args as { name: string };

  logger.log(`ℹ️  Getting plugin information: ${name}`);

  try {
    const pluginManagement = api.pluginManagement;
    const entry: PluginStateEntry | undefined =
      pluginManagement.getPlugin(name);

    if (!entry) {
      const notFound: PluginInfoOutput = {
        found: false,
        message: `Plugin ${name} not found in plugin-management state`,
      };

      return {
        status: Status.Success,
        outputJson: JSON.stringify(notFound),
      };
    }

    const pluginInfo = {
      name: entry.name,
      version: entry.version ?? 'unknown',
      displayName: entry.displayName ?? entry.name,
      description:
        entry.description ?? 'No description available for this plugin.',
      commands: entry.commands ?? [],
      capabilities: entry.capabilities ?? [],
      enabled: entry.enabled,
    };

    const outputData: PluginInfoOutput = {
      plugin: pluginInfo,
      found: true,
      message: `Plugin ${name} information retrieved successfully`,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(outputData),
    };
  } catch (error: unknown) {
    return {
      status: Status.Failure,
      errorMessage: formatError('Failed to get plugin information', error),
    };
  }
}
