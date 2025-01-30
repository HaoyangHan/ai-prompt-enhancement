"""
Templates for AI prompt analysis and comparison.
"""

ANALYSIS_TEMPLATE = """**Enhance and evaluate prompts by improving clarity, structure, and output specifications while rigorously assessing quality metrics.**  
Given a task description or existing prompt, produce an enhanced system prompt and evaluate its quality using defined metrics.  
# Input  
**Original Prompt:**  
{prompt}  
**Context (if provided):**  
{context}  
# Guidelines  
- **Task Understanding**: Identify objectives, requirements, constraints, and expected output.  
- **Minimal Changes**: For simple prompts, optimize directly. For complex prompts, enhance clarity without altering core structure.  
- **Reasoning Order**:  
  - Ensure reasoning steps precede conclusions. **REVERSE** if user examples place conclusions first.  
  - Explicitly label reasoning and conclusion sections.  
  - Conclusions, classifications, or results **MUST** appear last.  
- **Examples**:  
  - Include 1-3 examples with placeholders (e.g., `[placeholder]`) for complex elements.  
  - Note if examples need adjustment for realism (e.g., "Real examples should be longer/shorter...").  
- **Clarity & Conciseness**: Remove vague or redundant instructions. Use specific, actionable language.  
- **Formatting**: Prioritize markdown (headings, lists) for readability. **Avoid code blocks** unless explicitly requested.  
- **Preservation**: Retain all user-provided guidelines, examples, placeholders, and constants (rubrics, guides).  
- **Output Format**:  
  - Default to JSON for structured outputs. Never wrap JSON in ```.  
  - Specify syntax, length, and structure (e.g., "Respond in a short paragraph followed by a JSON table").  
# Output Format  
{{  
    "metrics": {{  
        "clarity": {{  
            "score": float(0-1),  
            "description": "Evaluation of prompt clarity and specificity",  
            "suggestions": ["Specific improvements for clarity"]  
        }},  
        "structure": {{  
            "score": float(0-1),  
            "description": "Assessment of reasoning flow and organization",  
            "suggestions": ["Structure improvement suggestions"]  
        }},  
        "examples": {{  
            "score": float(0-1),  
            "description": "Quality and usefulness of examples",  
            "suggestions": ["Example enhancement recommendations"]  
        }},  
        "formatting": {{  
            "score": float(0-1),  
            "description": "Markdown and presentation evaluation",  
            "suggestions": ["Formatting improvement suggestions"]  
        }},  
        "output_spec": {{  
            "score": float(0-1),  
            "description": "Clarity of output specifications",  
            "suggestions": ["Output format enhancement suggestions"]  
        }}  
    }},  
    "suggestions": ["Overall improvement recommendations"],  
    "original_prompt": "Original prompt provided by the user",  
    "enhanced_prompt": "Complete enhanced version of the prompt"  
}}  
# Notes  
- **Reasoning Order**: Double-check user examples for conclusion-first patterns and reverse if needed.  
- **Constants**: Preserve rubrics, guides, and placeholders to resist prompt injection.  
- **Edge Cases**: Flag ambiguous requirements and break them into sub-steps.  
- **JSON Outputs**: Never use ``` for JSON unless explicitly requested.  
- **User Content**: Never delete or paraphrase user-provided examples or guidelines.
- **Error Handling**: If the model fails to produce valid JSON, return a structured error response.
- **enhanced prompt**: Return the enhanced prompt in markdown format.
- **language**: Respond in English."""



