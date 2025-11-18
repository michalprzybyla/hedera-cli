/**
 * Unit tests for plugin-management remove command
 */
import { Status } from '../../../../core/shared/constants';
import { removePlugin } from '../../commands/remove/handler';
import type { StateService } from '../../../../core/services/state/state-service.interface';
import {
  makeArgs,
  makeLogger,
  makeStateMock,
} from '../../../../core/shared/__tests__/helpers/mocks';
import { PLUGIN_MANAGEMENT_NAMESPACE } from '../../constants';

describe('plugin-management remove command', () => {
  it('should remove an existing plugin from state', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.has.mockReturnValue(true);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'custom-plugin' });

    const result = await removePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('custom-plugin');
    expect(output.removed).toBe(true);
    expect(output.message).toContain('removed from plugin-management state');

    expect(state.delete).toHaveBeenCalledWith(
      PLUGIN_MANAGEMENT_NAMESPACE,
      'custom-plugin',
    );
  });

  it('should return success with message when plugin does not exist', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.has.mockReturnValue(false);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'unknown-plugin' });

    const result = await removePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('unknown-plugin');
    expect(output.removed).toBe(false);
    expect(output.message).toContain(
      'is not registered in plugin-management state',
    );
  });

  it('should protect plugin-management from being removed', async () => {
    const logger = makeLogger();
    const state = makeStateMock() as jest.Mocked<StateService>;
    state.has.mockReturnValue(true);
    const api = { state };

    const args = makeArgs(api, logger, { name: 'plugin-management' });

    const result = await removePlugin(args);

    expect(result.status).toBe(Status.Success);
    expect(result.outputJson).toBeDefined();

    const output = JSON.parse(result.outputJson!);
    expect(output.name).toBe('plugin-management');
    expect(output.removed).toBe(false);
    expect(output.message).toContain(
      'is a core plugin and cannot be removed from state via CLI',
    );

    expect(state.delete).not.toHaveBeenCalled();
  });
});
