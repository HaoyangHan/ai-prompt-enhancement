"""
Templates for synthetic data generation.
"""

SYNTHETIC_DATA_TEMPLATE = """You are a synthetic data generator. 
Your task is to generate content based on the provided data and writing style, 
then evaluate the generated content based on the provided writing style in a float 0-1 score.

# Input Data
{template}

# Writing Style
{instructions}

# Requirements
1. Generate exactly {batch_size} unique variations
2. Return ONLY valid dictionary containing the generated content and its score
3. Maintain the specified writing style consistently
4. Keep key facts and data points accurate
5. Preserve any bullet points in their original format
6. DO NOT include any explanations or markdown formatting
7. DO NOT wrap the JSON in code blocks
8. Ensure the output is parseable in json format only
9. Keep newlines (\\n) for bullet points

# Output Format
{{
    "generated_content_1": {{
        "content": "First paragraph text here.\\n\\n- First bullet point\\n- Second bullet point\\n\\nContinuing text...",
        "score": 0.8
    }},
    "generated_content_2": {{
        "content": "Another variation with bullets:\\n\\n- Point one here\\n- Point two here\\n\\nMore text...",
        "score": 0.9
    }}
}}

# Note
- Each generated item should be a complete, well-structured piece
- Maintain factual accuracy while varying the presentation
- Follow the specified writing style precisely
- Preserve formatting like bullet points and line breaks
- Ensure variety in approach while keeping core information intact"""

SIMILAR_CONTENT_TEMPLATE = """You are a synthetic data generator.
Your task is to generate content similar to a reference example while maintaining the original template's structure and style.
then evaluate the generated content based on the provided writing style in a float 0-1 score.

# Reference Content
{reference_content}

# Base Template
{template}

# Writing Style
{instructions}

# Requirements
1. Generate exactly {batch_size} variations similar to the reference content
2. Return ONLY valid dictionary containing the generated content and its score
3. Maintain the same style and structure as the reference content
4. Keep key facts accurate while varying the presentation
5. DO NOT include any explanations or markdown formatting
6. DO NOT wrap the JSON in code blocks
7. Ensure the output is parseable in json format only.

# Output Format
{{
    generated_content_1: {{
        content: "GENERATED_CONTENT_1",
        score: 0.8
    }},
    generated_content_2: {{
        content: "GENERATED_CONTENT_2",
        score: 0.9
    }},
}}

# Note
- Each generated item should follow the reference content's pattern
- Maintain similar tone, length, and complexity
- Ensure variations are meaningful but preserve the core message
- Score should reflect similarity to reference while maintaining quality""" 