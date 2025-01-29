from typing import List, Dict

class EvaluationPrompt:
    def __init__(self, id: str, name: str, description: str, prompt: str, variables: List[str]):
        self.id = id
        self.name = name
        self.description = description
        self.prompt = prompt
        self.variables = variables

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "prompt": self.prompt,
            "variables": self.variables
        }

# Predefined evaluation prompts
EVALUATION_PROMPTS = [
    EvaluationPrompt(
        id="sentiment",
        name="Sentiment Analysis",
        description="Evaluate the sentiment of text and provide a detailed explanation.",
        prompt="Analyze the sentiment of the following text: {text}. Provide a rating from 1-5 and explain your reasoning.",
        variables=["text"]
    ),
    EvaluationPrompt(
        id="toxicity",
        name="Toxicity Detection",
        description="Detect and explain toxic content in text.",
        prompt="Evaluate if the following text contains toxic content: {text}. Rate the toxicity level from 1-5 and explain why.",
        variables=["text"]
    ),
    EvaluationPrompt(
        id="coherence",
        name="Text Coherence",
        description="Evaluate the coherence and flow of text.",
        prompt="Rate the coherence of this text: {text}. Provide a score from 1-5 and explain what makes it coherent or incoherent.",
        variables=["text"]
    ),
    EvaluationPrompt(
        id="grammar",
        name="Grammar Check",
        description="Evaluate the grammatical correctness of the text.",
        prompt="Review the following text for grammatical errors: {text}. Rate the grammar from 1-5 and list any errors found.",
        variables=["text"]
    ),
    EvaluationPrompt(
        id="relevance",
        name="Topic Relevance",
        description="Evaluate how well the text stays on topic.",
        prompt="Assess if the following text is relevant to the topic {topic}: {text}. Rate relevance from 1-5 and explain your rating.",
        variables=["topic", "text"]
    ),
    EvaluationPrompt(
        id="factual_accuracy",
        name="Factual Accuracy",
        description="Evaluate the factual accuracy and reliability of the generated content.",
        prompt="Assess the factual accuracy of this generated text: {generated_text}. Compare it with the reference: {reference_text}. Rate accuracy from 1-5 and identify any factual errors.",
        variables=["generated_text", "reference_text"]
    ),
    EvaluationPrompt(
        id="instruction_following",
        name="Instruction Following",
        description="Evaluate how well the output follows the given instructions.",
        prompt="Given the instruction: {instruction} and the output: {output}, rate how well the output follows the instruction from 1-5. Explain any deviations or missing elements.",
        variables=["instruction", "output"]
    ),
    EvaluationPrompt(
        id="creativity_originality",
        name="Creativity & Originality",
        description="Assess the creativity and originality of the generated content.",
        prompt="Evaluate the creativity and originality of this content: {content}. Consider uniqueness, innovation, and unexpected elements. Rate from 1-5 and explain your rating.",
        variables=["content"]
    ),
    EvaluationPrompt(
        id="bias_fairness",
        name="Bias & Fairness",
        description="Detect potential biases and assess fairness in the content.",
        prompt="Analyze this text for potential biases: {text}. Consider gender, racial, cultural, or other biases. Rate fairness from 1-5 and explain any identified biases.",
        variables=["text"]
    )
]
