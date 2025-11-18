/**
 * Unit tests for plugin-management disable command
 */
import { Status } from '../../../../core/shared/constants';
import { disablePlugin } from '../../commands/disable/handler';
import type { StateService } from '../../../../core/services/state/state-service.interface';
import {
  makeArgs,
  makeLogger,
  makeStateMock,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginStateEntry } from '../../../../core/plugins/plugin.interface';

describe('plugin-management disable command', () => {
  it('should disable an enabled plugin', async () => {
    const logger = makeLogger();
    const entries: PluginStateEntry[] = [
      {
        name: 'custom-plugin',
        path: 'dist/plugins/custom-plugin',
        enabled: true,
        builtIn: false,
        status: 'loaded',
      },
    ];
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(entries[0]);
    state.set.mockImplementation(
      (_namespace: string, _key: string, value: unknown) => {
        entries[0] = value as PluginStateEntry;
      },
    );
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.removed).toBe(true);
    expect(output.message).toContain('disabled successfully');

    expect(entries[0].enabled).toBe(false);
    expect(entries[0].status).toBe('unloaded');
  });

  it('should return success when plugin is already disabled', async () => {
    const logger = makeLogger();
    const entries: PluginStateEntry[] = [
      {
        name: 'custom-plugin',
        path: 'dist/plugins/custom-plugin',
        enabled: false,
        builtIn: false,
        status: 'unloaded',
      },
    ];
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(entries[0]);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('already disabled');
  });

  it('should protect plugin-management from being disabled', async () => {
    const logger = makeLogger();
    const entries: PluginStateEntry[] = [
      {
        name: 'plugin-management',
        path: 'dist/plugins/plugin-management',
        enabled: true,
        builtIn: true,
        status: 'loaded',
      },
    ];
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(entries[0]);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'plugin-management' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('plugin-management');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('protected and cannot be disabled');

    expect(entries[0].enabled).toBe(true);
  });

  it('should return success with message when plugin does not exist', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(undefined);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'unknown-plugin' });

    const result = await disablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('unknown-plugin');
    expect(output.removed).toBe(false);
    expect(output.message).toContain('is not registered in state');
  });
});
