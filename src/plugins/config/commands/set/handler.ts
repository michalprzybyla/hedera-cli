import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../utils/errors';
import { SetConfigOutput } from './output';

function parseValue(input: string): boolean | number | string {
  const lower = input.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;
  // try number
  const asNumber = Number(input);
  if (!Number.isNaN(asNumber) && input.trim() !== '') {
    return asNumber;
  }
  return input;
}

export async function setConfigOption(
  args: CommandHandlerArgs,
): Promise<CommandExecutionResult> {
  const { api } = args;
  const name = args.args.option as string | undefined;
  const rawValue = args.args.value as string | undefined;

  if (!name) {
    return {
      status: Status.Failure,
      errorMessage: 'Missing required --option parameter',
    };
  }
  if (rawValue === undefined) {
    return {
      status: Status.Failure,
      errorMessage: 'Missing required --value parameter',
    };
  }

  try {
    const prev = api.config.getOption(name);
    const value = parseValue(rawValue);
    api.config.setOption(name, value);

    const descriptor = api.config.listOptions().find((o) => o.name === name);
    const output: SetConfigOutput = {
      name,
      type: (descriptor?.type ??
        (typeof value as unknown as SetConfigOutput['type'])) as SetConfigOutput['type'],
      previousValue: prev as SetConfigOutput['previousValue'],
      newValue: value,
    };

    return {
      status: Status.Success,
      outputJson: JSON.stringify(output),
    };
  } catch (error) {
    return {
      status: Status.Failure,
      errorMessage: formatError(`Failed to set option "${name}"`, error),
    };
  }
}
