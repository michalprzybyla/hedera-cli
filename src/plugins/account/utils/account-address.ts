import { AccountId, PublicKey } from '@hashgraph/sdk';
import { KeyAlgorithm } from '../../../core/shared/constants';
import type { KeyAlgorithmType } from '../../../core/services/kms/kms-types.interface';

interface BuildAccountAddressesParams {
  accountId: string;
  publicKey: string;
  keyType: KeyAlgorithmType;
  existingEvmAddress?: string | null;
}

interface AccountAddresses {
  evmAddress: string;
  solidityAddress: string;
  solidityAddressFull: string;
}

const ensureHexAddressPrefix = (address: string): string => {
  if (!address) {
    return address;
  }
  return address.startsWith('0x') ? address : `0x${address}`;
};

export function buildAccountAddresses({
  accountId,
  publicKey,
  keyType,
  existingEvmAddress,
}: BuildAccountAddressesParams): AccountAddresses {
  if (!accountId) {
    throw new Error('accountId is required to derive account addresses');
  }

  const solidityAddress = AccountId.fromString(accountId).toSolidityAddress();
  const solidityAddressFull = `0x${solidityAddress}`;

  const evmAddress: string | undefined =
    existingEvmAddress && existingEvmAddress !== ''
      ? ensureHexAddressPrefix(existingEvmAddress)
      : undefined;

  if (evmAddress) {
    return {
      evmAddress,
      solidityAddress,
      solidityAddressFull,
    };
  }

  if (keyType === KeyAlgorithm.ECDSA) {
    if (!publicKey) {
      throw new Error(
        'publicKey is required to derive EVM address for ECDSA keys',
      );
    }
    const ecdsaPublicKey = PublicKey.fromStringECDSA(publicKey);
    const alias = ecdsaPublicKey.toEvmAddress();
    return {
      evmAddress: ensureHexAddressPrefix(alias),
      solidityAddress,
      solidityAddressFull,
    };
  }

  return {
    evmAddress: solidityAddressFull,
    solidityAddress,
    solidityAddressFull,
  };
}
