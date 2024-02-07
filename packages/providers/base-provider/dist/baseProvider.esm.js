import _objectSpread from '@babel/runtime/helpers/objectSpread2';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import { rpcErrors, providerErrors } from '@metamask/rpc-errors';
import { BaseController, createEventEmitterProxy, createFetchMiddleware } from '@toruslabs/base-controllers';
import { WalletInitializationError, WalletProviderError, CHAIN_NAMESPACES } from '@web3auth-mpc/base';
import { mergeMiddleware, JRPCEngine, providerFromEngine, createScaffoldMiddleware, createAsyncMiddleware } from '@toruslabs/openlogin-jrpc';
import getCreateRandomId from 'json-rpc-random-id';

class BaseProvider extends BaseController {
  constructor(_ref) {
    let {
      config,
      state
    } = _ref;
    super({
      config,
      state
    });
    // should be Assigned in setupProvider
    _defineProperty(this, "_providerEngineProxy", null);
    if (!config.chainConfig) throw WalletInitializationError.invalidProviderConfigError("Please provide chainConfig");
    if (!config.chainConfig.chainId) throw WalletInitializationError.invalidProviderConfigError("Please provide chainId inside chainConfig");
    if (!config.chainConfig.rpcTarget) throw WalletInitializationError.invalidProviderConfigError("Please provide rpcTarget inside chainConfig");
    this.defaultState = {
      chainId: "loading"
    };
    this.defaultConfig = {
      chainConfig: config.chainConfig,
      networks: {
        [config.chainConfig.chainId]: config.chainConfig
      }
    };
    super.initialize();
  }
  get currentChainConfig() {
    return this.config.chainConfig;
  }
  get provider() {
    return this._providerEngineProxy;
  }
  get chainId() {
    return this.state.chainId;
  }
  set provider(_) {
    throw new Error("Method not implemented.");
  }
  async request(args) {
    var _this$provider;
    if (!args || typeof args !== "object" || Array.isArray(args)) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestArgs().message,
        data: _objectSpread(_objectSpread({}, args || {}), {}, {
          cause: WalletProviderError.invalidRequestArgs().message
        })
      });
    }
    const {
      method,
      params
    } = args;
    if (typeof method !== "string" || method.length === 0) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestMethod().message,
        data: _objectSpread(_objectSpread({}, args || {}), {}, {
          cause: WalletProviderError.invalidRequestMethod().message
        })
      });
    }
    if (params !== undefined && !Array.isArray(params) && (typeof params !== "object" || params === null)) {
      throw rpcErrors.invalidRequest({
        message: WalletProviderError.invalidRequestParams().message,
        data: _objectSpread(_objectSpread({}, args || {}), {}, {
          cause: WalletProviderError.invalidRequestParams().message
        })
      });
    }
    return (_this$provider = this.provider) === null || _this$provider === void 0 ? void 0 : _this$provider.request(args);
  }
  sendAsync(req, callback) {
    if (callback) return this.send(req, callback);
    return this.request(req);
  }
  send(req, callback) {
    this.request(req).then(res => callback(null, {
      result: res
    })).catch(err => callback(err, null));
  }
  addChain(chainConfig) {
    if (!chainConfig.chainId) throw rpcErrors.invalidParams("chainId is required");
    if (!chainConfig.rpcTarget) throw rpcErrors.invalidParams("chainId is required");
    this.configure({
      networks: _objectSpread(_objectSpread({}, this.config.networks), {}, {
        [chainConfig.chainId]: chainConfig
      })
    });
  }
  getChainConfig(chainId) {
    var _this$config$networks;
    const chainConfig = (_this$config$networks = this.config.networks) === null || _this$config$networks === void 0 ? void 0 : _this$config$networks[chainId];
    if (!chainConfig) throw rpcErrors.invalidRequest(`Chain ${chainId} is not supported, please add chainConfig for it`);
    return chainConfig;
  }
  updateProviderEngineProxy(provider) {
    if (this._providerEngineProxy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._providerEngineProxy.setTarget(provider);
    } else {
      this._providerEngineProxy = createEventEmitterProxy(provider);
    }
  }
  getProviderEngineProxy() {
    return this._providerEngineProxy;
  }
}

