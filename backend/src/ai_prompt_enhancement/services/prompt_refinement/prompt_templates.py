"""
Templates for AI prompt analysis and comparison.
"""

ANALYSIS_TEMPLATE = """
Analyze the following prompt for quality and provide improvement suggestions.

Prompt:
{prompt}

Context:
{context}

Provide your analysis in the following JSON format:
{
    "metrics": {
        "clarity": {
            "score": float (0-1),
            "description": "Detailed explanation of clarity score",
            "suggestions": ["List of clarity improvements"]
        },
        "specificity": {
            "score": float (0-1),
            "description": "Detailed explanation of specificity score",
            "suggestions": ["List of specificity improvements"]
        },
        "completeness": {
            "score": float (0-1),
            "description": "Detailed explanation of completeness score",
            "suggestions": ["List of completeness improvements"]
        }
    },
    "suggestions": ["List of overall improvements"],
    "enhanced_prompt": "An improved version of the prompt"
}
"""

COMPARISON_TEMPLATE = """
Compare the original and enhanced prompts and provide detailed analysis.

Original Prompt:
{original_prompt}

Enhanced Prompt:
{enhanced_prompt}

Provide your comparison in the following JSON format:
{
    "original_prompt": {
        "prompt": "Original prompt text",
        "metrics": {
            "clarity": {
                "score": float (0-1),
                "description": "Explanation of clarity",
                "suggestions": ["List of suggestions"]
            }
        },
        "suggestions": ["List of suggestions for original"]
    },
    "enhanced_prompt": {
        "prompt": "Enhanced prompt text",
        "metrics": {
            "clarity": {
                "score": float (0-1),
                "description": "Explanation of clarity",
                "suggestions": ["List of suggestions"]
            }
        },
        "suggestions": ["List of suggestions for enhanced"]
    }
}
""" 