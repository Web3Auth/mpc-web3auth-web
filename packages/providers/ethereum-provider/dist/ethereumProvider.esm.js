import _objectSpread from '@babel/runtime/helpers/objectSpread2';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { rpcErrors, providerErrors } from '@metamask/rpc-errors';
import { createScaffoldMiddleware, createAsyncMiddleware, mergeMiddleware, JRPCEngine, providerFromEngine } from '@toruslabs/openlogin-jrpc';
import { getAccountsFromNamespaces, parseAccountId, getChainsFromNamespaces, parseChainId } from '@walletconnect/utils';
import { CHAIN_NAMESPACES, WalletLoginError, log, getChainConfig, isHexStrict } from '@web3auth-mpc/base';
import { BaseProvider } from '@web3auth-mpc/base-provider';
import { createFetchMiddleware, signMessage as signMessage$1, concatSig } from '@toruslabs/base-controllers';
import { Hardfork, Common } from '@ethereumjs/common';
import { stripHexPrefix, addHexPrefix, isValidAddress, privateToAddress, publicToAddress, intToBytes, hashPersonalMessage, toBytes, isHexString } from '@ethereumjs/util';
import BigNumber, { BigNumber as BigNumber$1 } from 'bignumber.js';
import BN from 'bn.js';
import { SignTypedDataVersion, TYPED_MESSAGE_SCHEMA, typedSignatureHash, personalSign as personalSign$1, signTypedData as signTypedData$1, getEncryptionPublicKey, decrypt, TypedDataUtils } from '@metamask/eth-sig-util';
import { get } from '@toruslabs/http-helpers';
import assert from 'assert';
import jsonschema from 'jsonschema';
import { TransactionFactory, Capability } from '@ethereumjs/tx';

function resemblesAddress(str) {
  // hex prefix 2 + 20 bytes
  return str.length === 2 + 20 * 2;
}
function createWalletMiddleware(_ref) {
  let {
    getAccounts,
    getPrivateKey,
    processDecryptMessage,
    processEncryptionPublicKey,
    processEthSignMessage,
    processPersonalMessage,
    processTransaction,
    processSignTransaction,
    processTypedMessage,
    processTypedMessageV3,
    processTypedMessageV4
  } = _ref;
  if (!getAccounts) {
    throw new Error("opts.getAccounts is required");
  }

  //
  // utility
  //

  /**
   * Validates the keyholder address, and returns a normalized (i.e. lowercase)
   * copy of it.
   *
   * an error
   */
  async function validateAndNormalizeKeyholder(address, req) {
    if (typeof address === "string" && address.length > 0) {
      // ensure address is included in provided accounts
      const accounts = await getAccounts(req);
      const normalizedAccounts = accounts.map(_address => _address.toLowerCase());
      const normalizedAddress = address.toLowerCase();
      if (normalizedAccounts.includes(normalizedAddress)) {
        return normalizedAddress;
      }
    }
    throw rpcErrors.invalidParams({
      message: `Invalid parameters: must provide an Ethereum address.`
    });
  }

  //
  // account lookups
  //

  async function lookupAccounts(req, res) {
    res.result = await getAccounts(req);
  }
  async function lookupDefaultAccount(req, res) {
    const accounts = await getAccounts(req);
    res.result = accounts[0] || null;
  }

  //
  // transaction signatures
  //

  async function sendTransaction(req, res) {
    if (!processTransaction) {
      throw rpcErrors.methodNotSupported();
    }
    const txParams = req.params[0] || {
      from: ""
    };
    txParams.from = await validateAndNormalizeKeyholder(txParams.from, req);
    res.result = await processTransaction(txParams, req);
  }
  async function signTransaction(req, res) {
    if (!processSignTransaction) {
      throw rpcErrors.methodNotSupported();
    }
    const txParams = req.params[0] || {
      from: ""
    };
    txParams.from = await validateAndNormalizeKeyholder(txParams.from, req);
    res.result = await processSignTransaction(txParams, req);
  }

  //
  // message signatures
  //

  async function ethSign(req, res) {
    if (!processEthSignMessage) {
      throw rpcErrors.methodNotSupported();
    }
    const address = await validateAndNormalizeKeyholder(req.params[0], req);
    const message = req.params[1];
    const extraParams = req.params[2] || {};
    const msgParams = _objectSpread(_objectSpread({}, extraParams), {}, {
      from: address,
      data: message
    });
    res.result = await processEthSignMessage(msgParams, req);
  }
  async function signTypedData(req, res) {
    if (!processTypedMessage) {
      throw rpcErrors.methodNotSupported();
    }
    const message = req.params[0];
    const address = await validateAndNormalizeKeyholder(req.params[1], req);
    const version = "V1";
    const extraParams = req.params[2] || {};
    const msgParams = _objectSpread(_objectSpread({}, extraParams), {}, {
      from: address,
      data: message
    });
    res.result = await processTypedMessage(msgParams, req, version);
  }
  async function signTypedDataV3(req, res) {
    if (!processTypedMessageV3) {
      throw rpcErrors.methodNotSupported();
    }
    const address = await validateAndNormalizeKeyholder(req.params[0], req);
    const message = req.params[1];
    const version = "V3";
    const msgParams = {
      data: message,
      from: address,
      version
    };
    res.result = await processTypedMessageV3(msgParams, req, version);
  }
  async function signTypedDataV4(req, res) {
    if (!processTypedMessageV4) {
      throw rpcErrors.methodNotSupported();
    }
    const address = await validateAndNormalizeKeyholder(req.params[0], req);
    const message = req.params[1];
    const version = "V4";
    const msgParams = {
      data: message,
      from: address,
      version
    };
    res.result = await processTypedMessageV4(msgParams, req, version);
  }
  async function personalSign(req, res) {
    if (!processPersonalMessage) {
      throw rpcErrors.methodNotSupported();
    }

    // process normally
    const firstParam = req.params[0];
    const secondParam = req.params[1];
    // non-standard "extraParams" to be appended to our "msgParams" obj
    const extraParams = req.params[2] || {};

    // We initially incorrectly ordered these parameters.
    // To gracefully respect users who adopted this API early,
    // we are currently gracefully recovering from the wrong param order
    // when it is clearly identifiable.
    //
    // That means when the first param is definitely an address,
    // and the second param is definitely not, but is hex.
    let address, message;
    if (resemblesAddress(firstParam) && !resemblesAddress(secondParam)) {
      let warning = `The eth_personalSign method requires params ordered `;
      warning += `[message, address]. This was previously handled incorrectly, `;
      warning += `and has been corrected automatically. `;
      warning += `Please switch this param order for smooth behavior in the future.`;
      res.warning = warning;
      address = firstParam;
      message = secondParam;
    } else {
      message = firstParam;
      address = secondParam;
    }
    address = await validateAndNormalizeKeyholder(address, req);
    const msgParams = _objectSpread(_objectSpread({}, extraParams), {}, {
      from: address,
      data: message
    });

    // eslint-disable-next-line require-atomic-updates
    res.result = await processPersonalMessage(msgParams, req);
  }
  async function encryptionPublicKey(req, res) {
    if (!processEncryptionPublicKey) {
      throw rpcErrors.methodNotSupported();
    }
    const address = await validateAndNormalizeKeyholder(req.params[0], req);
    res.result = await processEncryptionPublicKey(address, req);
  }
  async function decryptMessage(req, res) {
    if (!processDecryptMessage) {
      throw rpcErrors.methodNotSupported();
    }
    const ciphertext = req.params[0];
    const address = await validateAndNormalizeKeyholder(req.params[1], req);
    const extraParams = req.params[2] || {};
    const msgParams = _objectSpread(_objectSpread({}, extraParams), {}, {
      from: address,
      data: ciphertext
    });
    res.result = processDecryptMessage(msgParams, req);
  }
  async function fetchPrivateKey(req, res) {
    if (!getPrivateKey) {
      throw rpcErrors.methodNotSupported();
    }
    res.result = getPrivateKey(req);
  }
  return createScaffoldMiddleware({
    // account lookups
    eth_accounts: createAsyncMiddleware(lookupAccounts),
    eth_private_key: createAsyncMiddleware(fetchPrivateKey),
    private_key: createAsyncMiddleware(fetchPrivateKey),
    eth_coinbase: createAsyncMiddleware(lookupDefaultAccount),
    // tx signatures
    eth_sendTransaction: createAsyncMiddleware(sendTransaction),
    eth_signTransaction: createAsyncMiddleware(signTransaction),
    // message signatures
    eth_sign: createAsyncMiddleware(ethSign),
    eth_signTypedData: createAsyncMiddleware(signTypedData),
    eth_signTypedData_v3: createAsyncMiddleware(signTypedDataV3),
    eth_signTypedData_v4: createAsyncMiddleware(signTypedDataV4),
    personal_sign: createAsyncMiddleware(personalSign),
    eth_getEncryptionPublicKey: createAsyncMiddleware(encryptionPublicKey),
    eth_decrypt: createAsyncMiddleware(decryptMessage)
  });
}

