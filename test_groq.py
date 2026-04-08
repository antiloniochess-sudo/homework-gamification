import os
import requests

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

if not GROQ_API_KEY:
    print("Error: GROQ_API_KEY environment variable not set!")
    print("Set it with: $env:GROQ_API_KEY=\"your_key_here\"")
    exit(1)

headers = {
    'Authorization': f'Bearer {GROQ_API_KEY}',
    'Content-Type': 'application/json'
}

payload = {
    'model': 'llama-3.1-70b-versatile',
    'messages': [
        {'role': 'user', 'content': 'Generate exactly 2 multiple-choice questions about World War 2. Each question must have exactly 4 choices (A, B, C, D). Format: Q1. Question text. A) Choice. B) Choice. C) Choice. D) Choice. Answer: B'}
    ],
    'temperature': 0.7,
    'max_tokens': 2048
}

print("Sending request to Groq API with llama-3.1-70b-versatile...")
response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
print(f"Status: {response.status_code}")
print(f"Response:\n{response.text}")

