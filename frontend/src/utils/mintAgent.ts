import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import { Cip68Contract } from "@independenceee/cip68generator";

// 1. Setup Network (Preprod Testnet)
// Make sure VITE_BLOCKFROST_PROJECT_ID is in your .env file!
const blockfrostKey = import.meta.env.VITE_BLOCKFROST_PROJECT_ID || "";

console.log("🔍 [Blockfrost] Initializing Blockfrost provider...");
console.log("🔍 [Blockfrost] API Key present:", blockfrostKey ? `✅ (${blockfrostKey.substring(0, 10)}...)` : "❌ Missing");

if (!blockfrostKey) {
  console.error("❌ [Blockfrost] VITE_BLOCKFROST_PROJECT_ID not set! Transaction building will fail.");
  throw new Error("VITE_BLOCKFROST_PROJECT_ID environment variable is required. Please set it in your .env file.");
}

const blockfrostProvider = new BlockfrostProvider(blockfrostKey);
console.log("✅ [Blockfrost] Provider initialized");

const meshTxBuilder = new MeshTxBuilder({
  fetcher: blockfrostProvider,
  evaluator: blockfrostProvider,
  submitter: blockfrostProvider,
});
console.log("✅ [Mesh] Transaction builder initialized");

/**
 * Generate a unique asset name for an agent
 */
