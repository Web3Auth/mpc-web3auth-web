import _defineProperty from '@babel/runtime/helpers/defineProperty';
import _objectSpread from '@babel/runtime/helpers/objectSpread2';
import { SafeEventEmitter } from '@toruslabs/openlogin-jrpc';
import { OPENLOGIN_NETWORK } from '@toruslabs/openlogin-utils';
export { OPENLOGIN_NETWORK } from '@toruslabs/openlogin-utils';
import { CustomError } from 'ts-custom-error';
import { post } from '@toruslabs/http-helpers';
import { jwtDecode } from 'jwt-decode';
import loglevel from 'loglevel';

const CHAIN_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
  OTHER: "other"
};
// eip155 for all evm chains

const ADAPTER_NAMESPACES = {
  EIP155: "eip155",
  SOLANA: "solana",
  XRPL: "xrpl",
  MULTICHAIN: "multichain"
};
// eip155 for all evm chains

const getDefaultNetworkId = chainNamespace => {
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return 1;
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return 1;
  }
  throw new Error(`Chain namespace ${chainNamespace} is not supported`);
};
const getEvmChainConfig = chainId => {
  const chainNamespace = CHAIN_NAMESPACES.EIP155;
  if (chainId === 1) {
    return {
      chainNamespace,
      chainId: "0x1",
      rpcTarget: `https://rpc.ankr.com/eth`,
      displayName: "Ethereum Mainnet",
      blockExplorer: "https://etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18
    };
  }
  if (chainId === 5) {
    return {
      chainNamespace,
      chainId: "0x5",
      rpcTarget: `https://rpc.ankr.com/eth_goerli`,
      displayName: "Goerli Testnet",
      blockExplorer: "https://goerli.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18
    };
  }
  if (chainId === 11155111) {
    return {
      chainNamespace,
      chainId: "0xaa36a7",
      rpcTarget: `https://rpc.ankr.com/eth_sepolia`,
      displayName: "Sepolia Testnet",
      blockExplorer: "https://sepolia.etherscan.io/",
      ticker: "ETH",
      tickerName: "Ethereum",
      decimals: 18
    };
  }
  if (chainId === 137) {
    return {
      chainNamespace,
      chainId: "0x89",
      rpcTarget: "https://rpc.ankr.com/polygon",
      displayName: "Polygon Mainnet",
      blockExplorer: "https://polygonscan.com",
      ticker: "MATIC",
      tickerName: "Polygon"
    };
  }
  if (chainId === 80001) {
    return {
      chainNamespace,
      chainId: "0x13881",
      rpcTarget: "https://rpc.ankr.com/polygon_mumbai",
      displayName: "Polygon Mumbai Testnet",
      blockExplorer: "https://mumbai.polygonscan.com/",
      ticker: "MATIC",
      tickerName: "Polygon",
      decimals: 18
    };
  }
  if (chainId === 56) {
    return {
      chainNamespace,
      chainId: "0x38",
      rpcTarget: "https://rpc.ankr.com/bsc",
      displayName: "Binance SmartChain Mainnet",
      blockExplorer: "https://bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18
    };
  }
  if (chainId === 97) {
    return {
      chainNamespace,
      chainId: "0x61",
      rpcTarget: "https://rpc.ankr.com/bsc_testnet_chapel",
      displayName: "Binance SmartChain Testnet",
      blockExplorer: "https://testnet.bscscan.com",
      ticker: "BNB",
      tickerName: "Binance SmartChain",
      decimals: 18
    };
  }
  if (chainId === 25) {
    return {
      chainNamespace,
      chainId: "0x19",
      rpcTarget: "https://rpc.cronos.org",
      displayName: "Cronos Mainnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos"
    };
  }
  if (chainId === 338) {
    return {
      chainNamespace,
      chainId: "0x152",
      rpcTarget: "https://rpc-t3.cronos.org/",
      displayName: "Cronos Testnet",
      blockExplorer: "https://cronoscan.com/",
      ticker: "CRO",
      tickerName: "Cronos",
      decimals: 18
    };
  }
  if (chainId === 8217) {
    return {
      chainNamespace,
      chainId: "0x2019",
      rpcTarget: "https://public-node-api.klaytnapi.com/v1/cypress",
      displayName: "Klaytn Mainnet",
      blockExplorer: "https://scope.klaytn.com",
      ticker: "KLAY",
      tickerName: "Klaytn",
      decimals: 18
    };
  }
  return null;
};
const getSolanaChainConfig = chainId => {
  const chainNamespace = CHAIN_NAMESPACES.SOLANA;
  if (chainId === 1) {
    return {
      chainNamespace,
      chainId: "0x1",
      rpcTarget: "https://rpc.ankr.com/solana",
      displayName: "Solana Mainnet",
      blockExplorer: "https://explorer.solana.com",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9
    };
  } else if (chainId === 2) {
    return {
      chainNamespace,
      chainId: "0x2",
      rpcTarget: "https://api.testnet.solana.com",
      displayName: "Solana Testnet",
      blockExplorer: "https://explorer.solana.com?cluster=testnet",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9
    };
  } else if (chainId === 3) {
    return {
      chainNamespace,
      chainId: "0x3",
      rpcTarget: "https://api.devnet.solana.com",
      displayName: "Solana Devnet",
      blockExplorer: "https://explorer.solana.com?cluster=devnet",
      ticker: "SOL",
      tickerName: "Solana",
      decimals: 9
    };
  }
  return null;
};
const getChainConfig = (chainNamespace, chainId) => {
  if (chainNamespace === CHAIN_NAMESPACES.OTHER) return null;
  const finalChainId = chainId ? typeof chainId === "number" ? chainId : parseInt(chainId, 16) : getDefaultNetworkId(chainNamespace);
  if (chainNamespace === CHAIN_NAMESPACES.EIP155) {
    return getEvmChainConfig(finalChainId);
  } else if (chainNamespace === CHAIN_NAMESPACES.SOLANA) {
    return getSolanaChainConfig(finalChainId);
  }
  return null;
};

