/**
 * Config Plugin Index
 * Exports the config plugin manifest and command handlers
 */
import { listConfigOptions } from './commands/list/handler';
import { getConfigOption } from './commands/get/handler';
import { setConfigOption } from './commands/set/handler';

export { configPluginManifest } from './manifest';

export { listConfigOptions, getConfigOption, setConfigOption };
