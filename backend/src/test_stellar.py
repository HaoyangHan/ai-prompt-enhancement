from ai_prompt_enhancement.services.prompt_refinement.stellar_service import StellarService
from llama_index.core.prompts import PromptTemplate
import asyncio

async def main():
    print("Starting Stellar Service...")
    stellar_service = StellarService()
    await stellar_service.initialize_client()
    
    # Test joke about topic
    prompt = PromptTemplate("tell me a joke about {topic}")
    prediction = await stellar_service.joke_about_topic(topic="cats")
    print(f"Prediction: {prediction}")
    
    # Test analyze prompt
    analysis = await stellar_service.analyze_prompt("Write a function to calculate the factorial of a number.")
    print(f"Analysis: {analysis}")
    
    # Test enhance prompt
    enhancement = await stellar_service.enhance_prompt("Write a function to calculate the factorial of a number.")
    print(f"Enhancement: {enhancement}")
    
    # Test compare prompts
    comparison = await stellar_service.compare_prompts(
        "Write a function to calculate the factorial of a number.",
        "Write a recursive function in Python to calculate the factorial of a number. Include error handling for negative inputs and return 1 for input 0."
    )
    print(f"Comparison: {comparison}")

if __name__ == "__main__":
    print("Starting Stellar Service...")
    asyncio.run(main()) 