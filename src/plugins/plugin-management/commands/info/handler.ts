/**
 * Plugin Info Command Handler
 * Handles getting detailed information about a specific plugin
 * Follows ADR-003 contract: returns CommandExecutionResult
 */
import * as path from 'path';
import {
  CommandHandlerArgs,
  PluginManifest,
  PluginStateEntry,
} from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../core/utils/errors';
import { PluginInfoOutput } from './output';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

export async function getPluginInfo(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api, logger } = args;
  const { state } = api;
  const { name } = args.args as { name: string };

  logger.log(`ℹ️  Getting plugin information: ${name}`);

  try {
    const entry = state.get<PluginStateEntry>(
      PLUGIN_MANAGEMENT_NAMESPACE,
      name,
    );

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

    let manifest: PluginManifest | undefined;
    try {
      manifest = await loadPluginManifest(entry.path);
    } catch (manifestError: unknown) {
      logger.warn(
        `[PLUGIN-MANAGEMENT] Failed to load plugin manifest for ${name}: ${formatError('', manifestError)}`,
      );
    }

    const commands =
      manifest?.commands?.map((command) => String(command.name)) ??
      entry.commands ??
      [];

    const capabilities = manifest?.capabilities ?? entry.capabilities ?? [];

    const pluginInfo = {
      name: entry.name,
      version: manifest?.version ?? entry.version ?? 'unknown',
      displayName: manifest?.displayName ?? entry.displayName ?? entry.name,
      description:
        manifest?.description ??
        entry.description ??
        'No description available for this plugin.',
      commands,
      capabilities,
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

async function loadPluginManifest(
  pluginPath: string,
): Promise<PluginManifest | undefined> {
  // Manifests are emitted as JS when plugins are bundled, so we rely on manifest.js.
  const manifestPath = path.resolve(pluginPath, 'manifest.js');

  try {
    const module = (await import(manifestPath)) as {
      default: PluginManifest;
    };

    if (module?.default) {
      return module.default;
    }
  } catch (error) {
    if (shouldRetryLoad(error, manifestPath)) {
      return undefined;
    }

    throw error;
  }

  return undefined;
}

function shouldRetryLoad(error: unknown, manifestPath: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const err = error as NodeJS.ErrnoException;
  const message = typeof err.message === 'string' ? err.message : '';

  if (
    err.code === 'MODULE_NOT_FOUND' ||
    err.code === 'ERR_MODULE_NOT_FOUND' ||
    message.includes('Cannot find module')
  ) {
    return message.includes(manifestPath);
  }

  return false;
}
