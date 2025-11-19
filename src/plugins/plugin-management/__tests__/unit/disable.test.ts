/**
 * Unit tests for plugin-management disable command
 */
import { Status } from '../../../../core/shared/constants';
import { disablePlugin } from '../../commands/disable/handler';
import {
  makeArgs,
  makeLogger,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginManagementService } from '../../../../core/services/plugin-management/plugin-management-service.interface';

describe('plugin-management disable command', () => {
  it('should disable an enabled plugin', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      disableEntry: jest.fn().mockReturnValue({
        status: 'disabled',
        entry: {
          name: 'custom-plugin',
          path: 'dist/plugins/custom-plugin',
          enabled: false,
          status: 'unloaded',
        },
      }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.disableEntry).toHaveBeenCalledWith('custom-plugin');

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.removed).toBe(true);
    expect(output.message).toContain('disabled successfully');
  });

  it('should return success when plugin is already disabled', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      disableEntry: jest.fn().mockReturnValue({
        status: 'already-disabled',
        entry: {
          name: 'custom-plugin',
          path: 'dist/plugins/custom-plugin',
          enabled: false,
          status: 'unloaded',
        },
      }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.disableEntry).toHaveBeenCalledWith('custom-plugin');

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('already disabled');
  });

  it('should protect plugin-management from being disabled', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      disableEntry: jest.fn().mockReturnValue({ status: 'protected' }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'plugin-management' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.disableEntry).toHaveBeenCalledWith(
      'plugin-management',
    );

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('plugin-management');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('protected and cannot be disabled');
  });

  it('should return success with message when plugin does not exist', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      disableEntry: jest.fn().mockReturnValue({ status: 'not-found' }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'unknown-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.disableEntry).toHaveBeenCalledWith(
      'unknown-plugin',
    );

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('unknown-plugin');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('is not registered in state');
  });
});
