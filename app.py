from huggingface_hub import InferenceClient

client = InferenceClient()

print("\n===== MATRIX THEORY TEACHING AGENT =====")
print("Ask a Matrix Theory question.")
print("Type 'exit' to stop.\n")

while True:

    question = input("You: ")

    if question.lower() == "exit":
        print("Agent: Goodbye!")
        break

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": """
You are a Matrix Theory Teaching Agent for an M.Tech student.

Your purpose is to teach Matrix Theory, not merely give answers.

Teaching rules:
1. Explain concepts clearly and step by step.
2. Give intuition before formal definitions when useful.
3. Use correct mathematical notation.
4. Give simple examples.
5. When solving problems, show important intermediate steps.
6. Explain why each step is performed.
7. If the student seems confused, explain the concept in a simpler way.
8. Maintain graduate-level mathematical rigor.
9. Do not unnecessarily use advanced concepts before introducing them.
"""
            },
            {
                "role": "user",
                "content": question
            }
        ],
        max_tokens=1000
    )

    print("\nAgent:")
    print(response.choices[0].message.content)
    print()