function createEthMiddleware(providerHandlers) {
  const {
    getAccounts,
    getPrivateKey,
    processTransaction,
    processSignTransaction,
    processEthSignMessage,
    processTypedMessage,
    processTypedMessageV3,
    processTypedMessageV4,
    processPersonalMessage,
    processEncryptionPublicKey,
    processDecryptMessage
  } = providerHandlers;
  const ethMiddleware = mergeMiddleware([createScaffoldMiddleware({
    eth_syncing: false
  }), createWalletMiddleware({
    getAccounts,
    getPrivateKey,
    processTransaction,
    processEthSignMessage,
    processSignTransaction,
    processTypedMessage,
    processTypedMessageV3,
    processTypedMessageV4,
    processPersonalMessage,
    processEncryptionPublicKey,
    processDecryptMessage
  })]);
  return ethMiddleware;
}
function createChainSwitchMiddleware(_ref) {
  let {
    addChain,
    switchChain
  } = _ref;
  async function addNewChain(req, res) {
    var _req$params;
    const chainParams = (_req$params = req.params) !== null && _req$params !== void 0 && _req$params.length ? req.params[0] : undefined;
    if (!chainParams) throw rpcErrors.invalidParams("Missing chain params");
    if (!chainParams.chainId) throw rpcErrors.invalidParams("Missing chainId in chainParams");
    if (!chainParams.rpcUrls || chainParams.rpcUrls.length === 0) throw rpcErrors.invalidParams("Missing rpcUrls in chainParams");
    if (!chainParams.nativeCurrency) throw rpcErrors.invalidParams("Missing nativeCurrency in chainParams");
    res.result = await addChain(chainParams);
  }
  async function updateChain(req, res) {
    var _req$params2;
    const chainParams = (_req$params2 = req.params) !== null && _req$params2 !== void 0 && _req$params2.length ? req.params[0] : undefined;
    if (!chainParams) throw rpcErrors.invalidParams("Missing chainId");
    res.result = await switchChain(chainParams);
  }
  return createScaffoldMiddleware({
    wallet_addEthereumChain: createAsyncMiddleware(addNewChain),
    wallet_switchEthereumChain: createAsyncMiddleware(updateChain)
  });
}

// #region account middlewares
function createAccountMiddleware(_ref2) {
  let {
    updatePrivatekey
  } = _ref2;
  async function updateAccount(req, res) {
    var _req$params3;
    const accountParams = (_req$params3 = req.params) !== null && _req$params3 !== void 0 && _req$params3.length ? req.params[0] : undefined;
    if (!(accountParams !== null && accountParams !== void 0 && accountParams.privateKey)) throw rpcErrors.invalidParams("Missing privateKey");
    res.result = await updatePrivatekey(accountParams);
  }
  return createScaffoldMiddleware({
    wallet_updateAccount: createAsyncMiddleware(updateAccount)
  });
}

// #endregion account middlewares

function createChainIdMiddleware(chainId) {
  return (req, res, next, end) => {
    if (req.method === "eth_chainId") {
      res.result = chainId;
      return end();
    }
    return next();
  };
}
function createProviderConfigMiddleware(providerConfig) {
  return (req, res, next, end) => {
    if (req.method === "eth_provider_config") {
      res.result = providerConfig;
      return end();
    }
    return next();
  };
}
function createJsonRpcClient(providerConfig) {
  const {
    chainId,
    rpcTarget
  } = providerConfig;
  const fetchMiddleware = createFetchMiddleware({
    rpcTarget
  });
  const networkMiddleware = mergeMiddleware([createChainIdMiddleware(chainId), createProviderConfigMiddleware(providerConfig), fetchMiddleware]);
  return {
    networkMiddleware,
    fetchMiddleware
  };
}

async function getLastActiveSession(signClient) {
  if (signClient.session.length) {
    const lastKeyIndex = signClient.session.keys.length - 1;
    return signClient.session.get(signClient.session.keys[lastKeyIndex]);
  }
  return null;
}
async function sendJrpcRequest(signClient, chainId, method, params) {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw providerErrors.disconnected();
  }
  return signClient.request({
    topic: session.topic,
    chainId: `eip155:${chainId}`,
    request: {
      method,
      params
    }
  });
}
async function getAccounts(signClient) {
  const session = await getLastActiveSession(signClient);
  if (!session) {
    throw providerErrors.disconnected();
  }
  const accounts = getAccountsFromNamespaces(session.namespaces);
  if (accounts && accounts.length) {
    return [...new Set(accounts.map(add => {
      return parseAccountId(add).address;
    }))];
  }
  throw new Error("Failed to get accounts");
}
function getProviderHandlers$2(_ref) {
  let {
    connector,
    chainId
  } = _ref;
  return {
    getPrivateKey: async () => {
      throw rpcErrors.methodNotSupported();
    },
    getAccounts: async _ => {
      return getAccounts(connector);
    },
    processTransaction: async (txParams, _) => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_sendTransaction", [txParams]);
      return methodRes;
    },
    processSignTransaction: async (txParams, _) => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_signTransaction", [txParams]);
      return methodRes;
    },
    processEthSignMessage: async (msgParams, _) => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_sign", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processPersonalMessage: async (msgParams, _) => {
      const methodRes = await sendJrpcRequest(connector, chainId, "personal_sign", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processTypedMessage: async (msgParams, _) => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_signTypedData", [msgParams.data, msgParams.from]);
      return methodRes;
    },
    processTypedMessageV3: async msgParams => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_signTypedData_v3", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processTypedMessageV4: async msgParams => {
      const methodRes = await sendJrpcRequest(connector, chainId, "eth_signTypedData_v4", [msgParams.from, msgParams.data]);
      return methodRes;
    },
    processEncryptionPublicKey: async _ => {
      throw rpcErrors.methodNotSupported();
    },
    processDecryptMessage: _ => {
      throw rpcErrors.methodNotSupported();
    }
  };
}

var _class$2;
class WalletConnectV2Provider extends BaseProvider {
  constructor(_ref) {
    let {
      config,
      state,
      connector
    } = _ref;
    super({
      config: {
        chainConfig: _objectSpread(_objectSpread({}, config.chainConfig), {}, {
          chainNamespace: CHAIN_NAMESPACES.EIP155
        }),
        skipLookupNetwork: !!config.skipLookupNetwork
      },
      state: _objectSpread(_objectSpread({}, state || {}), {}, {
        chainId: "loading",
        accounts: []
      })
    });
    _defineProperty(this, "connector", null);
    this.connector = connector || null;
  }
  async enable() {
    if (!this.connector) throw providerErrors.custom({
      message: "Connector is not initialized, pass wallet connect connector in constructor",
      code: 4902
    });
    await this.setupProvider(this.connector);
    return this._providerEngineProxy.request({
      method: "eth_accounts"
    });
  }
  async setupProvider(connector) {
    this.onConnectorStateUpdate(connector);
    await this.setupEngine(connector);
  }
  async switchChain(_ref2) {
    let {
      chainId
    } = _ref2;
    if (!this.connector) throw providerErrors.custom({
      message: "Connector is not initialized, pass wallet connect connector in constructor",
      code: 4902
    });
    const currentChainConfig = this.getChainConfig(chainId);
    this.configure({
      chainConfig: currentChainConfig
    });
    await this.setupEngine(this.connector);
    this.lookupNetwork(this.connector);
  }
  async addChain(chainConfig) {
    super.addChain(chainConfig);
  }