function createChainIdMiddleware(chainId) {
  return (req, res, next, end) => {
    if (req.method === "chainId") {
      res.result = chainId;
      return end();
    }
    return next();
  };
}
function createProviderConfigMiddleware(providerConfig) {
  return (req, res, next, end) => {
    if (req.method === "provider_config") {
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

var _class$1;
class CommonJRPCProvider extends BaseProvider {
  constructor(_ref) {
    let {
      config,
      state
    } = _ref;
    super({
      config,
      state
    });
  }
  async setupProvider() {
    const {
      networkMiddleware
    } = createJsonRpcClient(this.config.chainConfig);
    const engine = new JRPCEngine();
    engine.push(networkMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
    const newChainId = this.config.chainConfig.chainId;
    if (this.state.chainId !== newChainId) {
      this.emit("chainChanged", newChainId);
      this.emit("connect", {
        chainId: newChainId
      });
    }
    this.update({
      chainId: this.config.chainConfig.chainId
    });
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
    await this.setupProvider();
  }
  updateProviderEngineProxy(provider) {
    if (this._providerEngineProxy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._providerEngineProxy.setTarget(provider);
    } else {
      this._providerEngineProxy = createEventEmitterProxy(provider);
    }
  }
  getProviderEngineProxy() {
    return this._providerEngineProxy;
  }
  lookupNetwork() {
    throw new Error("Method not implemented.");
  }
}
_class$1 = CommonJRPCProvider;
_defineProperty(CommonJRPCProvider, "getProviderInstance", async params => {
  const providerFactory = new _class$1({
    config: {
      chainConfig: params.chainConfig
    }
  });
  await providerFactory.setupProvider();
  return providerFactory;
});

var _class;
class CommonPrivateKeyProvider extends BaseProvider {
  constructor(_ref) {
    let {
      config,
      state
    } = _ref;
    super({
      config: {
        chainConfig: _objectSpread(_objectSpread({}, config.chainConfig), {}, {
          chainNamespace: CHAIN_NAMESPACES.OTHER
        })
      },
      state
    });
    // should be Assigned in setupProvider
    _defineProperty(this, "_providerEngineProxy", null);
  }
  get provider() {
    return this._providerEngineProxy;
  }
  set provider(_) {
    throw new Error("Method not implemented.");
  }
  addChain(_) {
    throw new Error("Method not implemented.");
  }
  async setupProvider(privKey) {
    const privKeyMiddleware = this.getPrivKeyMiddleware(privKey);
    const engine = new JRPCEngine();
    engine.push(privKeyMiddleware);
    const provider = providerFromEngine(engine);
    this.updateProviderEngineProxy(provider);
  }
  updateProviderEngineProxy(provider) {
    if (this._providerEngineProxy) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._providerEngineProxy.setTarget(provider);
    } else {
      this._providerEngineProxy = createEventEmitterProxy(provider);
    }
  }
  async switchChain(_) {
    return Promise.resolve();
  }
  getProviderEngineProxy() {
    return this._providerEngineProxy;
  }
  async lookupNetwork() {
    return Promise.resolve("");
  }
  getPrivKeyMiddleware(privKey) {
    const middleware = {
      getPrivatekey: async () => {
        return privKey;
      }
    };
    return this.createPrivKeyMiddleware(middleware);
  }
  createPrivKeyMiddleware(_ref2) {
    let {
      getPrivatekey
    } = _ref2;
    async function getPrivatekeyHandler(_, res) {
      res.result = await getPrivatekey();
    }
    return createScaffoldMiddleware({
      private_key: createAsyncMiddleware(getPrivatekeyHandler)
    });
  }
}
_class = CommonPrivateKeyProvider;
_defineProperty(CommonPrivateKeyProvider, "getProviderInstance", async params => {
  const providerFactory = new _class({
    config: {
      chainConfig: params.chainConfig
    }
  });
  await providerFactory.setupProvider(params.privKey);
  return providerFactory;
});

const createRandomId = getCreateRandomId();

export { BaseProvider, CommonJRPCProvider, CommonPrivateKeyProvider, createRandomId };
//# sourceMappingURL=baseProvider.esm.js.map
