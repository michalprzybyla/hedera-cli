import { CommandHandlerArgs } from '../../../../core/plugins/plugin.interface';
import { CommandExecutionResult } from '../../../../core/plugins/plugin.types';
import { Status } from '../../../../core/shared/constants';
import { formatError } from '../../../../utils/errors';
import { SetConfigOutput } from './output';

/**
 * Parses a string value into boolean, number, or string.
 * - "true"/"false" (case-insensitive) → boolean
 * - Valid numeric strings (e.g., "123", "-45.67") → number
 * - Everything else → string
 */
function parseValue(input: string): boolean | number | string {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Strict number parsing: must be a valid numeric string
  // Matches integers and decimals (e.g., "123", "-45.67", "0", "0.5")
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      return asNumber;
    }
  }

  return trimmed;
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