function generateAssetName(prefix: string = "Agent"): string {
  // Create a unique handle with timestamp and random number
  const timestamp = Date.now().toString(36);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

/**
 * Mint a genesis agent (Gen 0)
 */
export async function mintGenesisAgent(wallet: any, metadata: any) {
  
  console.log("🔍 [mintGenesisAgent] Starting mint process...");
  console.log("🔍 [Wallet Check] Wallet object:", wallet ? "✅ Present" : "❌ Missing");
  
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  // Validate wallet API methods (CIP-68 generator needs these)
  console.log("🔍 [Wallet API] Checking wallet methods...");
  console.log("  - signTx:", typeof wallet.signTx === 'function' ? "✅" : "❌");
  console.log("  - submitTx:", typeof wallet.submitTx === 'function' ? "✅" : "❌");
  console.log("  - getNetworkId:", typeof wallet.getNetworkId === 'function' ? "✅" : "❌");
  console.log("  - getUsedAddresses:", typeof wallet.getUsedAddresses === 'function' ? "✅" : "❌");
  console.log("  - getUnusedAddresses:", typeof wallet.getUnusedAddresses === 'function' ? "✅" : "❌");
  console.log("  - getUtxos:", typeof wallet.getUtxos === 'function' ? "✅" : "❌");
  console.log("  - getBalance:", typeof wallet.getBalance === 'function' ? "✅" : "❌");
  console.log("  - getChangeAddress:", typeof wallet.getChangeAddress === 'function' ? "✅" : "❌");
  console.log("  - getRewardAddresses:", typeof wallet.getRewardAddresses === 'function' ? "✅" : "❌");
  
  // Log all wallet methods for debugging
  console.log("🔍 [Wallet API] All wallet methods:", Object.keys(wallet || {}));
  
  if (typeof wallet.signTx !== 'function') {
    throw new Error("Wallet does not have signTx method. Wallet API may be incorrect.");
  }
  if (typeof wallet.submitTx !== 'function') {
    throw new Error("Wallet does not have submitTx method. Wallet API may be incorrect.");
  }
  
  // Check if wallet has getUtxos (required by CIP-68 generator)
  if (typeof wallet.getUtxos !== 'function') {
    console.warn("⚠️ [Wallet API] Wallet does not have getUtxos method. CIP-68 generator may fail.");
  }

  // Initialize the Generator Helper
  console.log("🔍 [CIP68] Initializing CIP-68 contract...");
  const cip68Contract = new Cip68Contract({
    wallet: wallet,
    fetcher: blockfrostProvider,
    meshTxBuilder: meshTxBuilder,
  });
  console.log("✅ [CIP68] Contract initialized");

  console.log("🔍 [Transaction] Building CIP-68 Mint Transaction for Genesis Agent...");
  console.log("🔍 [Metadata] Metadata structure:", JSON.stringify(metadata, null, 2));

  // Generate unique asset name
  const uniqueHandle = generateAssetName("Agent");
  console.log("🔍 [Asset] Generated asset name:", uniqueHandle);

  let unsignedTx: any = null;
  let signedTx: any = null;

  try {
    // Step 1: Build unsigned transaction
    console.log("📝 [Step 1/3] Building unsigned transaction...");
    console.log("🔍 [CIP68] Calling cip68Contract.mint() with:", {
      assetName: uniqueHandle,
      quantity: "1",
      metadataKeys: Object.keys(metadata),
      metadataProperties: Object.keys(metadata.properties || {})
    });
    
    // Test wallet methods before calling mint (CIP-68 generator needs these)
    console.log("🔍 [Wallet Test] Testing wallet methods before mint...");
    try {
      const networkId = await wallet.getNetworkId();
      console.log("✅ [Wallet Test] getNetworkId():", networkId);
      
      const addresses = await wallet.getUsedAddresses();
      console.log("✅ [Wallet Test] getUsedAddresses():", addresses?.length || 0, "addresses");
      
      const utxos = await wallet.getUtxos();
      console.log("✅ [Wallet Test] getUtxos():", utxos?.length || 0, "UTXOs");
      
      const balance = await wallet.getBalance();
      console.log("✅ [Wallet Test] getBalance():", balance);
    } catch (walletTestError: any) {
      console.error("❌ [Wallet Test] Wallet method test failed:", walletTestError);
      console.error("❌ [Wallet Test] This may cause CIP-68 generator to fail");
    }
    
    // Wrap in try-catch to catch internal CIP-68 errors
    try {
      console.log("🔍 [CIP68] About to call cip68Contract.mint()...");
      unsignedTx = await cip68Contract.mint({
        assetName: uniqueHandle, 
        quantity: "1",
        metadata: metadata
      });
      console.log("✅ [CIP68] cip68Contract.mint() completed successfully");
    } catch (mintError: any) {
      console.error("❌ [CIP68] Error inside cip68Contract.mint():", mintError);
      console.error("❌ [CIP68] Error message:", mintError?.message);
      console.error("❌ [CIP68] Error stack:", mintError?.stack);
      console.error("❌ [CIP68] Error cause:", mintError?.cause);
      
      // Check if it's a wallet-related error
      if (mintError?.message?.includes('txHash') || mintError?.message?.includes('undefined')) {
        console.error("❌ [CIP68] This appears to be an internal CIP-68 generator error.");
        console.error("❌ [CIP68] The generator may be trying to access wallet methods that don't exist.");
        console.error("❌ [CIP68] Possible causes:");
        console.error("  1. Wallet API missing required methods");
        console.error("  2. Wallet methods returning undefined");
        console.error("  3. CIP-68 generator version mismatch");
        console.error("❌ [CIP68] Please check that your wallet API has all required methods.");
      }
      
      throw mintError;
    }

    console.log("✅ [Step 1/3] Unsigned transaction built successfully");
    console.log("🔍 [UnsignedTx] Type:", typeof unsignedTx);
    console.log("🔍 [UnsignedTx] Is string:", typeof unsignedTx === 'string');
    console.log("🔍 [UnsignedTx] Length:", unsignedTx?.length || "N/A");
    console.log("🔍 [UnsignedTx] Preview:", typeof unsignedTx === 'string' 
      ? `${unsignedTx.substring(0, 100)}...` 
      : JSON.stringify(unsignedTx).substring(0, 100));

    if (!unsignedTx) {
      throw new Error("Unsigned transaction is null or undefined");
    }

    // Step 2: Sign transaction (this should trigger Lace popup)
    console.log("📝 [Step 2/3] Requesting wallet signature...");
    console.log("🔍 [Wallet] About to call wallet.signTx() - Lace popup should appear now!");
    console.log("🔍 [Wallet] signTx parameters:", {
      unsignedTxType: typeof unsignedTx,
      unsignedTxLength: typeof unsignedTx === 'string' ? unsignedTx.length : 'N/A',
      partialSign: true
    });

    try {
      signedTx = await wallet.signTx(unsignedTx, true);
      console.log("✅ [Step 2/3] Transaction signed successfully");
      console.log("🔍 [SignedTx] Type:", typeof signedTx);
      console.log("🔍 [SignedTx] Is string:", typeof signedTx === 'string');
      console.log("🔍 [SignedTx] Length:", signedTx?.length || "N/A");
      console.log("🔍 [SignedTx] Preview:", typeof signedTx === 'string' 
        ? `${signedTx.substring(0, 100)}...` 
        : JSON.stringify(signedTx).substring(0, 100));
    } catch (signError: any) {
      console.error("❌ [Step 2/3] Signing failed:", signError);
      console.error("❌ [Sign Error] Message:", signError?.message);
      console.error("❌ [Sign Error] Stack:", signError?.stack);
      if (signError?.message?.includes('User rejected')) {
        throw new Error("Transaction signing was cancelled by user");
      }
      throw new Error(`Transaction signing failed: ${signError?.message || "Unknown error"}`);
    }

    if (!signedTx) {
      throw new Error("Signed transaction is null or undefined after signing");
    }

    // Step 3: Submit transaction
    console.log("📝 [Step 3/3] Submitting transaction to Cardano network...");
    console.log("🔍 [Wallet] About to call wallet.submitTx()...");
    console.log("🔍 [Wallet] submitTx parameters:", {
      signedTxType: typeof signedTx,
      signedTxLength: typeof signedTx === 'string' ? signedTx.length : 'N/A'
    });

    try {
      const txHash = await wallet.submitTx(signedTx);
      
      console.log("✅ [Step 3/3] Transaction submitted successfully!");
      console.log("✅ [Transaction Hash]:", txHash);
      console.log("ℹ️  [Note] Transaction may take 30-60 seconds to appear on CardanoScan");
      console.log("🔗 [CardanoScan]:", `https://preprod.cardanoscan.io/transaction/${txHash}`);

      // Return transaction hash (matching Reference implementation)
      return txHash;
    } catch (submitError: any) {
      console.error("❌ [Step 3/3] Submission failed:", submitError);
      console.error("❌ [Submit Error] Message:", submitError?.message);
      console.error("❌ [Submit Error] Stack:", submitError?.stack);
      throw new Error(`Transaction submission failed: ${submitError?.message || "Unknown error"}`);
    }

  } catch (error: any) {
    console.error("❌ [mintGenesisAgent] Error in CIP-68 mint process:", error);
    console.error("❌ [Error Details]:", {
      message: error?.message,
      stack: error?.stack,
      cause: error?.cause,
      name: error?.name
    });
    throw new Error(`Failed to mint agent: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Mint a bred agent (child of two parents)
 * 
 * @param wallet - Connected wallet instance
 * @param metadata - Agent metadata (should include generation and parent references)
 * @param parentA_assetId - Asset ID of first parent (for reference)
 * @param parentB_assetId - Asset ID of second parent (for reference)
 */
export async function mintBredAgent(
  wallet: any, 
  metadata: any,
  parentA_assetId?: string,
  parentB_assetId?: string
) {
  
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  // Initialize the Generator Helper
  const cip68Contract = new Cip68Contract({
    wallet: wallet,
    fetcher: blockfrostProvider,
    meshTxBuilder: meshTxBuilder,
  });

  console.log("Tx: Building CIP-68 Mint Transaction for Bred Agent...");
  console.log(`   Generation: ${metadata.properties?.generation ?? 'unknown'}`);
  if (parentA_assetId && parentB_assetId) {
    console.log(`   Parents: ${parentA_assetId.substring(0, 10)}... and ${parentB_assetId.substring(0, 10)}...`);
  }

  // Generate unique asset name (can include generation in name)
  // Genesis agents are generation 1, treat 0 as 1 for legacy agents
  const generation = metadata.properties?.generation && metadata.properties.generation > 0 
    ? metadata.properties.generation 
    : 1;
  const prefix = `AgentGen${generation}`;
  const uniqueHandle = generateAssetName(prefix);

  const unsignedTx = await cip68Contract.mint({
    assetName: uniqueHandle, 
    quantity: "1",
    metadata: metadata
  });

  // Sign and Submit (matching Reference implementation)
  console.log("Signing transaction...");
  const signedTx = await wallet.signTx(unsignedTx, true);
  
  console.log("Submitting transaction to Cardano network...");
  const txHash = await wallet.submitTx(signedTx);
  
  console.log("Transaction submitted successfully!");
  console.log("Transaction Hash:", txHash);
  console.log("Note: Transaction may take 30-60 seconds to appear on CardanoScan");
  console.log("Check status at: https://preprod.cardanoscan.io/transaction/" + txHash);

  // Return transaction hash (matching Reference implementation)
  return txHash;
}