// @flow

class Web3AuthError extends CustomError {
  constructor(code, message) {
    // takes care of stack and proto
    super(message);
    _defineProperty(this, "code", void 0);
    _defineProperty(this, "message", void 0);
    this.code = code;
    this.message = message || "";
    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", {
      value: "Web3AuthError"
    });
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message
    };
  }
  toString() {
    return JSON.stringify(this.toJSON());
  }
}
class WalletInitializationError extends Web3AuthError {
  constructor(code, message) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", {
      value: "WalletInitializationError"
    });
  }
  static fromCode(code) {
    let extraMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    return new WalletInitializationError(code, `${WalletInitializationError.messages[code]}, ${extraMessage}`);
  }

  // Custom methods
  static notFound() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5001, extraMessage);
  }
  static notInstalled() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5002, extraMessage);
  }
  static notReady() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5003, extraMessage);
  }
  static windowBlocked() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5004, extraMessage);
  }
  static windowClosed() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5005, extraMessage);
  }
  static incompatibleChainNameSpace() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5006, extraMessage);
  }
  static duplicateAdapterError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5007, extraMessage);
  }
  static invalidProviderConfigError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5008, extraMessage);
  }
  static providerNotReadyError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5009, extraMessage);
  }
  static rpcConnectionError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5010, extraMessage);
  }
  static invalidParams() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5011, extraMessage);
  }
  static invalidNetwork() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletInitializationError.fromCode(5013, extraMessage);
  }
}

/**
 * wallet login errors
 */
_defineProperty(WalletInitializationError, "messages", {
  5000: "Custom",
  5001: "Wallet is not found",
  5002: "Wallet is not installed",
  5003: "Wallet is not ready yet",
  5004: "Wallet window is blocked",
  5005: "Wallet window has been closed by the user",
  5006: "Incompatible chain namespace provided",
  5007: "Adapter has already been included",
  5008: "Invalid provider Config",
  5009: "Provider is not ready yet",
  5010: "Failed to connect with rpc url",
  5011: "Invalid params passed in",
  5013: "Invalid network provided"
});
class WalletLoginError extends Web3AuthError {
  constructor(code, message) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", {
      value: "WalletLoginError"
    });
  }
  static fromCode(code) {
    let extraMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    return new WalletLoginError(code, `${WalletLoginError.messages[code]}. ${extraMessage}`);
  }
  static connectionError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5111, extraMessage);
  }
  static disconnectionError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5112, extraMessage);
  }
  static notConnectedError() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5113, extraMessage);
  }
  static popupClosed() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5114, extraMessage);
  }
  static mfaEnabled() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5115, extraMessage);
  }
  static chainConfigNotAdded() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5116, extraMessage);
  }
  static unsupportedOperation() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5117, extraMessage);
  }
  static coreKitKeyNotFound() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5118, extraMessage);
  }
  static userNotLoggedIn() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletLoginError.fromCode(5119, extraMessage);
  }
}
_defineProperty(WalletLoginError, "messages", {
  5000: "Custom",
  5111: "Failed to connect with wallet",
  5112: "Failed to disconnect from wallet",
  5113: "Wallet is not connected",
  5114: "Wallet popup has been closed by the user",
  5115: "User has already enabled mfa, please use the @web3auth-mpc/web3auth-web sdk for login with mfa",
  5116: "Chain config has not been added. Please add the chain config before calling switchChain",
  5117: "Unsupported operation",
  5118: "useCoreKitKey flag is enabled but coreKitKey is not available",
  5119: "User not logged in."
});
class WalletOperationsError extends Web3AuthError {
  constructor(code, message) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", {
      value: "WalletOperationsError"
    });
  }
  static fromCode(code) {
    let extraMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    return new WalletOperationsError(code, `${WalletOperationsError.messages[code]}, ${extraMessage}`);
  }

  // Custom methods
  static chainIDNotAllowed() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5201, extraMessage);
  }
  static operationNotAllowed() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5202, extraMessage);
  }
  static chainNamespaceNotAllowed() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5203, extraMessage);
  }
}
_defineProperty(WalletOperationsError, "messages", {
  5000: "Custom",
  5201: "Provided chainId is not allowed",
  5202: "This operation is not allowed"
});
class WalletProviderError extends Web3AuthError {
  constructor(code, message) {
    // takes care of stack and proto
    super(code, message);

    // Set name explicitly as minification can mangle class names
    Object.defineProperty(this, "name", {
      value: "WalletProviderError"
    });
  }
  static fromCode(code) {
    let extraMessage = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    return new WalletOperationsError(code, `${WalletProviderError.messages[code]}, ${extraMessage}`);
  }

