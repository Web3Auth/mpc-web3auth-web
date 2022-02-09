import { BaseAdapterConfig, WALLET_ADAPTERS } from "@web3auth/base";
import React from "react";

import { MODAL_STATUS, ModalStatusType } from "../interfaces";
import Image from "./Image";
import WalletConnect from "./WalletConnect";

const arrowLeftIcon = <Image imageId="arrow-left" />;

interface ExternalWalletsProps {
  hideExternalWallets: () => void;
  handleExternalWalletClick: (params: { adapter: string }) => void;
  showWalletConnect: boolean;
  config: Record<string, BaseAdapterConfig>;
  walletConnectUri: string;
  showBackButton: boolean;
  modalStatus: ModalStatusType;
  postLoadingMessage: string;
}
export default function ExternalWallet(props: ExternalWalletsProps) {
  const { hideExternalWallets, handleExternalWalletClick, showWalletConnect, config = {}, walletConnectUri, showBackButton, modalStatus } = props;
  const renderWalletConnect = () => {
    if (config[WALLET_ADAPTERS.WALLET_CONNECT_V1]) {
      if (showWalletConnect && !walletConnectUri) handleExternalWalletClick({ adapter: WALLET_ADAPTERS.WALLET_CONNECT_V1 });
      if (walletConnectUri) {
        return <WalletConnect walletConnectUri={walletConnectUri} />;
      }

      return <></>;
    }
    return <></>;
  };
  return (
    <div className="w3ajs-external-wallet w3a-group">
      <div className="w3a-external-container w3ajs-external-container">
        {showBackButton && (
          <button className="w3a-external-back w3ajs-external-back" onClick={() => hideExternalWallets()}>
            {arrowLeftIcon}
            <h6 className="w3a-group__title">Back</h6>
          </button>
        )}

        {renderWalletConnect()}

        {/* <!-- Other Wallet --> */}
        {modalStatus === MODAL_STATUS.INITIALIZED && (
          <ul className="w3a-adapter-list w3ajs-wallet-adapters">
            {Object.keys(config).map((adapter) => {
              if (adapter === WALLET_ADAPTERS.WALLET_CONNECT_V1 || adapter === WALLET_ADAPTERS.WALLET_CONNECT_V2) {
                return <></>;
              }
              const providerIcon = <Image imageId={`login-${adapter}`} />;

              return (
                <li className="w3a-adapter-item" key={adapter}>
                  <button onClick={() => handleExternalWalletClick({ adapter })} className="w3a-button w3a-button--icon">
                    {providerIcon}
                  </button>
                  <p className="w3a-adapter-item__label">{config[adapter]?.label || adapter}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
