import { SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import { IProviderHandlers } from "../../rpc/interfaces";
import { TransactionFormatter } from "../TransactionFormatter";
export declare function getProviderHandlers({ txFormatter, privKey, getProviderEngineProxy, }: {
    txFormatter: TransactionFormatter;
    privKey: string;
    getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers;