  // Custom methods
  static invalidRequestArgs() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5301, extraMessage);
  }
  static invalidRequestMethod() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5302, extraMessage);
  }
  static invalidRequestParams() {
    let extraMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
    return WalletOperationsError.fromCode(5303, extraMessage);
  }
}
_defineProperty(WalletProviderError, "messages", {
  5000: "Custom",
  5301: "Expected a single, non-array, object argument.",
  5302: "'args.method' must be a non-empty string.",
  5303: "'args.params' must be an object or array if provided."
});

const MULTI_CHAIN_ADAPTERS = {
  OPENLOGIN: "openlogin",
  WALLET_CONNECT_V2: "wallet-connect-v2"
};
const SOLANA_ADAPTERS = _objectSpread({
  TORUS_SOLANA: "torus-solana",
  PHANTOM: "phantom",
  SOLFLARE: "solflare",
  SLOPE: "slope"
}, MULTI_CHAIN_ADAPTERS);
const EVM_ADAPTERS = _objectSpread({
  TORUS_EVM: "torus-evm",
  METAMASK: "metamask",
  COINBASE: "coinbase"
}, MULTI_CHAIN_ADAPTERS);
const WALLET_ADAPTERS = _objectSpread(_objectSpread({}, EVM_ADAPTERS), SOLANA_ADAPTERS);
const ADAPTER_NAMES = {
  [MULTI_CHAIN_ADAPTERS.OPENLOGIN]: "OpenLogin",
  [MULTI_CHAIN_ADAPTERS.WALLET_CONNECT_V2]: "Wallet Connect v2",
  [SOLANA_ADAPTERS.TORUS_SOLANA]: "Torus",
  [SOLANA_ADAPTERS.PHANTOM]: "Phantom",
  [SOLANA_ADAPTERS.SOLFLARE]: "Solflare",
  [SOLANA_ADAPTERS.SLOPE]: "Slope",
  [EVM_ADAPTERS.TORUS_EVM]: "Torus",
  [EVM_ADAPTERS.METAMASK]: "Metamask",
  [EVM_ADAPTERS.COINBASE]: "Coinbase"
};

