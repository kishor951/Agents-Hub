-- Plutus Validator for Agent NFT Breeding (Simplified for Hackathon MVP)
-- This is pseudocode to demonstrate the validation logic
-- In production, this would be compiled using Plutarch or PlutusTx

{-# LANGUAGE DataKinds #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeApplications #-}

module AgentBreedingValidator where

import PlutusTx
import PlutusTx.Prelude
import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts

-- | Breeding parameters
data BreedingParams = BreedingParams
  { parentTokenA :: AssetClass
  , parentTokenB :: AssetClass
  , geneticHash :: BuiltinByteString
  , breedingFee :: Integer
  }

-- | Redeemer for breeding action
data BreedingRedeemer = Breed BreedingParams

-- | Validator function
{-# INLINABLE validateBreeding #-}
validateBreeding :: BreedingParams -> ScriptContext -> Bool
validateBreeding params ctx =
  traceIfFalse "Signer must own parent A" ownsParentA &&
  traceIfFalse "Signer must own parent B" ownsParentB &&
  traceIfFalse "Parents must be different" parentsDifferent &&
  traceIfFalse "Insufficient breeding fee" feeValid &&
  traceIfFalse "Invalid genetic hash" hashValid
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    signer :: PubKeyHash
    signer = case txInfoSignatories info of
      [pkh] -> pkh
      _ -> traceError "Expected single signer"

    -- Check ownership of parent NFTs
    ownsParentA :: Bool
    ownsParentA = assetClassValueOf (valuePaidTo info signer) (parentTokenA params) >= 1

    ownsParentB :: Bool
    ownsParentB = assetClassValueOf (valuePaidTo info signer) (parentTokenB params) >= 1

    -- Ensure parents are different
    parentsDifferent :: Bool
    parentsDifferent = parentTokenA params /= parentTokenB params

    -- Validate breeding fee
    feeValid :: Bool
    feeValid = valueOf (txInfoFee info) adaSymbol adaToken >= breedingFee params

    -- Validate genetic hash (simplified - in production, recompute on-chain)
    hashValid :: Bool
    hashValid = lengthOfByteString (geneticHash params) == 32

-- | Compile validator
validator :: Validator
validator = mkValidatorScript $$(PlutusTx.compile [|| validateBreeding ||])

-- | Validator hash for policy
validatorHash :: ValidatorHash
validatorHash = Scripts.validatorHash validator

-- | Minting policy for child NFTs
{-# INLINABLE mkPolicy #-}
mkPolicy :: TxOutRef -> BuiltinByteString -> ScriptContext -> Bool
mkPolicy oref geneticHash ctx =
  traceIfFalse "UTxO not consumed" hasUTxO &&
  traceIfFalse "Invalid genetic hash" validHash
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    hasUTxO :: Bool
    hasUTxO = any (\i -> txInInfoOutRef i == oref) $ txInfoInputs info

    validHash :: Bool
    validHash = lengthOfByteString geneticHash == 32

-- | Compile minting policy
policy :: TxOutRef -> BuiltinByteString -> MintingPolicy
policy oref hash = mkMintingPolicyScript $
  $$(PlutusTx.compile [|| \o h -> mkPolicy o h ||])
  `PlutusTx.applyCode` PlutusTx.liftCode oref
  `PlutusTx.applyCode` PlutusTx.liftCode hash

-- | For hackathon demo, we skip full compilation
-- and use off-chain validation with Blockfrost
