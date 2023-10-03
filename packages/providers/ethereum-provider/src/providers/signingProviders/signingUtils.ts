import { Hardfork } from "@ethereumjs/common";
import { Capability, TransactionFactory } from "@ethereumjs/tx";
import { hashPersonalMessage, intToBytes, isHexString, publicToAddress, stripHexPrefix, toBytes } from "@ethereumjs/util";
import {
  type MessageTypes,
  SignTypedDataVersion,
  TypedDataUtils,
  type TypedDataV1,
  type TypedDataV1Field,
  type TypedMessage,
  typedSignatureHash,
} from "@metamask/eth-sig-util";
import { providerErrors } from "@metamask/rpc-errors";
import { concatSig } from "@toruslabs/base-controllers";
import { JRPCRequest, SafeEventEmitterProvider } from "@toruslabs/openlogin-jrpc";
import { isHexStrict, log } from "@web3auth-mpc/base";

import { IProviderHandlers, MessageParams, TransactionParams, TypedMessageParams } from "../../rpc/interfaces";
import { TransactionFormatter } from "../TransactionFormatter";
import { validateTypedMessageParams } from "../TransactionFormatter/utils";

async function signTx(
  txParams: TransactionParams & { gas?: string },
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  txFormatter: TransactionFormatter
): Promise<Buffer> {
  const finalTxParams = await txFormatter.formatTransaction(txParams);
  const common = await txFormatter.getCommonConfiguration();
  const unsignedEthTx = TransactionFactory.fromTxData(finalTxParams, {
    common,
  });

  // Hack for the constellation that we have got a legacy tx after spuriousDragon with a non-EIP155 conforming signature
  // and want to recreate a signature (where EIP155 should be applied)
  // Leaving this hack lets the legacy.spec.ts -> sign(), verifySignature() test fail
  // 2021-06-23
  let hackApplied = false;
  if (
    unsignedEthTx.type === 0 &&
    unsignedEthTx.common.gteHardfork(Hardfork.SpuriousDragon) &&
    !unsignedEthTx.supports(Capability.EIP155ReplayProtection)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (unsignedEthTx as any).activeCapabilities.push(Capability.EIP155ReplayProtection);
    hackApplied = true;
  }

  const msgHash = unsignedEthTx.getHashedMessageToSign();
  const rawMessage = unsignedEthTx.getMessageToSign();

  const { v, r, s } = await sign(Buffer.from(msgHash), Buffer.from(rawMessage as Uint8Array));
  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = (unsignedEthTx as any)._processSignature(BigInt(modifiedV), r, s);

  // Hack part 2
  if (hackApplied) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = (unsignedEthTx as any).activeCapabilities.indexOf(Capability.EIP155ReplayProtection);
    if (index > -1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (unsignedEthTx as any).activeCapabilities.splice(index, 1);
    }
  }

  return tx.serialize();
}

async function signMessage(sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
  const message = stripHexPrefix(data);
  const msgSig = await sign(Buffer.from(message, "hex"));
  let modifiedV = msgSig.v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }
  const rawMsgSig = concatSig(Buffer.from(intToBytes(modifiedV)), msgSig.r, msgSig.s);
  return rawMsgSig;
}

function legacyToBuffer(value: unknown) {
  return typeof value === "string" && !isHexString(value) ? Buffer.from(value) : toBytes(value);
}

