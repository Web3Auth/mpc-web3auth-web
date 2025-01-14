import type { SafeEventEmitter } from "@toruslabs/openlogin-jrpc";
import { RequestArguments } from "@web3auth-mpc/base";

export interface InjectedProvider extends SafeEventEmitter {
  request<T, U>(args: RequestArguments<T>): Promise<U>;
}
