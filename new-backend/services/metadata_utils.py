"""
Metadata Utilities - Extract CIP-68 properties from blockchain metadata
"""

import cbor2
from typing import Dict


def extract_properties_from_metadata(metadata: Dict) -> Dict:
    """
    Extract all properties from CIP-68 metadata structure.
    
    Returns a dict with brain_cid, masumi_did, generation, xp, breed_count, etc.
    """
    properties = {}
    
    try:
        # PRIMARY PATH: Check onchain_metadata (this is where CIP-68 stores metadata)
        onchain_metadata = metadata.get("onchain_metadata")
        if onchain_metadata and isinstance(onchain_metadata, dict):
            # CIP-68 stores properties as hex-encoded CBOR string
            properties_raw = onchain_metadata.get("properties")
            
            # Try to decode CBOR if properties is a hex string
            if isinstance(properties_raw, str) and len(properties_raw) > 0:
                try:
                    # Convert hex string to bytes
                    properties_bytes = bytes.fromhex(properties_raw)
                    # Decode CBOR
                    decoded = cbor2.loads(properties_bytes)
                    
                    # CIP-68 wraps properties in CBORTag(121, [dict, version])
                    if isinstance(decoded, cbor2.CBORTag) and decoded.tag == 121:
                        # Unwrap the tag - data is [properties_dict, version]
                        if isinstance(decoded.value, list) and len(decoded.value) > 0:
                            props_dict = decoded.value[0]  # First element is the properties dict
                        else:
                            props_dict = decoded.value
                    else:
                        props_dict = decoded
                    
                    # Handle byte keys and values
                    if isinstance(props_dict, dict):
                        for key, value in props_dict.items():
                            # Convert byte keys to strings
                            try:
                                key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
                            except (UnicodeDecodeError, AttributeError):
                                # If key can't be decoded, skip this property
                                continue
                            
                            # Convert byte values to strings (or handle lists/other types)
                            if isinstance(value, bytes):
                                try:
                                    value = value.decode('utf-8')
                                except UnicodeDecodeError:
                                    # If bytes can't be decoded as UTF-8, convert to hex string
                                    value = value.hex()
                            elif isinstance(value, list):
                                # Handle lists (e.g., parents array)
                                value = [item.decode('utf-8') if isinstance(item, bytes) else str(item) for item in value]
                            elif not isinstance(value, (str, int, float, bool, type(None))):
                                # Convert any other non-serializable type to string
                                value = str(value)
                            
                            properties[key_str] = value
                    
                    return properties
                except Exception as e:
                    print(f"⚠️  [Metadata] Failed to decode CBOR properties: {e}")
        
        # Fallback: Check asset_data.onchain_metadata if available
        asset_data = metadata.get("asset_data")
        if asset_data and isinstance(asset_data, dict):
            onchain = asset_data.get("onchain_metadata", {})
            if isinstance(onchain, dict):
                properties_raw = onchain.get("properties")
                if isinstance(properties_raw, str) and len(properties_raw) > 0:
                    try:
                        properties_bytes = bytes.fromhex(properties_raw)
                        decoded = cbor2.loads(properties_bytes)
                        
                        if isinstance(decoded, cbor2.CBORTag) and decoded.tag == 121:
                            if isinstance(decoded.value, list) and len(decoded.value) > 0:
                                props_dict = decoded.value[0]
                            else:
                                props_dict = decoded.value
                        else:
                            props_dict = decoded
                        
                        if isinstance(props_dict, dict):
                            for key, value in props_dict.items():
                                # Convert byte keys to strings
                                try:
                                    key_str = key.decode('utf-8') if isinstance(key, bytes) else str(key)
                                except (UnicodeDecodeError, AttributeError):
                                    # If key can't be decoded, skip this property
                                    continue
                                
                                # Convert byte values to strings (or handle lists/other types)
                                if isinstance(value, bytes):
                                    try:
                                        value = value.decode('utf-8')
                                    except UnicodeDecodeError:
                                        # If bytes can't be decoded as UTF-8, convert to hex string
                                        value = value.hex()
                                elif isinstance(value, list):
                                    # Handle lists (e.g., parents array)
                                    value = [item.decode('utf-8') if isinstance(item, bytes) else str(item) for item in value]
                                elif not isinstance(value, (str, int, float, bool, type(None))):
                                    # Convert any other non-serializable type to string
                                    value = str(value)
                                
                                properties[key_str] = value
                        
                        return properties
                    except Exception as e:
                        print(f"⚠️  [Metadata] Failed to decode CBOR properties from asset_data: {e}")
        
        return properties
    
    except Exception as e:
        print(f"⚠️  [Metadata] Error extracting properties: {e}")
        return properties

