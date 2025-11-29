/**
 * Wallet Agents Utility
 * 
 * Functions to get user's agents from their connected wallet
 */

import { resolvePaymentKeyHash } from "@meshsdk/core";

export interface WalletAgent {
  assetId: string;
  assetName: string;
  quantity: string;
  policyId?: string;
}

/**
 * Get all agent assets from user's wallet
 * Filters for CIP-68 tokens (User Token label 222)
 */
export async function getUserAgents(wallet: any, showAll: boolean = false): Promise<WalletAgent[]> {
  if (!wallet) {
    throw new Error("Wallet not connected");
  }

  try {
    // Get all UTXOs from wallet
    const utxos = await wallet.getUtxos();
    console.log("🔍 [Wallet Agents] Total UTXOs:", utxos.length);
    
    // DEBUG: Log the structure of the first UTXO to understand the format
    if (utxos.length > 0) {
      console.log("🔍 [Wallet Agents] UTXO Structure Debug (first UTXO):", {
        keys: Object.keys(utxos[0]),
        hasAssets: !!utxos[0].assets,
        hasAmount: !!utxos[0].amount,
        hasValue: !!utxos[0].value,
        assetsType: Array.isArray(utxos[0].assets) ? 'array' : typeof utxos[0].assets,
        amountType: Array.isArray(utxos[0].amount) ? 'array' : typeof utxos[0].amount,
        valueType: Array.isArray(utxos[0].value) ? 'array' : typeof utxos[0].value,
        sampleUtxo: JSON.stringify(utxos[0], null, 2).substring(0, 500) + "..."
      });
    }
    
    // Extract all assets
    const allAssets: WalletAgent[] = [];
    const assetMap = new Map<string, WalletAgent>(); // Use Map to track by assetId
    
    for (const utxo of utxos) {
      // Try multiple UTXO structures (defensive approach)
      let amounts: any[] = [];
      
      // Method 1: Check utxo.output.amount (Mesh SDK nested format)
      if (utxo.output && utxo.output.amount && Array.isArray(utxo.output.amount)) {
        amounts = utxo.output.amount;
        console.log("   Using utxo.output.amount array");
      }
      // Method 2: Check utxo.amount (direct format)
      else if (utxo.amount && Array.isArray(utxo.amount)) {
        amounts = utxo.amount;
        console.log("   Using utxo.amount array");
      }
      // Method 3: Check utxo.assets (alternative format)
      else if (utxo.assets && Array.isArray(utxo.assets)) {
        amounts = utxo.assets;
        console.log("   Using utxo.assets array");
      }
      // Method 4: Check utxo.value (another alternative)
      else if (utxo.value && Array.isArray(utxo.value)) {
        amounts = utxo.value;
        console.log("   Using utxo.value array");
      }
      
      if (amounts.length === 0) {
        // No amounts found in this UTXO, skip it
        continue;
      }
      
      // Process each amount/asset entry
      for (const amountEntry of amounts) {
        let assetId: string;
        let assetNameHex: string;
        let policyId: string;
        let quantity: string;
        
        // Handle different amount entry formats
        if (amountEntry.unit) {
          // Format: { unit: "policyId + assetName", quantity: "1" }
          // Unit format: "lovelace" for ADA, or "policyId(56 hex) + assetName(hex)" for native assets
          const unit = amountEntry.unit;
          
          // Skip ADA (lovelace)
          if (unit === "lovelace" || unit.length <= 56) {
            continue;
          }
          
          // Extract policyId and assetName from unit
          // Unit = policyId (56 hex chars) + assetName (hex)
          policyId = unit.substring(0, 56);
          assetNameHex = unit.substring(56);
          assetId = unit; // Full unit is the assetId
          quantity = amountEntry.quantity || "1";
        } else if (amountEntry.policyId && amountEntry.assetName) {
          // Format: { policyId: "...", assetName: "...", quantity: "1" }
          policyId = amountEntry.policyId;
          assetNameHex = amountEntry.assetName;
          assetId = `${policyId}${assetNameHex}`;
          quantity = amountEntry.quantity || "1";
        } else {
          // Unknown format, skip
          console.log("   ⚠️ Unknown amount entry format:", amountEntry);
          continue;
        }
        
        // Skip if we've already processed this asset
        if (assetMap.has(assetId)) {
          continue;
        }
        
        // Try to convert hex to string
        let assetNameStr = "";
        try {
          assetNameStr = hexToString(assetNameHex);
        } catch (e) {
          assetNameStr = assetNameHex;
        }
        
        // Log all assets for debugging
        console.log("🔍 [Wallet Agents] Asset found:", {
          assetId: assetId.substring(0, 40) + "...",
          assetNameHex: assetNameHex.substring(0, 20) + "...",
          assetNameStr: assetNameStr.substring(0, 30),
          policyId: policyId?.substring(0, 20) + "...",
          quantity: quantity,
          fullAssetNameHex: assetNameHex
        });
        
        // Filter for CIP-68 User Tokens (label 222) only
        // This excludes Reference Tokens (label 100)
        const isUserToken = isCIP68UserToken(assetNameHex);
        
        if (!isUserToken && !showAll) {
          // Skip Reference Tokens (label 100) unless showAll is true
          console.log(`   ⏭️  Skipping Reference Token (label 100): ${assetId.substring(0, 30)}...`);
          continue;
        }
        
        // If showAll is true, include ALL assets (for debugging)
        if (showAll) {
          assetMap.set(assetId, {
            assetId,
            assetName: assetNameStr || assetNameHex,
            quantity: quantity,
            policyId: policyId
          });
          continue;
        }
        
        // VERY INCLUSIVE filtering: 
        // If it's a CIP-68 User Token (not Reference Token), include it!
        // CIP-68 User Tokens are what the user owns, so they should be shown
        const nameLower = assetNameStr.toLowerCase();
        const hexLower = assetNameHex.toLowerCase();
        
        // Check if it's a CIP-68 User Token (most important)
        // If it passed the isCIP68UserToken check (not filtered as Reference Token),
        // it's likely a User Token or regular token - include it if it looks like an agent
        const isCIP68User = isUserToken && assetNameHex.length > 8;
        
        // Check name-based matching
        const nameMatches = nameLower.includes("agent") ||
                           nameLower.startsWith("agent") || 
                           nameLower.startsWith("agentgen") ||
                           hexLower.includes("6167656e74"); // "agent" in hex
        
        // INCLUSIVE LOGIC: Include if it's:
        // 1. A CIP-68 User Token (passed the isCIP68UserToken check)
        // 2. Name contains "agent" 
        // 3. OR it's any native token that's not a Reference Token
        //    (Since we filtered Reference Tokens above, remaining tokens are likely User Tokens)
        const isAgent = isCIP68User || 
                       nameMatches || 
                       isUserToken; // If it passed the User Token check, include it
        
        if (isAgent) {
          const reason = isCIP68User 
            ? 'CIP-68 User Token (label 222)' 
            : nameMatches 
              ? 'Name contains "agent"' 
              : 'User Token (not Reference Token)';
          console.log(`✅ [Wallet Agents] INCLUDING: ${assetNameStr || assetNameHex.substring(0, 40)}`);
          console.log(`   Asset ID: ${assetId.substring(0, 40)}...`);
          console.log(`   Reason: ${reason}`);
          console.log(`   Hex: ${assetNameHex.substring(0, 40)}...`);
          assetMap.set(assetId, {
            assetId,
            assetName: assetNameStr || assetNameHex,
            quantity: quantity,
            policyId: policyId
          });
        } else {
          console.log(`❌ [Wallet Agents] SKIPPING: ${assetNameStr || assetNameHex.substring(0, 40)}`);
          console.log(`   Asset ID: ${assetId.substring(0, 40)}...`);
          console.log(`   Reason: Not a User Token and name doesn't match`);
          console.log(`   isUserToken: ${isUserToken}, nameMatches: ${nameMatches}`);
          console.log(`   Name: "${nameLower}", Hex: "${hexLower.substring(0, 40)}..."`);
        }
      }
    }
    
    // Convert Map to Array
    allAssets.push(...Array.from(assetMap.values()));
    
    console.log(`✅ [Wallet Agents] Found ${allAssets.length} unique agent assets`);
    
    // Remove duplicates (same assetId)
    const uniqueAssets = Array.from(
      new Map(allAssets.map(item => [item.assetId, item])).values()
    );
    
    console.log(`✅ [Wallet Agents] Returning ${uniqueAssets.length} unique agents`);
    
    return uniqueAssets;
  } catch (error: any) {
    console.error("❌ [Wallet Agents] Error getting agents:", error);
    throw new Error(`Failed to get user agents: ${error.message}`);
  }
}