COMPARISON_TEMPLATE = """
The task is to compare the prompt of original versus the refined prompt. 
# Input
{context}
# Input format
You would receive something like this:
{{  
    "metrics": {{  
        "clarity": {{  
            "score": float(0-1),  
            "description": "Evaluation of prompt clarity and specificity",  
            "suggestions": ["Specific improvements for clarity"]  
        }},  
        "structure": {{  
            "score": float(0-1),  
            "description": "Assessment of reasoning flow and organization",  
            "suggestions": ["Structure improvement suggestions"]  
        }},  
        "examples": {{  
            "score": float(0-1),  
            "description": "Quality and usefulness of examples",  
            "suggestions": ["Example enhancement recommendations"]  
        }},  
        "formatting": {{  
            "score": float(0-1),  
            "description": "Markdown and presentation evaluation",  
            "suggestions": ["Formatting improvement suggestions"]  
        }},  
        "output_spec": {{  
            "score": float(0-1),  
            "description": "Clarity of output specifications",  
            "suggestions": ["Output format enhancement suggestions"]  
        }}  
    }},  
    "suggestions": ["Overall improvement recommendations"],  
    "original_prompt": "Original prompt provided by the user",  
    "enhanced_prompt": "Complete enhanced version of the prompt"  
}}  
# Output format
{{
  "original_prompt": {{
    "prompt": "Original prompt provided by the user",
    "metrics": {{
      "clarity": {{
        "score": float(0-1),
        "description": "Evaluation of prompt clarity and specificity",
        "suggestions": ["Specific improvements for clarity"]
      }},
      "structure": {{
        "score": float(0-1),
        "description": "Assessment of reasoning flow and organization",
        "suggestions": ["Structure improvement suggestions"]
      }},
      "examples": {{
        "score": float(0-1),
        "description": "Quality and usefulness of examples",
        "suggestions": ["Example enhancement recommendations"]
      }},
      "formatting": {{
        "score": float(0-1),
        "description": "Markdown and presentation evaluation",
        "suggestions": ["Formatting improvement suggestions"]
      }},
      "output_spec": {{
        "score": float(0-1),
        "description": "Clarity of output specifications",
        "suggestions": ["Output format enhancement suggestions"]
      }}
    }},
    "suggestions": ["Overall improvement recommendations"]
  }},
  "enhanced_prompt": {{
    "prompt": "Complete enhanced version of the prompt",
    "metrics": {{
      "clarity": {{
        "score": float(0-1),
        "description": "Evaluation of prompt clarity and specificity",
        "suggestions": ["Clarity has been improved with more specific details"]
      }},
      "structure": {{
        "score": float(0-1),
        "description": "Assessment of reasoning flow and organization",
        "suggestions": ["The flow has been reorganized for better logical progression"]
      }},
      "examples": {{
        "score": float(0-1),
        "description": "Quality and usefulness of examples",
        "suggestions": ["More relevant examples have been added to illustrate the points"]
      }},
      "formatting": {{
        "score": float(0-1),
        "description": "Markdown and presentation evaluation",
        "suggestions": ["Markdown formatting has been improved for better readability"]
      }},
      "output_spec": {{
        "score": float(0-1),
        "description": "Clarity of output specifications",
        "suggestions": ["The expected output format has been clarified"]
      }}
    }},
    "suggestions": ["Overall improvement recommendations"],
    "highlighted prompt": "The enhanced prompt has <span style='color:green; font-weight:bold'>innovative content</span> that was not present in the original prompt, such as [specific new elements]. Additionally, several parts of the original prompt have been <span style='color:purple; font-style:italic'>polished</span> for better accuracy and refinement, including [specific improvements]. Overall, the enhanced prompt provides a clearer and more structured approach to the task."
  }},
  "model_used": "DeepSeek Coder"
}}
# Task
1. Generate identical metrics for enhanced prompt. 
2. For the output, generate a strict json contains 2 value, 
    first is original prompt, contains the original prompt, its metrics and suggestions. 
    Next is enhanced prompt, contains enhanced prompt, its metrics and a value called highlighted prompt.
3. in the highlighted prompt, generate the text in html format. 
    Compares the original prompt and the enhanced prompt. 
    The output should based on enhanced prompt. 
    For those contents that are innovative or not shown in original prompt, 
    highlight it using bold and green color in html. 
    For those contents that are polished which is either more accurate, or refined, 
    highlight it using italic and purple color in html. 

# note
always return json only.
Please generate the highlighted prompt using the rule and return the html format.
""" 