/**
 * Cardano Wallet API Types (CIP-30)
 * For Lace, Nami, Eternl, and other CIP-30 compatible wallets
 */

interface CardanoWalletApi {
  enable(): Promise<{
    signTx(tx: string, partialSign: boolean): Promise<string>
    submitTx(tx: string): Promise<string>
    getUtxos(): Promise<string[] | undefined>
    getBalance(): Promise<string>
    getUsedAddresses(): Promise<string[]>
    getUnusedAddresses(): Promise<string[]>
    getChangeAddress(): Promise<string>
    getRewardAddresses(): Promise<string[]>
    getNetworkId(): Promise<number>
  }>
  isEnabled(): Promise<boolean>
  apiVersion: string
  name: string
  icon: string
  experimental?: {
    on(eventName: string, callback: (...args: any[]) => void): void
    off(eventName: string, callback: (...args: any[]) => void): void
  }
}

interface Window {
  cardano?: {
    lace?: CardanoWalletApi
    nami?: CardanoWalletApi
    eternl?: CardanoWalletApi
    flint?: CardanoWalletApi
    typhon?: CardanoWalletApi
    gerowallet?: CardanoWalletApi
    [key: string]: CardanoWalletApi | undefined
  }
}
