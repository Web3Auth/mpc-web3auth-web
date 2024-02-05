import type { ISignClient } from "@walletconnect/types";
import { CustomChainConfig } from "@web3auth-mpc/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth-mpc/base-provider";
export interface WalletConnectV2ProviderConfig extends BaseProviderConfig {
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export interface WalletConnectV2ProviderState extends BaseProviderState {
    accounts: string[];
}
export declare class WalletConnectV2Provider extends BaseProvider<BaseProviderConfig, WalletConnectV2ProviderState, ISignClient> {
    private connector;
    constructor({ config, state, connector }: {
        config: WalletConnectV2ProviderConfig;
        state?: BaseProviderState;
        connector?: ISignClient;
    });
    static getProviderInstance: (params: {
        connector: ISignClient;
        chainConfig: Omit<CustomChainConfig, "chainNamespace">;
        skipLookupNetwork: boolean;
    }) => Promise<WalletConnectV2Provider>;
    enable(): Promise<string[]>;
    setupProvider(connector: ISignClient): Promise<void>;
    switchChain({ chainId }: {
        chainId: string;
    }): Promise<void>;
    addChain(chainConfig: CustomChainConfig): Promise<void>;
    protected lookupNetwork(_: ISignClient): Promise<string>;
    private setupEngine;
    private getChainSwitchMiddleware;
    private connectedTopic;
    private checkIfChainIdAllowed;
    private checkIfAccountAllowed;
    private onConnectorStateUpdate;
}