  // no need to implement this method in wallet connect v2.
  async lookupNetwork(_) {
    const newChainId = this.config.chainConfig.chainId;
    this.update({
      chainId: newChainId
    });
    this.emit("chainChanged", newChainId);
    this.emit("connect", {
      chainId: newChainId
    });
    return this.config.chainConfig.chainId;
  }
  async setupEngine(connector) {
    const {
      chainId
    } = this.config.chainConfig;
    const numChainId = parseInt(chainId, 16);
    const providerHandlers = getProviderHandlers$2({
      connector,
      chainId: numChainId
    });
    const jrpcRes = await getAccounts(connector);
    this.update({
      accounts: jrpcRes || []
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getChainSwitchMiddleware();
    const engine = new JRPCEngine();
    const {
      networkMiddleware
    } = createJsonRpcClient(this.config.chainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }
  getChainSwitchMiddleware() {
    const chainSwitchHandlers = {
      addChain: async params => {
        const {
          chainId,
          chainName,
          rpcUrls,
          blockExplorerUrls,
          nativeCurrency
        } = params;
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId,
          ticker: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.symbol) || "ETH",
          tickerName: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.name) || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: (blockExplorerUrls === null || blockExplorerUrls === void 0 ? void 0 : blockExplorerUrls[0]) || "",
          decimals: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.decimals) || 18
        });
      },
      switchChain: async params => {
        const {
          chainId
        } = params;
        await this.switchChain({
          chainId
        });
      }
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }
  connectedTopic() {
    var _this$connector;
    if (!this.connector) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
    if ((_this$connector = this.connector) !== null && _this$connector !== void 0 && (_this$connector = _this$connector.session) !== null && _this$connector !== void 0 && _this$connector.length) {
      var _this$connector$sessi;
      // currently we are supporting only 1 active session
      const lastKeyIndex = this.connector.session.keys.length - 1;
      return (_this$connector$sessi = this.connector.session.get(this.connector.session.keys[lastKeyIndex])) === null || _this$connector$sessi === void 0 ? void 0 : _this$connector$sessi.topic;
    }
    return undefined;
  }
  checkIfChainIdAllowed(chainId) {
    if (!this.connector || !this.connectedTopic()) return false;
    const sessionData = this.connector.session.get(this.connectedTopic());
    const allChains = getChainsFromNamespaces(sessionData.namespaces);
    let chainAllowed = false;
    for (const chain of allChains) {
      const parsedId = parseChainId(chain);
      if (Number.parseInt(parsedId.reference, 10) === Number.parseInt(chainId, 10)) {
        chainAllowed = true;
        break;
      }
    }
    return chainAllowed;
  }
  checkIfAccountAllowed(address) {
    if (!this.connector || !this.connectedTopic()) return false;
    const sessionData = this.connector.session.get(this.connectedTopic());
    const allAccounts = getAccountsFromNamespaces(sessionData.namespaces);
    let accountAllowed = false;
    for (const account of allAccounts) {
      var _parsedAccount$addres;
      const parsedAccount = parseAccountId(account);
      if (((_parsedAccount$addres = parsedAccount.address) === null || _parsedAccount$addres === void 0 ? void 0 : _parsedAccount$addres.toLowerCase()) === (address === null || address === void 0 ? void 0 : address.toLowerCase())) {
        accountAllowed = true;
        break;
      }
    }
    return accountAllowed;
  }
  async onConnectorStateUpdate(connector) {
    connector.events.on("session_event", async payload => {
      log.debug("session_event data", payload);
      if (!this.provider) throw WalletLoginError.notConnectedError("Wallet connect connector is not connected");
      const {
        event
      } = payload.params;
      const {
        name,
        data
      } = event || {};
      // Check if accounts changed and trigger event
      if (name === "accountsChanged" && data !== null && data !== void 0 && data.length && this.state.accounts[0] !== data[0] && this.checkIfAccountAllowed(data[0])) {
        this.update({
          accounts: data
        });
        this.emit("accountsChanged", data);
      }
      if (event.name === "chainChanged") {
        const {
          chainId: connectedChainId,
          rpcUrl
        } = data;
        const connectedHexChainId = `0x${connectedChainId.toString(16)}`;
        if (!this.checkIfChainIdAllowed(connectedHexChainId)) return;
        // Check if chainId changed and trigger event
        if (connectedHexChainId && this.state.chainId !== connectedHexChainId) {
          const maybeConfig = getChainConfig(CHAIN_NAMESPACES.EIP155, connectedHexChainId) || {};
          // Handle rpcUrl update
          this.configure({
            chainConfig: _objectSpread(_objectSpread({}, maybeConfig), {}, {
              chainId: connectedHexChainId,
              rpcTarget: rpcUrl,
              chainNamespace: CHAIN_NAMESPACES.EIP155
            })
          });
          await this.setupEngine(connector);
        }
      }
    });
  }
}
_class$2 = WalletConnectV2Provider;
_defineProperty(WalletConnectV2Provider, "getProviderInstance", async params => {
  const providerFactory = new _class$2({
    config: {
      chainConfig: params.chainConfig,
      skipLookupNetwork: params.skipLookupNetwork
    }
  });
  await providerFactory.setupProvider(params.connector);
  return providerFactory;
});

// Big Number Constants
const BIG_NUMBER_WEI_MULTIPLIER = new BigNumber("1e18");
const BIG_NUMBER_GWEI_MULTIPLIER = new BigNumber("1e9");
const BIG_NUMBER_ETH_MULTIPLIER = new BigNumber("1");

// Setter Maps
const toBigNumber = {
  hex: n => typeof n === "string" ? new BigNumber(stripHexPrefix(n), 16) : new BigNumber(n, 16),
  dec: n => new BigNumber(n, 10)
};
const toNormalizedDenomination = {
  WEI: bigNumber => bigNumber.div(BIG_NUMBER_WEI_MULTIPLIER),
  GWEI: bigNumber => bigNumber.div(BIG_NUMBER_GWEI_MULTIPLIER),
  ETH: bigNumber => bigNumber.div(BIG_NUMBER_ETH_MULTIPLIER)
};
const toSpecifiedDenomination = {
  WEI: bigNumber => bigNumber.times(BIG_NUMBER_WEI_MULTIPLIER).dp(0, BigNumber.ROUND_HALF_UP),
  GWEI: bigNumber => bigNumber.times(BIG_NUMBER_GWEI_MULTIPLIER).dp(9, BigNumber.ROUND_HALF_UP),
  ETH: bigNumber => bigNumber.times(BIG_NUMBER_ETH_MULTIPLIER).dp(9, BigNumber.ROUND_HALF_UP)
};
const baseChange = {
  hex: n => n.toString(16),
  dec: n => new BigNumber(n).toString(10)
};
const converter = params => {
  const {
    value,
    fromNumericBase,
    fromDenomination,
    toNumericBase,
    toDenomination,
    numberOfDecimals
  } = params;
  let convertedValue = toBigNumber[fromNumericBase](value);
  if (fromDenomination) {
    convertedValue = toNormalizedDenomination[fromDenomination](convertedValue);
  }
  if (toDenomination) {
    convertedValue = toSpecifiedDenomination[toDenomination](convertedValue);
  }
  if (numberOfDecimals) {
    convertedValue = convertedValue.dp(numberOfDecimals, BigNumber.ROUND_HALF_DOWN);
  }
  if (toNumericBase) {
    convertedValue = baseChange[toNumericBase](convertedValue);
  }
  return convertedValue;
};
const conversionUtil = (value, _ref) => {
  let {
    fromNumericBase = "hex",
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals
  } = _ref;
  return converter({
    fromNumericBase,
    toNumericBase,
    fromDenomination,
    toDenomination,
    numberOfDecimals,
    value: value || "0"
  });
};
function decGWEIToHexWEI(decGWEI) {
  return conversionUtil(decGWEI, {
    fromNumericBase: "dec",
    toNumericBase: "hex",
    fromDenomination: "GWEI",
    toDenomination: "WEI"
  });
}
function hexWEIToDecGWEI(decGWEI) {
  return conversionUtil(decGWEI, {
    fromNumericBase: "hex",
    toNumericBase: "dec",
    fromDenomination: "WEI",
    toDenomination: "GWEI"
  });
}