const WEB3AUTH_NETWORK = OPENLOGIN_NETWORK;
const ADAPTER_CATEGORY = {
  EXTERNAL: "external",
  IN_APP: "in_app"
};
const ADAPTER_STATUS = {
  NOT_READY: "not_ready",
  READY: "ready",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
  ERRORED: "errored"
};
const ADAPTER_EVENTS = _objectSpread(_objectSpread({}, ADAPTER_STATUS), {}, {
  ADAPTER_DATA_UPDATED: "adapter_data_updated",
  CACHE_CLEAR: "cache_clear"
});
class BaseAdapter extends SafeEventEmitter {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super();
    _defineProperty(this, "adapterData", {});
    _defineProperty(this, "sessionTime", 86400);
    _defineProperty(this, "clientId", void 0);
    _defineProperty(this, "web3AuthNetwork", OPENLOGIN_NETWORK.MAINNET);
    _defineProperty(this, "useCoreKitKey", undefined);
    _defineProperty(this, "rehydrated", false);
    // should be added in constructor or from setAdapterSettings function
    // before calling init function.
    _defineProperty(this, "chainConfig", null);
    _defineProperty(this, "knownChainConfigs", {});
    _defineProperty(this, "adapterNamespace", void 0);
    _defineProperty(this, "currentChainNamespace", void 0);
    _defineProperty(this, "type", void 0);
    _defineProperty(this, "name", void 0);
    _defineProperty(this, "status", void 0);
    this.setAdapterSettings(options);
  }
  get chainConfigProxy() {
    return this.chainConfig ? _objectSpread({}, this.chainConfig) : null;
  }
  get connnected() {
    return this.status === ADAPTER_STATUS.CONNECTED;
  }
  setAdapterSettings(options) {
    if (this.status === ADAPTER_STATUS.READY) return;
    if (options !== null && options !== void 0 && options.sessionTime) {
      this.sessionTime = options.sessionTime;
    }
    if (options !== null && options !== void 0 && options.clientId) {
      this.clientId = options.clientId;
    }
    if (options !== null && options !== void 0 && options.web3AuthNetwork) {
      this.web3AuthNetwork = options.web3AuthNetwork;
    }
    if ((options === null || options === void 0 ? void 0 : options.useCoreKitKey) !== undefined) {
      this.useCoreKitKey = options.useCoreKitKey;
    }
    const customChainConfig = options.chainConfig;
    if (customChainConfig) {
      if (!customChainConfig.chainNamespace) throw WalletInitializationError.notReady("ChainNamespace is required while setting chainConfig");
      this.currentChainNamespace = customChainConfig.chainNamespace;
      // chainId is optional in this function.
      // we go with mainnet chainId by default.
      const defaultChainConfig = getChainConfig(customChainConfig.chainNamespace, customChainConfig.chainId);
      // NOTE: It is being forced casted to CustomChainConfig to handle OTHER Chainnamespace
      // where chainConfig is not required.
      const finalChainConfig = _objectSpread(_objectSpread({}, defaultChainConfig || {}), customChainConfig);
      this.chainConfig = finalChainConfig;
      this.addChainConfig(finalChainConfig);
    }
  }
  checkConnectionRequirements() {
    // we reconnect without killing existing wallet connect session on calling connect again.
    if (this.name === WALLET_ADAPTERS.WALLET_CONNECT_V2 && this.status === ADAPTER_STATUS.CONNECTING) return;else if (this.status === ADAPTER_STATUS.CONNECTING) throw WalletInitializationError.notReady("Already connecting");
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletLoginError.connectionError("Already connected");
    if (this.status !== ADAPTER_STATUS.READY) throw WalletLoginError.connectionError("Wallet adapter is not ready yet, Please wait for init function to resolve before calling connect/connectTo function");
  }
  checkInitializationRequirements() {
    if (!this.clientId) throw WalletInitializationError.invalidParams("Please initialize Web3Auth with a valid clientId in constructor");
    if (!this.chainConfig) throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    if (!this.chainConfig.rpcTarget && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("rpcTarget is required in chainConfig");
    }
    if (!this.chainConfig.chainId && this.chainConfig.chainNamespace !== CHAIN_NAMESPACES.OTHER) {
      throw WalletInitializationError.invalidParams("chainID is required in chainConfig");
    }
    if (this.status === ADAPTER_STATUS.NOT_READY) return;
    if (this.status === ADAPTER_STATUS.CONNECTED) throw WalletInitializationError.notReady("Already connected");
    if (this.status === ADAPTER_STATUS.READY) throw WalletInitializationError.notReady("Adapter is already initialized");
  }
  checkDisconnectionRequirements() {
    if (this.status !== ADAPTER_STATUS.CONNECTED) throw WalletLoginError.disconnectionError("Not connected with wallet");
  }
  checkAddChainRequirements(chainConfig) {
    let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (this.currentChainNamespace !== chainConfig.chainNamespace) {
      throw WalletOperationsError.chainNamespaceNotAllowed("This adapter doesn't support this chainNamespace");
    }
  }
  checkSwitchChainRequirements(_ref) {
    let {
      chainId
    } = _ref;
    let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    if (!init && !this.provider) throw WalletLoginError.notConnectedError("Not connected with wallet.");
    if (!this.knownChainConfigs[chainId]) throw WalletLoginError.chainConfigNotAdded("Invalid chainId");
  }
  updateAdapterData(data) {
    this.adapterData = data;
    this.emit(ADAPTER_EVENTS.ADAPTER_DATA_UPDATED, {
      adapterName: this.name,
      data
    });
  }
  addChainConfig(chainConfig) {
    const currentConfig = this.knownChainConfigs[chainConfig.chainId];
    this.knownChainConfigs[chainConfig.chainId] = _objectSpread(_objectSpread({}, currentConfig || {}), chainConfig);
  }
  getChainConfig(chainId) {
    return this.knownChainConfigs[chainId] || null;
  }
}
class BaseNetworkSwitch {}

