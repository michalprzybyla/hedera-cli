import { CustomFractionalFee, AccountId, CustomFee } from '@hashgraph/sdk';
import { FractionalFee } from '../../types';

function createCustomFractionalFee(fee: FractionalFee): CustomFee {
  const customFee = new CustomFractionalFee()
    .setNumerator(fee.numerator)
    .setDenominator(fee.denominator);

  if (fee.min) customFee.setMin(fee.min);
  if (fee.max) customFee.setMax(fee.max);

  if (fee.collectorId) {
    customFee.setFeeCollectorAccountId(AccountId.fromString(fee.collectorId));
  }
  if (fee.exempt) {
    customFee.setAllCollectorsAreExempt(fee.exempt);
  }

  return customFee;
}

const tokenUtils = {
  createCustomFractionalFee,
};

export default tokenUtils;