function bnLessThan(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  return new BigNumber$1(a, 10).lt(b, 10);
}
function bnToHex(inputBn) {
  return addHexPrefix(inputBn.toString(16));
}
function hexToBn(inputHex) {
  if (BN.isBN(inputHex)) return inputHex;
  return new BN(stripHexPrefix(inputHex), 16);
}
function BnMultiplyByFraction(targetBN, numerator, denominator) {
  const numberBN = new BN(numerator);
  const denomBN = new BN(denominator);
  return targetBN.mul(numberBN).div(denomBN);
}

const LegacyGasAPIEndpoint = "https://gas-api.metaswap.codefi.network/networks/<chain_id>/gasPrices";
const EIP1559APIEndpoint = "https://gas-api.metaswap.codefi.network/networks/<chain_id>/suggestedGasFees";
const TRANSACTION_ENVELOPE_TYPES = {
  LEGACY: "0x0",
  ACCESS_LIST: "0x1",
  FEE_MARKET: "0x2"
};
const TRANSACTION_TYPES = {
  SENT_ETHER: "sentEther",
  CONTRACT_INTERACTION: "contractInteraction",
  DEPLOY_CONTRACT: "contractDeployment",
  STANDARD_TRANSACTION: "transaction"
};
const GAS_ESTIMATE_TYPES = {
  FEE_MARKET: "fee-market",
  LEGACY: "legacy",
  ETH_GASPRICE: "eth_gasPrice",
  NONE: "none"
};

function normalizeGWEIDecimalNumbers(n) {
  const numberAsWEIHex = decGWEIToHexWEI(n);
  const numberAsGWEI = hexWEIToDecGWEI(numberAsWEIHex).toString();
  return numberAsGWEI;
}
async function fetchEip1159GasEstimates(url) {
  const estimates = await get(url);
  const normalizedEstimates = _objectSpread(_objectSpread({}, estimates), {}, {
    estimatedBaseFee: normalizeGWEIDecimalNumbers(estimates.estimatedBaseFee),
    low: _objectSpread(_objectSpread({}, estimates.low), {}, {
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.low.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.low.suggestedMaxFeePerGas)
    }),
    medium: _objectSpread(_objectSpread({}, estimates.medium), {}, {
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.medium.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.medium.suggestedMaxFeePerGas)
    }),
    high: _objectSpread(_objectSpread({}, estimates.high), {}, {
      suggestedMaxPriorityFeePerGas: normalizeGWEIDecimalNumbers(estimates.high.suggestedMaxPriorityFeePerGas),
      suggestedMaxFeePerGas: normalizeGWEIDecimalNumbers(estimates.high.suggestedMaxFeePerGas)
    })
  });
  return normalizedEstimates;
}

/**
 * Hit the legacy MetaSwaps gasPrices estimate api and return the low, medium
 * high values from that API.
 */
async function fetchLegacyGasPriceEstimates(url) {
  const result = await get(url, {
    referrer: url,
    referrerPolicy: "no-referrer-when-downgrade",
    method: "GET",
    mode: "cors"
  });
  return {
    low: result.SafeGasPrice,
    medium: result.ProposeGasPrice,
    high: result.FastGasPrice
  };
}
const validateTypedMessageParams = (parameters, activeChainId) => {
  try {
    assert.ok(parameters && typeof parameters === "object", "Params must be an object.");
    assert.ok("data" in parameters, 'Params must include a "data" field.');
    assert.ok("from" in parameters, 'Params must include a "from" field.');
    assert.ok(typeof parameters.from === "string" && isValidAddress(parameters.from), '"from" field must be a valid, lowercase, hexadecimal Ethereum address string.');
    let data = null;
    let chainId = null;
    switch (parameters.version) {
      case SignTypedDataVersion.V1:
        if (typeof parameters.data === "string") {
          assert.doesNotThrow(() => {
            data = JSON.parse(parameters.data);
          }, '"data" must be a valid JSON string.');
        } else {
          // for backward compatiblity we validate for both string and object type.
          data = parameters.data;
        }
        assert.ok(Array.isArray(data), "params.data must be an array.");
        assert.doesNotThrow(() => {
          typedSignatureHash(data);
        }, "Signing data must be valid EIP-712 typed data.");
        break;
      case SignTypedDataVersion.V3:
      case SignTypedDataVersion.V4:
        {
          var _typedData$domain;
          if (typeof parameters.data === "string") {
            assert.doesNotThrow(() => {
              data = JSON.parse(parameters.data);
            }, '"data" must be a valid JSON string.');
          } else {
            // for backward compatiblity we validate for both string and object type.
            data = parameters.data;
          }
          const typedData = data;
          assert.ok(typedData.primaryType in typedData.types, `Primary type of "${typedData.primaryType}" has no type definition.`);
          const validation = jsonschema.validate(typedData, TYPED_MESSAGE_SCHEMA.properties);
          assert.strictEqual(validation.errors.length, 0, "Signing data must conform to EIP-712 schema. See https://git.io/fNtcx.");
          chainId = (_typedData$domain = typedData.domain) === null || _typedData$domain === void 0 ? void 0 : _typedData$domain.chainId;
          if (chainId) {
            assert.ok(!Number.isNaN(activeChainId), `Cannot sign messages for chainId "${chainId}", because Web3Auth is switching networks.`);
            if (typeof chainId === "string") {
              chainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
            }
            assert.strictEqual(chainId, activeChainId, `Provided chainId "${chainId}" must match the active chainId "${activeChainId}"`);
          }
          break;
        }
      default:
        assert.fail(`Unknown typed data version "${parameters.version}"`);
    }
  } catch (error) {
    throw rpcErrors.invalidInput({
      message: error === null || error === void 0 ? void 0 : error.message
    });
  }
};

