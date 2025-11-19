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
export async function enablePlugin(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { name } = args.args as { name: string };

  logger.log('✅ Enabling plugin...');

  try {
    const result = api.pluginManagement.enableEntry(name);

    if (result.status === 'not-found') {
      return {
        status: Status.Failure,
        errorMessage: `Plugin '${name}' not found in plugin-management state`,
      };
    }

    const outputData: AddPluginOutput = {
      name,
      path: result.entry?.path ?? 'unknown',
      added: result.status === 'enabled',
      message:
        result.status === 'already-enabled'
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
      errorMessage: formatError('Failed to enable plugin', error),
    };
  }
}
