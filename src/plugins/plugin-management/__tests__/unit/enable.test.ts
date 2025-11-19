/**
 * Unit tests for plugin-management enable command
 */
import { Status } from '../../../../core/shared/constants';
import { enablePlugin } from '../../commands/enable/handler';
import {
  makeArgs,
  makeLogger,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginManagementService } from '../../../../core/services/plugin-management/plugin-management-service.interface';

describe('plugin-management enable command', () => {
  it('should enable a disabled plugin', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      enableEntry: jest.fn().mockReturnValue({
        status: 'enabled',
        entry: {
          name: 'custom-plugin',
          path: 'dist/plugins/custom-plugin',
          enabled: true,
        },
      }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.enableEntry).toHaveBeenCalledWith('custom-plugin');

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.added).toBe(true);
    expect(output.message).toContain('enabled successfully');
  });

  it('should return success with appropriate message when plugin is already enabled', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      enableEntry: jest.fn().mockReturnValue({
        status: 'already-enabled',
        entry: {
          name: 'custom-plugin',
          path: 'dist/plugins/custom-plugin',
          enabled: true,
        },
      }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();
    expect(pluginManagement.enableEntry).toHaveBeenCalledWith('custom-plugin');

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.added).toBe(false);
    expect(output.message).toContain('already enabled');
  });

  it('should return failure when plugin does not exist in state', async () => {
    const logger = makeLogger();
    const pluginManagement = {
      enableEntry: jest.fn().mockReturnValue({ status: 'not-found' }),
    } as unknown as PluginManagementService;
    const api = { pluginManagement };

    const args = makeArgs(api, logger, { name: 'unknown-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain(
      "Plugin 'unknown-plugin' not found in plugin-management state",
    );
    expect(result.outputJson).toBeUndefined();
    expect(pluginManagement.enableEntry).toHaveBeenCalledWith('unknown-plugin');
  });
});
