/**
 * Unit tests for plugin-management enable command
 */
import { Status } from '../../../../core/shared/constants';
import { enablePlugin } from '../../commands/enable/handler';
import type { StateService } from '../../../../core/services/state/state-service.interface';
import {
  makeArgs,
  makeLogger,
  makeStateMock,
} from '../../../../core/shared/__tests__/helpers/mocks';
import type { PluginStateEntry } from '../../../../core/plugins/plugin.interface';

describe('plugin-management enable command', () => {
  it('should enable a disabled plugin', async () => {
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
    state.set.mockImplementation(
      (_namespace: string, _key: string, value: unknown) => {
        entries[0] = value as PluginStateEntry;
      },
    );
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.added).toBe(true);
    expect(output.message).toContain('enabled successfully');

    expect(entries[0].enabled).toBe(true);
  });

  it('should return success with appropriate message when plugin is already enabled', async () => {
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
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.added).toBe(false);
    expect(output.message).toContain('already enabled');

    expect(entries[0].enabled).toBe(true);
  });

  it('should return failure when plugin does not exist in state', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.get.mockReturnValue(undefined);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'unknown-plugin' });

    const result = await enablePlugin(args);

    expect(result.status).toBe(Status.Failure);
    expect(result.errorMessage).toContain(
      "Plugin 'unknown-plugin' not found in plugin-management state",
    );
    expect(result.outputJson).toBeUndefined();
  });
});