class TransactionFormatter {
  constructor(_ref) {
    let {
      getProviderEngineProxy
    } = _ref;
    // https://0x.org/docs/introduction/0x-cheat-sheet#swap-api-endpoints
    _defineProperty(this, "API_SUPPORTED_CHAINIDS", new Set(["0x1", "0x5", "0x13881", "0xa4b1", "0xa86a", "0x2105", "0x38", "0xfa", "0xa", "0x89"]));
    _defineProperty(this, "chainConfig", null);
    _defineProperty(this, "getProviderEngineProxy", void 0);
    _defineProperty(this, "isEIP1559Compatible", false);
    this.getProviderEngineProxy = getProviderEngineProxy;
  }
  get providerProxy() {
    return this.getProviderEngineProxy();
  }
  async init() {
    this.chainConfig = await this.providerProxy.request({
      method: "eth_provider_config"
    });
    this.isEIP1559Compatible = await this.getEIP1559Compatibility();
  }
  async getCommonConfiguration() {
    if (!this.chainConfig) throw new Error("Chain config not initialized");
    const {
      displayName: name,
      chainId
    } = this.chainConfig;
    const hardfork = this.isEIP1559Compatible ? Hardfork.Paris : Hardfork.Berlin;
    const customChainParams = {
      name,
      chainId: chainId === "loading" ? 0 : Number.parseInt(chainId, 16),
      networkId: chainId === "loading" ? 0 : Number.parseInt(chainId, 16),
      defaultHardfork: hardfork
    };
    return Common.custom(customChainParams);
  }
  async formatTransaction(txParams) {
    if (!this.chainConfig) throw new Error("Chain config not initialized");
    const clonedTxParams = _objectSpread({}, txParams);
    if (clonedTxParams.nonce === undefined) clonedTxParams.nonce = await this.providerProxy.request({
      method: "eth_getTransactionCount",
      params: [txParams.from, "latest"]
    });
    if (!this.isEIP1559Compatible && clonedTxParams.gasPrice) {
      if (clonedTxParams.maxFeePerGas) delete clonedTxParams.maxFeePerGas;
      if (clonedTxParams.maxPriorityFeePerGas) delete clonedTxParams.maxPriorityFeePerGas;
      // if user provides gas Limit, we should use it instead
      // if gas is not provided explicitly, estimate it.
      if (!clonedTxParams.gasLimit) {
        if (!clonedTxParams.gas) {
          const defaultGasLimit = await this.getDefaultGasLimit(clonedTxParams);
          if (defaultGasLimit) {
            clonedTxParams.gasLimit = defaultGasLimit;
          }
        } else {
          clonedTxParams.gasLimit = clonedTxParams.gas;
        }
      }
      return clonedTxParams;
    }
    if (!clonedTxParams.gasLimit) {
      if (!clonedTxParams.gas) {
        const defaultGasLimit = await this.getDefaultGasLimit(clonedTxParams);
        if (defaultGasLimit) {
          clonedTxParams.gasLimit = defaultGasLimit;
        }
      } else {
        clonedTxParams.gasLimit = clonedTxParams.gas;
      }
    }
    const {
      gasPrice: defaultGasPrice,
      maxFeePerGas: defaultMaxFeePerGas,
      maxPriorityFeePerGas: defaultMaxPriorityFeePerGas
    } = await this.getDefaultGasFees(clonedTxParams);
    if (this.isEIP1559Compatible) {
      // If the dapp has suggested a gas price, but no maxFeePerGas or maxPriorityFeePerGas
      //  then we set maxFeePerGas and maxPriorityFeePerGas to the suggested gasPrice.
      if (clonedTxParams.gasPrice && !clonedTxParams.maxFeePerGas && !clonedTxParams.maxPriorityFeePerGas) {
        clonedTxParams.maxFeePerGas = clonedTxParams.gasPrice;
        clonedTxParams.maxPriorityFeePerGas = bnLessThan(typeof defaultMaxPriorityFeePerGas === "string" ? stripHexPrefix(defaultMaxPriorityFeePerGas) : defaultMaxPriorityFeePerGas, typeof clonedTxParams.gasPrice === "string" ? stripHexPrefix(clonedTxParams.gasPrice) : clonedTxParams.gasPrice) ? defaultMaxPriorityFeePerGas : clonedTxParams.gasPrice;
      } else {
        if (defaultMaxFeePerGas && !clonedTxParams.maxFeePerGas) {
          // If the dapp has not set the gasPrice or the maxFeePerGas, then we set maxFeePerGas
          // with the one returned by the gasFeeController, if that is available.
          clonedTxParams.maxFeePerGas = defaultMaxFeePerGas;
        }
        if (defaultMaxPriorityFeePerGas && !clonedTxParams.maxPriorityFeePerGas) {
          // If the dapp has not set the gasPrice or the maxPriorityFeePerGas, then we set maxPriorityFeePerGas
          // with the one returned by the gasFeeController, if that is available.
          clonedTxParams.maxPriorityFeePerGas = defaultMaxPriorityFeePerGas;
        }
        if (defaultGasPrice && !clonedTxParams.maxFeePerGas) {
          // If the dapp has not set the gasPrice or the maxFeePerGas, and no maxFeePerGas is available
          // then we set maxFeePerGas to the defaultGasPrice, assuming it is
          // available.
          clonedTxParams.maxFeePerGas = defaultGasPrice;
        }
        if (clonedTxParams.maxFeePerGas && !clonedTxParams.maxPriorityFeePerGas) {
          // If the dapp has not set the gasPrice or the maxPriorityFeePerGas, and no maxPriorityFeePerGas is
          // available  then we set maxPriorityFeePerGas to
          // clonedTxParams.maxFeePerGas, which will either be the gasPrice from the controller, the maxFeePerGas
          // set by the dapp, or the maxFeePerGas from the controller.
          clonedTxParams.maxPriorityFeePerGas = clonedTxParams.maxFeePerGas;
        }
      }

      // We remove the gasPrice param entirely when on an eip1559 compatible network

      delete clonedTxParams.gasPrice;
    } else {
      // We ensure that maxFeePerGas and maxPriorityFeePerGas are not in the transaction params
      // when not on a EIP1559 compatible network

      delete clonedTxParams.maxPriorityFeePerGas;
      delete clonedTxParams.maxFeePerGas;
    }

    // If we have gotten to this point, and none of gasPrice, maxPriorityFeePerGas or maxFeePerGas are
    // set on txParams, it means that either we are on a non-EIP1559 network and the dapp didn't suggest
    // a gas price, or we are on an EIP1559 network, and none of gasPrice, maxPriorityFeePerGas or maxFeePerGas
    // were available from either the dapp or the network.
    if (defaultGasPrice && !clonedTxParams.gasPrice && !clonedTxParams.maxPriorityFeePerGas && !clonedTxParams.maxFeePerGas) {
      clonedTxParams.gasPrice = defaultGasPrice;
    }
    clonedTxParams.type = this.isEIP1559Compatible ? TRANSACTION_ENVELOPE_TYPES.FEE_MARKET : TRANSACTION_ENVELOPE_TYPES.LEGACY;
    clonedTxParams.chainId = this.chainConfig.chainId;
    return clonedTxParams;
  }
  async fetchEthGasPriceEstimate() {
    const gasPrice = await this.providerProxy.request({
      method: "eth_gasPrice",
      params: []
    });
    return {
      gasPrice: hexWEIToDecGWEI(gasPrice).toString()
    };
  }
  async fetchGasEstimatesViaEthFeeHistory() {
    const noOfBlocks = 10;
    const newestBlock = "latest";
    // get the 10, 50 and 95th percentile of the tip fees from the last 10 blocks
    const percentileValues = [10, 50, 95];
    const feeHistory = await this.providerProxy.request({
      method: "eth_feeHistory",
      params: [noOfBlocks, newestBlock, percentileValues]
    });

    // this is in hex wei
    const finalBaseFeePerGas = feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1];
    // this is in hex wei
    const priorityFeeCalcs = feeHistory.reward.reduce((acc, curr) => {
      return {
        slow: acc.slow.plus(new BigNumber(curr[0], 16)),
        average: acc.average.plus(new BigNumber(curr[1], 16)),
        fast: acc.fast.plus(new BigNumber(curr[2], 16))
      };
    }, {
      slow: new BigNumber(0),
      average: new BigNumber(0),
      fast: new BigNumber(0)
    });
    return {
      estimatedBaseFee: hexWEIToDecGWEI(finalBaseFeePerGas).toString(),
      high: {
        maxWaitTimeEstimate: 30000,
        minWaitTimeEstimate: 15000,
        suggestedMaxFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.fast.plus(finalBaseFeePerGas).toString(16)).toString(),
        suggestedMaxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.fast.toString(16)).toString()
      },
      medium: {
        maxWaitTimeEstimate: 45000,
        minWaitTimeEstimate: 15000,
        suggestedMaxFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.average.plus(finalBaseFeePerGas).toString(16)).toString(),
        suggestedMaxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.average.toString(16)).toString()
      },
      low: {
        maxWaitTimeEstimate: 60000,
        minWaitTimeEstimate: 15000,
        suggestedMaxFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.slow.plus(finalBaseFeePerGas).toString(16)).toString(),
        suggestedMaxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeeCalcs.slow.toString(16)).toString()
      }
    };
  }
  async getEIP1559Compatibility() {
    const latestBlock = await this.providerProxy.request({
      method: "eth_getBlockByNumber",
      params: ["latest", false]
    });
    const supportsEIP1559 = latestBlock && latestBlock.baseFeePerGas !== undefined;
    return !!supportsEIP1559;
  }
  async fetchGasFeeEstimateData() {
    if (!this.chainConfig) throw new Error("Chain config not initialized");
    const isLegacyGasAPICompatible = this.chainConfig.chainId === "0x1";
    const chainId = Number.parseInt(this.chainConfig.chainId, 16);
    let gasData;
    try {
      if (this.isEIP1559Compatible) {
        let estimates;
        try {
          if (this.API_SUPPORTED_CHAINIDS.has(this.chainConfig.chainId)) {
            estimates = await fetchEip1159GasEstimates(EIP1559APIEndpoint.replace("<chain_id>", `${chainId}`));
          } else {
            throw new Error("Chain id not supported by api");
          }
        } catch (error) {
          estimates = await this.fetchGasEstimatesViaEthFeeHistory();
        }
        gasData = {
          gasFeeEstimates: estimates,
          gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET
        };
      } else if (isLegacyGasAPICompatible) {
        const estimates = await fetchLegacyGasPriceEstimates(LegacyGasAPIEndpoint.replace("<chain_id>", `${chainId}`));
        gasData = {
          gasFeeEstimates: estimates,
          gasEstimateType: GAS_ESTIMATE_TYPES.LEGACY
        };
      } else {
        throw new Error("Main gas fee/price estimation failed. Use fallback");
      }
    } catch (e) {
      try {
        const estimates = await this.fetchEthGasPriceEstimate();
        gasData = {
          gasFeeEstimates: estimates,
          gasEstimateType: GAS_ESTIMATE_TYPES.ETH_GASPRICE
        };
      } catch (error) {
        throw new Error(`Gas fee/price estimation failed. Message: ${error.message}`);
      }
    }
    return gasData;
  }
  async getDefaultGasFees(txParams) {
    if (!this.isEIP1559Compatible && txParams.gasPrice || this.isEIP1559Compatible && txParams.maxFeePerGas && txParams.maxPriorityFeePerGas) {
      return {};
    }
    try {
      const {
        gasFeeEstimates,
        gasEstimateType
      } = await this.fetchGasFeeEstimateData();
      if (this.isEIP1559Compatible && gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) {
        const {
          medium: {
            suggestedMaxPriorityFeePerGas,
            suggestedMaxFeePerGas
          } = {}
        } = gasFeeEstimates;
        if (suggestedMaxPriorityFeePerGas && suggestedMaxFeePerGas) {
          return {
            maxFeePerGas: addHexPrefix(decGWEIToHexWEI(suggestedMaxFeePerGas)),
            maxPriorityFeePerGas: addHexPrefix(decGWEIToHexWEI(suggestedMaxPriorityFeePerGas))
          };
        }
      } else if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
        // The LEGACY type includes low, medium and high estimates of
        // gas price values.
        return {
          gasPrice: addHexPrefix(decGWEIToHexWEI(gasFeeEstimates.medium))
        };
      } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
        // The ETH_GASPRICE type just includes a single gas price property,
        // which we can assume was retrieved from eth_gasPrice
        return {
          gasPrice: addHexPrefix(decGWEIToHexWEI(gasFeeEstimates.gasPrice))
        };
      }
    } catch (error) {
      log.error(error);
    }
    const {
      gasPrice
    } = await this.fetchEthGasPriceEstimate();
    return {
      gasPrice: addHexPrefix(decGWEIToHexWEI(gasPrice))
    };
  }
  async estimateTxGas(txMeta) {
    const txParams = _objectSpread({}, txMeta);

    // `eth_estimateGas` can fail if the user has insufficient balance for the
    // value being sent, or for the gas cost. We don't want to check their
    // balance here, we just want the gas estimate. The gas price is removed
    // to skip those balance checks. We check balance elsewhere. We also delete
    // maxFeePerGas and maxPriorityFeePerGas to support EIP-1559 txs.
    delete txParams.gasPrice;
    delete txParams.maxFeePerGas;
    delete txParams.maxPriorityFeePerGas;
    const gas = await this.providerProxy.request({
      method: "eth_estimateGas",
      params: [txParams]
    });
    return gas;
  }
  async analyzeGasUsage(txMeta) {
    const block = await this.providerProxy.request({
      method: "eth_getBlockByNumber",
      params: ["latest", false]
    });
    // fallback to block gasLimit
    const blockGasLimitBN = hexToBn(block.gasLimit);
    const saferGasLimitBN = BnMultiplyByFraction(blockGasLimitBN, 19, 20);
    let estimatedGasHex = bnToHex(saferGasLimitBN);
    try {
      estimatedGasHex = await this.estimateTxGas(txMeta);
    } catch (error) {
      log.warn(error);
    }
    return {
      blockGasLimit: block.gasLimit,
      estimatedGasHex
    };
  }
  addGasBuffer(initialGasLimitHex, blockGasLimitHex) {
    let multiplier = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1.5;
    const initialGasLimitBn = hexToBn(initialGasLimitHex);
    const blockGasLimitBn = hexToBn(blockGasLimitHex);
    const upperGasLimitBn = blockGasLimitBn.muln(0.9);
    const bufferedGasLimitBn = initialGasLimitBn.muln(multiplier);

    // if initialGasLimit is above blockGasLimit, dont modify it
    if (initialGasLimitBn.gt(upperGasLimitBn)) return bnToHex(initialGasLimitBn);
    // if bufferedGasLimit is below blockGasLimit, use bufferedGasLimit
    if (bufferedGasLimitBn.lt(upperGasLimitBn)) return bnToHex(bufferedGasLimitBn);
    // otherwise use blockGasLimit
    return bnToHex(upperGasLimitBn);
  }
  async determineTransactionCategory(txParameters) {
    const {
      data,
      to
    } = txParameters;
    let code = "";
    let txCategory;
    if (data && !to) {
      txCategory = TRANSACTION_TYPES.DEPLOY_CONTRACT;
    } else {
      try {
        code = await this.providerProxy.request({
          method: "eth_getCode",
          params: [to, "latest"]
        });
      } catch (error) {
        log.warn(error);
      }
      const codeIsEmpty = !code || code === "0x" || code === "0x0";
      txCategory = codeIsEmpty ? TRANSACTION_TYPES.SENT_ETHER : TRANSACTION_TYPES.CONTRACT_INTERACTION;
    }
    return {
      transactionCategory: txCategory,
      code
    };
  }
  async getDefaultGasLimit(txParams) {
    const {
      transactionCategory
    } = await this.determineTransactionCategory(_objectSpread({}, txParams));
    if (txParams.gas) {
      return txParams.gas;
    }
    if (txParams.to && transactionCategory === TRANSACTION_TYPES.SENT_ETHER) {
      // if there's data in the params, but there's no contract code, it's not a valid transaction
      if (txParams.data) {
        throw Error("TxGasUtil - Trying to call a function on a non-contract address");
      }
      const TWENTY_ONE_THOUSAND = 21000;

      // This is a standard ether simple send, gas requirement is exactly 21k
      return addHexPrefix(TWENTY_ONE_THOUSAND.toString(16));
    }
    const {
      blockGasLimit,
      estimatedGasHex
    } = await this.analyzeGasUsage(txParams);

    // add additional gas buffer to our estimation for safety
    const gasLimit = this.addGasBuffer(addHexPrefix(estimatedGasHex), blockGasLimit);
    return gasLimit;
  }
}

