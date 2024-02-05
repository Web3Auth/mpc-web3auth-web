/// <reference types="node" />
import { CustomChainConfig } from "@web3auth-mpc/base";
import { BaseProvider, BaseProviderConfig, BaseProviderState } from "@web3auth-mpc/base-provider";
export interface EthereumSigningProviderConfig extends BaseProviderConfig {
    chainConfig: Omit<CustomChainConfig, "chainNamespace">;
}
export interface EthereumSigningProviderState extends BaseProviderState {
    privateKey?: string;
    signMethods?: {
        sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
            v: number;
            r: Buffer;
            s: Buffer;
        }>;
        getPublic: () => Promise<Buffer>;
    };
}
export declare class EthereumSigningProvider extends BaseProvider<BaseProviderConfig, EthereumSigningProviderState, {
    sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
        v: number;
        r: Buffer;
        s: Buffer;
    }>;
    getPublic: () => Promise<Buffer>;
}> {
    constructor({ config, state }: {
        config: EthereumSigningProviderConfig;
        state?: EthereumSigningProviderState;
    });
    static getProviderInstance: (params: {
        signMethods: {
            sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
                v: number;
                r: Buffer;
                s: Buffer;
            }>;
            getPublic: () => Promise<Buffer>;
        };
        chainConfig: Omit<CustomChainConfig, "chainNamespace">;
    }) => Promise<EthereumSigningProvider>;
    enable(): Promise<string[]>;
    setupProvider({ sign, getPublic, }: {
        sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
            v: number;
            r: Buffer;
            s: Buffer;
        }>;
        getPublic: () => Promise<Buffer>;
    }): Promise<void>;
    updateAccount(params: {
        signMethods: {
            sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{
                v: number;
                r: Buffer;
                s: Buffer;
            }>;
            getPublic: () => Promise<Buffer>;
        };
    }): Promise<void>;
    switchChain(params: {
        chainId: string;
    }): Promise<void>;
    protected lookupNetwork(): Promise<string>;
    private getChainSwitchMiddleware;
    private getAccountMiddleware;
}
