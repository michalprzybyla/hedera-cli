#!/usr/bin/env node

import { program } from 'commander';
import { createCoreApi } from './core/core-api';
import { CoreApiConfig } from './core/core-api/core-api-config';
import './core/utils/json-serialize';
import { DEFAULT_PLUGIN_STATE } from './core/shared/config/cli-options';
import { registerDisabledPlugin } from './core/utils/register-disabled-plugin';
import { addDisabledPluginsHelp } from './core/utils/add-disabled-plugins-help';
import { PluginManager } from './core/plugins/plugin-manager';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { version?: string };

program
  .version(pkg.version || '0.0.0')
  .description('A CLI tool for managing Hedera environments')
  .option('--format <type>', 'Output format: human (default) or json');

// Initialize the simplified plugin system
async function initializeCLI() {
  try {
    console.error('🚀 Starting Hedera CLI...');

    // Pre-parse arguments to get format before creating core API
    program.parseOptions(process.argv.slice(2));
    const opts = program.opts();

    const formatOption = opts.format as string | undefined;
    const format = formatOption === 'json' ? 'json' : 'human';

    // Create core API config
    const coreApiConfig: CoreApiConfig = {
      format,
    };

    // Create core API
    const coreApi = createCoreApi(coreApiConfig);
    const pluginManager = new PluginManager(coreApi);

    // Initialize or read plugin-management state
    const pluginState =
      pluginManager.initializePluginState(DEFAULT_PLUGIN_STATE);

    // Derive list of enabled plugin paths from state
    const enabledPluginPaths = pluginState
      .filter((plugin) => plugin.enabled)
      .map((plugin) => plugin.path);

    // Register stubs for disabled plugins so we can log "Plugin is disabled" message
    registerDisabledPlugin(program, pluginState);

    // Set default plugins based on state
    pluginManager.setDefaultPlugins(enabledPluginPaths);

    // Initialize plugins
    await pluginManager.initialize();

    // Register plugin commands
    pluginManager.registerCommands(program);

    // Add disabled plugins section to help output
    addDisabledPluginsHelp(program, pluginState);

    console.error('✅ CLI ready');

    // Parse arguments and execute command
    await program.parseAsync(process.argv);
    process.exit(0);
  } catch (error) {
    console.error('❌ CLI execution failed:', error);
    process.exit(1);
  }
}

// Start the CLI
initializeCLI();
