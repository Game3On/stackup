const httpStatus = require('http-status');
const { contracts } = require('@stackupfinance/contracts');
const ApiError = require('../utils/ApiError');
const queue = require('../queue');
const { types } = require('../config/events');
const { recoverAddressFromLoginSignature } = require('../utils/web3');

const verifyRecoverAccountUserOps = async (signature, userOps) => {
  const recoveredAddress = recoverAddressFromLoginSignature(signature);
  const newOwner = contracts.Wallet.interface.decodeFunctionData('transferOwner', userOps[userOps.length - 1].callData)[0];

  if (recoveredAddress !== newOwner) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid UserOperation');
  }
};

const monitorRecoverAccountTransaction = async (data) => {
  queue.now(types.recoverAccount, data);
};

const monitorNewPaymentTransaction = async (data) => {
  queue.now(types.newPayment, data);
};

const monitorGenericRelayTransaction = async (data) => {
  queue.now(types.genericRelay, data);
};

module.exports = {
  verifyRecoverAccountUserOps,
  monitorRecoverAccountTransaction,
  monitorNewPaymentTransaction,
  monitorGenericRelayTransaction,
};