const authServer = "https://authjs.web3auth.io";

var log = loglevel.getLogger("web3auth-logger");

function storageAvailable(type) {
  let storageExists = false;
  let storageLength = 0;
  let storage;
  try {
    storage = window[type];
    storageExists = true;
    storageLength = storage.length;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (error) {
    const _error = error;
    return !!(_error && (
    // everything except Firefox
    _error.code === 22 ||
    // Firefox
    _error.code === 1014 ||
    // test name field too, because code might not be present
    // everything except Firefox
    _error.name === "QuotaExceededError" ||
    // Firefox
    _error.name === "NS_ERROR_DOM_QUOTA_REACHED") &&
    // acknowledge QuotaExceededError only if there's something already stored
    storageExists && storageLength !== 0);
  }
}
const isHexStrict = hex => {
  return (typeof hex === "string" || typeof hex === "number") && /^(-)?0x[0-9a-f]*$/i.test(hex);
};

const checkIfTokenIsExpired = token => {
  const decoded = jwtDecode(token);
  if (!decoded.exp) {
    return true;
  }
  if (decoded.exp < Math.floor(Date.now() / 1000)) {
    return true;
  }
  return false;
};
const signChallenge = async (payload, chainNamespace) => {
  const t = chainNamespace === "solana" ? "sip99" : "eip191";
  const header = {
    t
  };
  const network = chainNamespace === "solana" ? "solana" : "ethereum";
  const data = {
    payload,
    header,
    network
  };
  const res = await post(`${authServer}/siww/get`, data);
  if (!res.success) {
    throw new Error("Failed to authenticate user, Please reach out to Web3Auth Support team");
  }
  return res.challenge;
};
const verifySignedChallenge = async (chainNamespace, signedMessage, challenge, issuer, sessionTime, clientId, web3AuthNetwork) => {
  const t = chainNamespace === "solana" ? "sip99" : "eip191";
  const sigData = {
    signature: {
      s: signedMessage,
      t
    },
    message: challenge,
    issuer,
    audience: typeof window.location !== "undefined" ? window.location.hostname : "com://reactnative",
    timeout: sessionTime
  };
  const idTokenRes = await post(`${authServer}/siww/verify`, sigData, {
    headers: {
      client_id: clientId,
      wallet_provider: issuer,
      web3auth_network: web3AuthNetwork
    }
  });
  if (!idTokenRes.success) {
    log.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
    throw new Error("Failed to authenticate user, ,message verification failed");
  }
  return idTokenRes.token;
};
const getSavedToken = (userAddress, issuer) => {
  if (storageAvailable("localStorage")) {
    return localStorage.getItem(`${userAddress.toLowerCase()}_${issuer}`);
  }
  return null;
};
const saveToken = (userAddress, issuer, token) => {
  if (storageAvailable("localStorage")) {
    return localStorage.setItem(`${userAddress.toLowerCase()}_${issuer}`, token);
  }
  return null;
};
const clearToken = (userAddress, issuer) => {
  if (storageAvailable("localStorage")) {
    return localStorage.removeItem(`${userAddress.toLowerCase()}_${issuer}`);
  }
  return null;
};

const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored"
};

export { ADAPTER_CATEGORY, ADAPTER_EVENTS, ADAPTER_NAMES, ADAPTER_NAMESPACES, ADAPTER_STATUS, BaseAdapter, BaseNetworkSwitch, CHAIN_NAMESPACES, EVM_ADAPTERS, MULTI_CHAIN_ADAPTERS, PROVIDER_EVENTS, SOLANA_ADAPTERS, WALLET_ADAPTERS, WEB3AUTH_NETWORK, WalletInitializationError, WalletLoginError, WalletOperationsError, WalletProviderError, Web3AuthError, authServer, checkIfTokenIsExpired, clearToken, getChainConfig, getEvmChainConfig, getSavedToken, getSolanaChainConfig, isHexStrict, log, saveToken, signChallenge, storageAvailable, verifySignedChallenge };
//# sourceMappingURL=base.esm.js.map