async function personalSign(sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>, data: string) {
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

function validateVersion(version: string, allowedVersions: string[]) {
  if (!Object.keys(SignTypedDataVersion).includes(version)) {
    throw new Error(`Invalid version: '${version}'`);
  } else if (allowedVersions && !allowedVersions.includes(version)) {
    throw new Error(`SignTypedDataVersion not allowed: '${version}'. Allowed versions are: ${allowedVersions.join(", ")}`);
  }
}

async function signTypedData(
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>,
  data: unknown,
  version: SignTypedDataVersion
) {
  validateVersion(version, undefined); // Note: this is intentional;
  if (data === null || data === undefined) {
    throw new Error("Missing data parameter");
  }
  const messageHash =
    version === SignTypedDataVersion.V1
      ? Buffer.from(stripHexPrefix(typedSignatureHash(data as TypedDataV1Field[])), "hex")
      : TypedDataUtils.eip712Hash(data as TypedMessage<MessageTypes>, version);
  const { v, r, s } = await sign(Buffer.from(messageHash.buffer));

  let modifiedV = v;
  if (modifiedV <= 1) {
    modifiedV = modifiedV + 27;
  }

  return concatSig(Buffer.from(toBytes(modifiedV)), r, s);
}

export function getProviderHandlers({
  txFormatter,
  sign,
  getPublic,
  getProviderEngineProxy,
}: {
  txFormatter: TransactionFormatter;
  sign: (msgHash: Buffer, rawMsg?: Buffer) => Promise<{ v: number; r: Buffer; s: Buffer }>;
  getPublic: () => Promise<Buffer>;
  getProviderEngineProxy: () => SafeEventEmitterProvider | null;
}): IProviderHandlers {
  return {
    getAccounts: async (_: JRPCRequest<unknown>) => {
      const pubKey = await getPublic();
      return [`0x${Buffer.from(publicToAddress(pubKey)).toString("hex")}`];
    },
    getPrivateKey: async (_: JRPCRequest<unknown>) => {
      throw providerErrors.custom({
        message: "Provider cannot return private key",
        code: 4902,
      });
    },
    processTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      const txHash = await providerEngineProxy.request<string[], string>({
        method: "eth_sendRawTransaction",
        params: ["0x".concat(serializedTxn.toString("hex"))],
      });
      return txHash;
    },
    processSignTransaction: async (txParams: TransactionParams & { gas?: string }, _: JRPCRequest<unknown>): Promise<string> => {
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const serializedTxn = await signTx(txParams, sign, txFormatter);
      return Buffer.from(serializedTxn).toString("hex");
    },
    processEthSignMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const rawMessageSig = signMessage(sign, msgParams.data);
      return rawMessageSig;
    },
    processPersonalMessage: async (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): Promise<string> => {
      const sig = personalSign(sign, msgParams.data);
      return sig;
    },
    processTypedMessage: async (msgParams: MessageParams<TypedDataV1>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessage", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      const params = {
        ...msgParams,
        version: SignTypedDataVersion.V1,
      };
      validateTypedMessageParams(params, finalChainId);
      const data = typeof params.data === "string" ? JSON.parse(params.data) : params.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V1);
      return sig;
    },
    processTypedMessageV3: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV3", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V3);
      return sig;
    },
    processTypedMessageV4: async (msgParams: TypedMessageParams<TypedMessage<MessageTypes>>, _: JRPCRequest<unknown>): Promise<string> => {
      log.debug("processTypedMessageV4", msgParams);
      const providerEngineProxy = getProviderEngineProxy();
      if (!providerEngineProxy)
        throw providerErrors.custom({
          message: "Provider is not initialized",
          code: 4902,
        });
      const chainId = await providerEngineProxy.request<unknown, string>({ method: "eth_chainId" });
      const finalChainId = Number.parseInt(chainId, isHexStrict(chainId) ? 16 : 10);
      validateTypedMessageParams(msgParams, finalChainId);
      const data = typeof msgParams.data === "string" ? JSON.parse(msgParams.data) : msgParams.data;
      const sig = signTypedData(sign, data, SignTypedDataVersion.V4);
      return sig;
    },
    processEncryptionPublicKey: async (address: string, _: JRPCRequest<unknown>): Promise<string> => {
      log.info("processEncryptionPublicKey", address);
      throw providerErrors.custom({
        message: "Provider cannot encryption public key",
        code: 4902,
      });
    },
    processDecryptMessage: (msgParams: MessageParams<string>, _: JRPCRequest<unknown>): string => {
      log.info("processDecryptMessage", msgParams);
      throw providerErrors.custom({
        message: "Provider cannot decrypt",
        code: 4902,
      });
    },
  };
}