async function signTx$1(txParams, privKey, txFormatter) {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const common = await txFormatter.getCommonConfiguration();
  const unsignedEthTx = TransactionFactory.fromTxData(finalTxParams, {
    common
  });
  const signedTx = unsignedEthTx.sign(Buffer.from(privKey, "hex")).serialize();
  return Buffer.from(signedTx);
}
function getProviderHandlers$1(_ref) {
  let {
    txFormatter,
    privKey,
    getProviderEngineProxy
  } = _ref;
  return {
    getAccounts: async _ => [`0x${Buffer.from(privateToAddress(Buffer.from(privKey, "hex"))).toString("hex")}`],
    getPrivateKey: async _ => privKey,
    processTransaction: async (txParams, _) => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      if (txParams.input && !txParams.data) txParams.data = txParams.input;
      const signedTx = await signTx$1(txParams, privKey, txFormatter);
      const txHash = await providerEngineProxy.request({
        method: "eth_sendRawTransaction",
        params: ["0x".concat(signedTx.toString("hex"))]
      });
      return txHash;
    },
    processSignTransaction: async (txParams, _) => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      if (txParams.input && !txParams.data) txParams.data = txParams.input;
      const signedTx = await signTx$1(txParams, privKey, txFormatter);
      return `0x${signedTx.toString("hex")}`;
    },
    processEthSignMessage: async (msgParams, _) => {
      const rawMessageSig = signMessage$1(privKey, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams, _) => {
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const sig = personalSign$1({
        privateKey: privKeyBuffer,
        data: msgParams.data
      });
      return sig;
    },
    processTypedMessage: async (msgParams, _) => {
      log.debug("processTypedMessage", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      const params = _objectSpread(_objectSpread({}, msgParams), {}, {
        version: SignTypedDataVersion.V1
      });
      validateTypedMessageParams(params, finalChainId);
      const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      const sig = signTypedData$1({
        privateKey: privKeyBuffer,
        data,
        version: SignTypedDataVersion.V1
      });
      return sig;
    },
    processTypedMessageV3: async (msgParams, _) => {
      log.debug("processTypedMessageV3", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData$1({
        privateKey: privKeyBuffer,
        data,
        version: SignTypedDataVersion.V3
      });
      return sig;
    },
    processTypedMessageV4: async (msgParams, _) => {
      log.debug("processTypedMessageV4", msgParams);
      const privKeyBuffer = Buffer.from(privKey, "hex");
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData$1({
        privateKey: privKeyBuffer,
        data,
        version: SignTypedDataVersion.V4
      });
      return sig;
    },
    processEncryptionPublicKey: async (address, _) => {
      log.info("processEncryptionPublicKey", address);
      return getEncryptionPublicKey(privKey);
    },
    processDecryptMessage: (msgParams, _) => {
      log.info("processDecryptMessage", msgParams);
      const stripped = stripHexPrefix(msgParams.data);
      const buff = Buffer.from(stripped, "hex");
      const decrypted = decrypt({
        encryptedData: JSON.parse(buff.toString("utf8")),
        privateKey: privKey
      });
      return decrypted;
    }
  };
}

var _class$1;
class EthereumPrivateKeyProvider extends BaseProvider {
  constructor(_ref) {
    let {
      config,
      state
    } = _ref;
    super({
      config: {
        chainConfig: _objectSpread(_objectSpread({}, config.chainConfig), {}, {
          chainNamespace: CHAIN_NAMESPACES.EIP155
        })
      },
      state
    });
  }
  async enable() {
    if (!this.state.privateKey) throw providerErrors.custom({
      message: "Private key is not found in state, plz pass it in constructor state param",
      code: 4902
    });
    await this.setupProvider(this.state.privateKey);
    return this._providerEngineProxy.request({
      method: "eth_accounts"
    });
  }
  async setupProvider(privKey) {
    const txFormatter = new TransactionFormatter({
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this)
    });
    const providerHandlers = getProviderHandlers$1({
      txFormatter,
      privKey,
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this)
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getChainSwitchMiddleware();
    const engine = new JRPCEngine();
    // Not a partial anymore because of checks in ctor
    const {
      networkMiddleware
    } = createJsonRpcClient(this.config.chainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(this.getAccountMiddleware());
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await txFormatter.init();
    await this.lookupNetwork();
  }
  async updateAccount(params) {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const existingKey = await this._providerEngineProxy.request({
      method: "eth_private_key"
    });
    if (existingKey !== params.privateKey) {
      await this.setupProvider(params.privateKey);
      this.emit("accountsChanged", {
        accounts: await this._providerEngineProxy.request({
          method: "eth_accounts"
        })
      });
    }
  }
  async switchChain(params) {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading"
    });
    this.configure({
      chainConfig
    });
    const privKey = await this._providerEngineProxy.request({
      method: "eth_private_key"
    });
    await this.setupProvider(privKey);
  }
  async lookupNetwork() {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const {
      chainId
    } = this.config.chainConfig;
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request({
      method: "net_version",
      params: []
    });
    if (parseInt(chainId, 16) !== parseInt(network, 10)) throw providerErrors.chainDisconnected(`Invalid network, net_version is: ${network}`);
    if (this.state.chainId !== chainId) {
      this.emit("chainChanged", chainId);
      this.emit("connect", {
        chainId
      });
    }
    this.update({
      chainId
    });
    return network;
  }
  getChainSwitchMiddleware() {
    const chainSwitchHandlers = {
      addChain: async params => {
        const {
          chainId,
          chainName,
          rpcUrls,
          blockExplorerUrls,
          nativeCurrency
        } = params;
        this.addChain({
          chainNamespace: CHAIN_NAMESPACES.EIP155,
          chainId,
          ticker: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.symbol) || "ETH",
          tickerName: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.name) || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: (blockExplorerUrls === null || blockExplorerUrls === void 0 ? void 0 : blockExplorerUrls[0]) || "",
          decimals: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.decimals) || 18
        });
      },
      switchChain: async params => {
        const {
          chainId
        } = params;
        await this.switchChain({
          chainId
        });
      }
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }
  getAccountMiddleware() {
    const accountHandlers = {
      updatePrivatekey: async params => {
        const {
          privateKey
        } = params;
        await this.updateAccount({
          privateKey
        });
      }
    };
    return createAccountMiddleware(accountHandlers);
  }
}
_class$1 = EthereumPrivateKeyProvider;
_defineProperty(EthereumPrivateKeyProvider, "getProviderInstance", async params => {
  const providerFactory = new _class$1({
    config: {
      chainConfig: params.chainConfig
    }
  });
  await providerFactory.setupProvider(params.privKey);
  return providerFactory;
});

