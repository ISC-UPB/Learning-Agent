Given the following content: {{content}}
Your task is to generate multiple-choice questions about that content in JSON format.

REQUIRED STRUCTURE for the response:
```json
{
    "question": "Clear and concise question text",
    "options": ["opción 1", "opción 2", "opción 3", "opción 4"],
    "correctAnswer": numerical_index (0-3),
    "explanation": "Detailed explanation in Spanish of why this answer is correct",
}
````

INSTRUCTIONS:
- Generate questions relevant to software developers
- Include exactly 4 answer options, with only one being correct
- The correct answer must be indicated by its index (0-3)
- Provide a detailed technical explanation in Spanish
- RESPOND EXCLUSIVEMENTE with the valid JSON object, without any additional text
- if content provided is not enough for 4 options, generate additional options from your knowledge base.

Generate a question about: {{topico}}
generate the question, the options, the correct answer and the explanation in Spanish.