/**
 * Check if asset name is a CIP-68 User Token (label 222)
 * CIP-68 encoding: First 4 bytes (8 hex chars) encode the label
 * Label 222 = 0x000000DE (in decimal: 222 = 0xDE)
 * Label 100 = 0x00000064 (Reference Token - we want to exclude this)
 * 
 * Note: CIP-68 uses CBOR encoding with specific label format
 * The label is encoded as a CBOR unsigned integer in the first bytes
 */
function isCIP68UserToken(assetNameHex: string): boolean {
  if (assetNameHex.length < 8) {
    // Too short to have a CIP-68 label, might be a regular token
    // Include it - could be an agent (not CIP-68)
    return true;
  }
  
  // CIP-68 label encoding:
  // The label is stored as CBOR, but in hex it appears as:
  // Label 100 (Reference) = various encodings, commonly starts with specific bytes
  // Label 222 (User) = various encodings, commonly starts with specific bytes
  
  // Check for Reference Token (label 100) - exclude these
  // Common patterns for label 100:
  const labelHex = assetNameHex.substring(0, 8).toLowerCase();
  const firstBytes = assetNameHex.substring(0, 4).toLowerCase();
  
  // Reference Token patterns (label 100):
  // CBOR encoding of 100 can vary, but common patterns:
  if (labelHex === "00000064" || 
      firstBytes === "1864" ||  // CBOR: unsigned int 100
      labelHex.startsWith("64") && labelHex.length >= 8) {
    console.log(`   ⏭️  Detected Reference Token (label 100): ${labelHex}`);
    return false; // This is a Reference Token, exclude it
  }
  
  // User Token patterns (label 222):
  // CBOR encoding of 222 = 0xDE = 222 in decimal
  // Common patterns:
  if (labelHex === "000000de" ||
      firstBytes === "18de" ||  // CBOR: unsigned int 222
      labelHex.startsWith("de") ||
      assetNameHex.length > 56) { // Long asset names are often CIP-68
    console.log(`   ✅ Detected User Token (label 222): ${labelHex}`);
    return true; // This is likely a User Token, include it
  }
  
  // If we can't determine, be inclusive - include it
  // (Better to show too many than miss agents)
  console.log(`   ⚠️  Unknown CIP-68 format, including: ${labelHex}`);
  return true;
}

/**
 * Convert hex string to readable string
 * For CIP-68 tokens, skips the label encoding (first 4 bytes)
 */
function hexToString(hex: string): string {
  try {
    let startIndex = 0;
    
    // Check if it's a CIP-68 token and skip the label
    if (hex.length >= 8) {
      const labelHex = hex.substring(0, 8).toLowerCase();
      // If it's a CIP-68 label (100 or 222), skip the first 4 bytes
      if (labelHex === "00000064" || labelHex === "000000de") {
        startIndex = 8; // Skip the label
      }
    }
    
    let str = "";
    for (let i = startIndex; i < hex.length; i += 2) {
      const charCode = parseInt(hex.substr(i, 2), 16);
      if (charCode > 0 && charCode < 128) {
        str += String.fromCharCode(charCode);
      }
    }
    return str;
  } catch (e) {
    return hex;
  }
}

/**
 * Get agent assets by policy ID (if you know the policy)
 */
export async function getUserAgentsByPolicy(wallet: any, policyId: string): Promise<WalletAgent[]> {
  const allAgents = await getUserAgents(wallet);
  return allAgents.filter(agent => agent.policyId === policyId);
}

