/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ADAPTER_CATEGORY: () => (/* reexport */ ADAPTER_CATEGORY),
  ADAPTER_EVENTS: () => (/* reexport */ ADAPTER_EVENTS),
  ADAPTER_NAMES: () => (/* reexport */ ADAPTER_NAMES),
  ADAPTER_NAMESPACES: () => (/* reexport */ ADAPTER_NAMESPACES),
  ADAPTER_STATUS: () => (/* reexport */ ADAPTER_STATUS),
  BaseAdapter: () => (/* reexport */ BaseAdapter),
  BaseNetworkSwitch: () => (/* reexport */ BaseNetworkSwitch),
  CHAIN_NAMESPACES: () => (/* reexport */ CHAIN_NAMESPACES),
  EVM_ADAPTERS: () => (/* reexport */ EVM_ADAPTERS),
  MULTI_CHAIN_ADAPTERS: () => (/* reexport */ MULTI_CHAIN_ADAPTERS),
  OPENLOGIN_NETWORK: () => (/* reexport */ openlogin_utils_namespaceObject.OPENLOGIN_NETWORK),
  PROVIDER_EVENTS: () => (/* reexport */ PROVIDER_EVENTS),
  SOLANA_ADAPTERS: () => (/* reexport */ SOLANA_ADAPTERS),
  WALLET_ADAPTERS: () => (/* reexport */ WALLET_ADAPTERS),
  WEB3AUTH_NETWORK: () => (/* reexport */ WEB3AUTH_NETWORK),
  WalletInitializationError: () => (/* reexport */ WalletInitializationError),
  WalletLoginError: () => (/* reexport */ WalletLoginError),
  WalletOperationsError: () => (/* reexport */ WalletOperationsError),
  WalletProviderError: () => (/* reexport */ WalletProviderError),
  Web3AuthError: () => (/* reexport */ Web3AuthError),
  authServer: () => (/* reexport */ authServer),
  checkIfTokenIsExpired: () => (/* reexport */ checkIfTokenIsExpired),
  clearToken: () => (/* reexport */ clearToken),
  getChainConfig: () => (/* reexport */ getChainConfig),
  getEvmChainConfig: () => (/* reexport */ getEvmChainConfig),
  getSavedToken: () => (/* reexport */ getSavedToken),
  getSolanaChainConfig: () => (/* reexport */ getSolanaChainConfig),
  isHexStrict: () => (/* reexport */ isHexStrict),
  log: () => (/* reexport */ loglevel),
  saveToken: () => (/* reexport */ saveToken),
  signChallenge: () => (/* reexport */ signChallenge),
  storageAvailable: () => (/* reexport */ storageAvailable),
  verifySignedChallenge: () => (/* reexport */ verifySignedChallenge)
});

;// CONCATENATED MODULE: external "@babel/runtime/helpers/defineProperty"
const defineProperty_namespaceObject = require("@babel/runtime/helpers/defineProperty");
var defineProperty_default = /*#__PURE__*/__webpack_require__.n(defineProperty_namespaceObject);
;// CONCATENATED MODULE: external "@babel/runtime/helpers/objectSpread2"
const objectSpread2_namespaceObject = require("@babel/runtime/helpers/objectSpread2");
var objectSpread2_default = /*#__PURE__*/__webpack_require__.n(objectSpread2_namespaceObject);
;// CONCATENATED MODULE: external "@toruslabs/openlogin-jrpc"
const openlogin_jrpc_namespaceObject = require("@toruslabs/openlogin-jrpc");
;// CONCATENATED MODULE: external "@toruslabs/openlogin-utils"
const openlogin_utils_namespaceObject = require("@toruslabs/openlogin-utils");
;// CONCATENATED MODULE: ./src/chain/IChainInterface.ts
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
;// CONCATENATED MODULE: ./src/chain/config.ts

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
;// CONCATENATED MODULE: external "ts-custom-error"
const external_ts_custom_error_namespaceObject = require("ts-custom-error");
;// CONCATENATED MODULE: ./src/errors/index.ts



// @flow

