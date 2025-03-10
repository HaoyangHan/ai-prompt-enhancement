from llama_index.llms.azure_openai import AzureOpenAI
from llama_index.llms.openai_like import OpenAILike

from ai_prompt_enhancement.core.config import get_settings
from ai_prompt_enhancement.services.core.auth import get_token

class LlmFactory:
    @staticmethod
    async def stellar() -> OpenAILike:
        """
        Create and return a Stellar model client.
        
        Returns:
            OpenAILike: A configured Stellar model client
        """
        settings = get_settings()
        token_info = await get_token()
        return OpenAILike(
            model=settings.stellar_model,
            api_key=token_info.access_token,
            api_base=settings.stellar_endpoint,
            context_window=4096,
            is_chat_model=True,
            temperature=settings.llm_temperature,
            max_tokens=2000,
            timeout=60*30
        )

    @staticmethod
    async def azure_openai() -> AzureOpenAI:
        """
        Create and return an Azure OpenAI client.
        
        Returns:
            AzureOpenAI: A configured Azure OpenAI client
        """
        settings = get_settings()
        token_info = await get_token()
        return AzureOpenAI(
            model="gpt-4o",
            azure_endpoint=settings.r2d2_azure_endpoint,
            deployment_name=settings.azure_gpt4_deployment,
            api_key=token_info.access_token,
            api_version="2023-05-15",
            additional_kwargs={"user": "SAMPLE_USER"},
            temperature=settings.llm_temperature,
        ) 