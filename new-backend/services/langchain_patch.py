"""
LangChain Compatibility Patch

Patches missing attributes in the langchain module to prevent AttributeError
when using older versions of langchain with newer langchain packages.
"""


def apply_langchain_patches():
    """
    Apply all necessary patches to the langchain module.
    This should be called before importing any langchain submodules.
    """
    import langchain
    
    # Patch missing attributes that newer langchain packages expect
    if not hasattr(langchain, 'verbose'):
        langchain.verbose = False
    
    if not hasattr(langchain, 'debug'):
        langchain.debug = False
    
    if not hasattr(langchain, 'llm_cache'):
        langchain.llm_cache = None
    
    # Apply patches immediately when module is imported
    return langchain


# Apply patches when this module is imported
_ = apply_langchain_patches()