class Web3AuthError extends external_ts_custom_error_namespaceObject.CustomError {
  constructor(code, message) {
    // takes care of stack and proto
    super(message);
    defineProperty_default()(this, "code", void 0);
    defineProperty_default()(this, "message", void 0);
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
defineProperty_default()(WalletInitializationError, "messages", {
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
defineProperty_default()(WalletLoginError, "messages", {
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
defineProperty_default()(WalletOperationsError, "messages", {
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
defineProperty_default()(WalletProviderError, "messages", {
  5000: "Custom",
  5301: "Expected a single, non-array, object argument.",
  5302: "'args.method' must be a non-empty string.",
  5303: "'args.params' must be an object or array if provided."
});
;// CONCATENATED MODULE: ./src/wallet/index.ts

const MULTI_CHAIN_ADAPTERS = {
  OPENLOGIN: "openlogin",
  WALLET_CONNECT_V2: "wallet-connect-v2"
};
const SOLANA_ADAPTERS = objectSpread2_default()({
  TORUS_SOLANA: "torus-solana",
  PHANTOM: "phantom",
  SOLFLARE: "solflare",
  SLOPE: "slope"
}, MULTI_CHAIN_ADAPTERS);
const EVM_ADAPTERS = objectSpread2_default()({
  TORUS_EVM: "torus-evm",
  METAMASK: "metamask",
  COINBASE: "coinbase"
}, MULTI_CHAIN_ADAPTERS);
const WALLET_ADAPTERS = objectSpread2_default()(objectSpread2_default()({}, EVM_ADAPTERS), SOLANA_ADAPTERS);
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
;// CONCATENATED MODULE: ./src/adapter/IAdapter.ts








const WEB3AUTH_NETWORK = openlogin_utils_namespaceObject.OPENLOGIN_NETWORK;

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
const ADAPTER_EVENTS = objectSpread2_default()(objectSpread2_default()({}, ADAPTER_STATUS), {}, {
  ADAPTER_DATA_UPDATED: "adapter_data_updated",
  CACHE_CLEAR: "cache_clear"
});
class BaseAdapter extends openlogin_jrpc_namespaceObject.SafeEventEmitter {
  constructor() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    super();
    defineProperty_default()(this, "adapterData", {});
    defineProperty_default()(this, "sessionTime", 86400);
    defineProperty_default()(this, "clientId", void 0);
    defineProperty_default()(this, "web3AuthNetwork", openlogin_utils_namespaceObject.OPENLOGIN_NETWORK.MAINNET);
    defineProperty_default()(this, "useCoreKitKey", undefined);
    defineProperty_default()(this, "rehydrated", false);
    // should be added in constructor or from setAdapterSettings function
    // before calling init function.
    defineProperty_default()(this, "chainConfig", null);
    defineProperty_default()(this, "knownChainConfigs", {});
    defineProperty_default()(this, "adapterNamespace", void 0);
    defineProperty_default()(this, "currentChainNamespace", void 0);
    defineProperty_default()(this, "type", void 0);
    defineProperty_default()(this, "name", void 0);
    defineProperty_default()(this, "status", void 0);
    this.setAdapterSettings(options);
  }
  get chainConfigProxy() {
    return this.chainConfig ? objectSpread2_default()({}, this.chainConfig) : null;
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
      const finalChainConfig = objectSpread2_default()(objectSpread2_default()({}, defaultChainConfig || {}), customChainConfig);
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
    this.knownChainConfigs[chainConfig.chainId] = objectSpread2_default()(objectSpread2_default()({}, currentConfig || {}), chainConfig);
  }
  getChainConfig(chainId) {
    return this.knownChainConfigs[chainId] || null;
  }
}
class BaseNetworkSwitch {}
;// CONCATENATED MODULE: external "@toruslabs/http-helpers"
const http_helpers_namespaceObject = require("@toruslabs/http-helpers");
;// CONCATENATED MODULE: external "jwt-decode"
const external_jwt_decode_namespaceObject = require("jwt-decode");
;// CONCATENATED MODULE: ./src/constants.ts
const authServer = "https://authjs.web3auth.io";
;// CONCATENATED MODULE: external "loglevel"
const external_loglevel_namespaceObject = require("loglevel");
var external_loglevel_default = /*#__PURE__*/__webpack_require__.n(external_loglevel_namespaceObject);
;// CONCATENATED MODULE: ./src/loglevel.ts

/* harmony default export */ const loglevel = (external_loglevel_default().getLogger("web3auth-logger"));
;// CONCATENATED MODULE: ./src/utils.ts
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
;// CONCATENATED MODULE: ./src/adapter/utils.ts





const checkIfTokenIsExpired = token => {
  const decoded = (0,external_jwt_decode_namespaceObject.jwtDecode)(token);
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
  const res = await (0,http_helpers_namespaceObject.post)(`${authServer}/siww/get`, data);
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
  const idTokenRes = await (0,http_helpers_namespaceObject.post)(`${authServer}/siww/verify`, sigData, {
    headers: {
      client_id: clientId,
      wallet_provider: issuer,
      web3auth_network: web3AuthNetwork
    }
  });
  if (!idTokenRes.success) {
    loglevel.error("Failed to authenticate user, ,message verification failed", idTokenRes.error);
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
;// CONCATENATED MODULE: ./src/adapter/index.ts


;// CONCATENATED MODULE: ./src/provider/IProvider.ts
const PROVIDER_EVENTS = {
  INITIALIZED: "initialized",
  ERRORED: "errored"
};
;// CONCATENATED MODULE: ./src/index.ts










module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=base.cjs.js.map