async function signTx(txParams, sign, txFormatter) {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const common = await txFormatter.getCommonConfiguration();
  const unsignedEthTx = TransactionFactory.fromTxData(finalTxParams, {
    common
  });

  // Hack for the constellation that we have got a legacy tx after spuriousDragon with a non-EIP155 conforming signature
  // and want to recreate a signature (where EIP155 should be applied)
  // Leaving this hack lets the legacy.spec.ts -> sign(), verifySignature() test fail
  // 2021-06-23
  let hackApplied = false;
  if (unsignedEthTx.type === 0 && unsignedEthTx.common.gteHardfork(Hardfork.SpuriousDragon) && !unsignedEthTx.supports(Capability.EIP155ReplayProtection)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    unsignedEthTx.activeCapabilities.push(Capability.EIP155ReplayProtection);
    hackApplied = true;
  }
  const msgHash = unsignedEthTx.getHashedMessageToSign();
  const rawMessage = unsignedEthTx.getMessageToSign();
  const {
    v,
    r,
    s
  } = await sign(Buffer.from(msgHash), Buffer.from(rawMessage));
  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = unsignedEthTx._processSignature(BigInt(modifiedV), r, s);

  // Hack part 2
  if (hackApplied) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = unsignedEthTx.activeCapabilities.indexOf(Capability.EIP155ReplayProtection);
    if (index > -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsignedEthTx.activeCapabilities.splice(index, 1);
    }
  }
  return tx.serialize();
}
async function signMessage(sign, data) {
  const message = stripHexPrefix(data);
  const msgSig = await sign(Buffer.from(message, "hex"));
  let modifiedV = msgSig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const rawMsgSig = concatSig(Buffer.from(intToBytes(modifiedV)), msgSig.r, msgSig.s);
  return rawMsgSig;
}
function legacyToBuffer(value) {
  return typeof value === "string" && !isHexString(value) ? Buffer.from(value) : toBytes(value);
}
async function personalSign(sign, data) {
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const message = legacyToBuffer(data);
  const msgHash = hashPersonalMessage(message);
  const prefix = Buffer.from(`\u0019Ethereum Signed Message:\n${message.length}`, "utf-8");
  const sig = await sign(Buffer.from(msgHash), Buffer.concat([prefix, message]));
  let modifiedV = sig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const serialized = concatSig(Buffer.from(toBytes(modifiedV)), sig.r, sig.s);
  return serialized;
}
function validateVersion(version, allowedVersions) {
  if (!Object.keys(SignTypedDataVersion).includes(version)) {
    throw new Error(`Invalid version: '${version}'`);
  } else if (allowedVersions && !allowedVersions.includes(version)) {
    throw new Error(`SignTypedDataVersion not allowed: '${version}'. Allowed versions are: ${allowedVersions.join(", ")}`);
  }
}
async function signTypedData(sign, data, version) {
  validateVersion(version, undefined); // Note: this is intentional;
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const messageHash = version === SignTypedDataVersion.V1 ? Buffer.from(stripHexPrefix(typedSignatureHash(data)), "hex") : TypedDataUtils.eip712Hash(data, version);
  const {
    v,
    r,
    s
  } = await sign(Buffer.from(messageHash.buffer));
  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  return concatSig(Buffer.from(toBytes(modifiedV)), r, s);
}
function getProviderHandlers(_ref) {
  let {
    txFormatter,
    sign,
    getPublic,
    getProviderEngineProxy
  } = _ref;
  return {
    getAccounts: async _ => {
      const pubKey = await getPublic();
      return [`0x${Buffer.from(publicToAddress(pubKey)).toString("hex")}`];
    },
    getPrivateKey: async _ => {
      throw providerErrors.custom({
        message: "Provider cannot return private key",
        code: 4902
      });
    },
    processTransaction: async (txParams, _) => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      const txHash = await providerEngineProxy.request({
        method: "eth_sendRawTransaction",
        params: ["0x".concat(serializedTxn.toString("hex"))]
      });
      return txHash;
    },
    processSignTransaction: async (txParams, _) => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      return Buffer.from(serializedTxn).toString("hex");
    },
    processEthSignMessage: async (msgParams, _) => {
      const rawMessageSig = signMessage(sign, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams, _) => {
      const sig = personalSign(sign, msgParams.data);
      return sig;
    },
    processTypedMessage: async (msgParams, _) => {
      log.debug("processTypedMessage", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      const params = _objectSpread(_objectSpread({}, msgParams), {}, {
        version: SignTypedDataVersion.V1
      });
      validateTypedMessageParams(params, finalChainId);
      const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V1);
      return sig;
    },
    processTypedMessageV3: async (msgParams, _) => {
      log.debug("processTypedMessageV3", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V3);
      return sig;
    },
    processTypedMessageV4: async (msgParams, _) => {
      log.debug("processTypedMessageV4", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy) throw providerErrors.custom({
        message: "Provider is not initialized",
        code: 4902
      });
      const chainId = await providerEngineProxy.request({
        method: "eth_chainId"
      });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V4);
      return sig;
    },
    processEncryptionPublicKey: async (address, _) => {
      log.info("processEncryptionPublicKey", address);
      throw providerErrors.custom({
        message: "Provider cannot encryption public key",
        code: 4902
      });
    },
    processDecryptMessage: (msgParams, _) => {
      log.info("processDecryptMessage", msgParams);
      throw providerErrors.custom({
        message: "Provider cannot decrypt",
        code: 4902
      });
    }
  };
}

var _class;
class EthereumSigningProvider extends BaseProvider {
  constructor(_ref) {
    let {
      config,
      state
    } = _ref;
    super({
      config: {
        chainConfig: _objectSpread(_objectSpread({}, config.chainConfig), {}, {
          chainNamespace: CHAIN_NAMESPACES.EIP155
        })
      },
      state
    });
  }
  async enable() {
    if (!this.state.privateKey) throw providerErrors.custom({
      message: "Private key is not found in state, plz pass it in constructor state param",
      code: 4902
    });
    await this.setupProvider(this.state.signMethods);
    return this._providerEngineProxy.request({
      method: "eth_accounts"
    });
  }
  async setupProvider(_ref2) {
    let {
      sign,
      getPublic
    } = _ref2;
    const txFormatter = new TransactionFormatter({
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this)
    });
    const providerHandlers = getProviderHandlers({
      txFormatter,
      sign,
      getPublic,
      getProviderEngineProxy: this.getProviderEngineProxy.bind(this)
    });
    const ethMiddleware = createEthMiddleware(providerHandlers);
    const chainSwitchMiddleware = this.getChainSwitchMiddleware();
    const engine = new JRPCEngine();
    // Not a partial anymore because of checks in ctor
    const {
      networkMiddleware
    } = createJsonRpcClient(this.config.chainConfig);
    engine.push(ethMiddleware);
    engine.push(chainSwitchMiddleware);
    engine.push(this.getAccountMiddleware());
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    await txFormatter.init();
    await this.lookupNetwork();
  }
  async updateAccount(params) {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const currentSignMethods = this.state.signMethods;
    if (!currentSignMethods) {
      throw providerErrors.custom({
        message: "signing methods are unavailable ",
        code: 4092
      });
    }
    const currentPubKey = (await currentSignMethods.getPublic()).toString("hex");
    const updatePubKey = (await params.signMethods.getPublic()).toString("hex");
    if (currentPubKey !== updatePubKey) {
      await this.setupProvider(params.signMethods);
      this._providerEngineProxy.emit("accountsChanged", {
        accounts: await this._providerEngineProxy.request({
          method: "eth_accounts"
        })
      });
    }
  }
  async switchChain(params) {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const chainConfig = this.getChainConfig(params.chainId);
    this.update({
      chainId: "loading"
    });
    this.configure({
      chainConfig
    });
    if (!this.state.signMethods) {
      throw providerErrors.custom({
        message: "sign methods are undefined",
        code: 4902
      });
    }
    await this.setupProvider(this.state.signMethods);
  }
  async lookupNetwork() {
    if (!this._providerEngineProxy) throw providerErrors.custom({
      message: "Provider is not initialized",
      code: 4902
    });
    const {
      chainId
    } = this.config.chainConfig;
    if (!chainId) throw rpcErrors.invalidParams("chainId is required while lookupNetwork");
    const network = await this._providerEngineProxy.request({
      method: "net_version",
      params: []
    });
    if (parseInt(chainId, 16) !== parseInt(network, 10)) throw providerErrors.chainDisconnected(`Invalid network, net_version is: ${network}`);
    if (this.state.chainId !== chainId) {
      this._providerEngineProxy.emit("chainChanged", chainId);
      this._providerEngineProxy.emit("connect", {
        chainId
      });
    }
    this.update({
      chainId
    });
    return network;
  }
  getChainSwitchMiddleware() {
    const chainSwitchHandlers = {
      addChain: async params => {
        const {
          chainId,
          chainName,
          rpcUrls,
          blockExplorerUrls,
          nativeCurrency
        } = params;
        this.addChain({
          chainNamespace: "eip155",
          chainId,
          ticker: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.symbol) || "ETH",
          tickerName: (nativeCurrency === null || nativeCurrency === void 0 ? void 0 : nativeCurrency.name) || "Ether",
          displayName: chainName,
          rpcTarget: rpcUrls[0],
          blockExplorer: (blockExplorerUrls === null || blockExplorerUrls === void 0 ? void 0 : blockExplorerUrls[0]) || ""
        });
      },
      switchChain: async params => {
        const {
          chainId
        } = params;
        await this.switchChain({
          chainId
        });
      }
    };
    const chainSwitchMiddleware = createChainSwitchMiddleware(chainSwitchHandlers);
    return chainSwitchMiddleware;
  }
  getAccountMiddleware() {
    const accountHandlers = {
      updateSignMethods: async params => {
        await this.updateAccount(params);
      }
    };
    return createAccountMiddleware(accountHandlers);
  }
}
_class = EthereumSigningProvider;
_defineProperty(EthereumSigningProvider, "getProviderInstance", async params => {
  const providerFactory = new _class({
    config: {
      chainConfig: params.chainConfig
    }
  });
  await providerFactory.setupProvider(params.signMethods);
  return providerFactory;
});

export { EthereumPrivateKeyProvider, EthereumSigningProvider, TransactionFormatter, WalletConnectV2Provider, getProviderHandlers$1 as getProviderHandlers };
//# sourceMappingURL=ethereumProvider.esm.js.map