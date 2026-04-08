#!/usr/bin/env python3
"""
Homework Gamification AI Backend
Uses Groq API for real AI generation (or mock data if no key provided)
"""

import os
import json
import requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# Get the directory where the app is running
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
CORS(app)

# Get Groq API key from environment variable
# Set it with: $env:GROQ_API_KEY="your_api_key_here"
GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '').strip()
GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
USE_REAL_API = bool(GROQ_API_KEY)

@app.route('/')
def serve_index():
    """Serve the main index.html file"""
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files (CSS, JS, etc.)"""
    return send_from_directory(BASE_DIR, filename)

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})

@app.route('/api/generate', methods=['POST'])
def generate():
    """Generate content using Groq API or fallback to mock data"""
    try:
        data = request.json
        prompt = data.get('prompt', '').strip()
        
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Try real API if key is available
        if USE_REAL_API:
            content = call_groq_api(prompt)
        else:
            # Fall back to mock data
            content = generate_mock_content(prompt)
        
        return jsonify({'content': content})
    
    except Exception as error:
        print(f'Generation error: {error}')
        # Always fall back to mock if API fails
        try:
            content = generate_mock_content(prompt)
            return jsonify({'content': content})
        except:
            return jsonify({'error': str(error)}), 500

def call_groq_api(prompt):
    """Call Groq API for content generation"""
    headers = {
        'Authorization': f'Bearer {GROQ_API_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': 'llama-3.3-70b-versatile',  # Current available model
        'messages': [
            {'role': 'user', 'content': prompt}
        ],
        'temperature': 0.7,
        'max_tokens': 2048
    }
    
    response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=30)
    
    if response.status_code != 200:
        raise Exception(f"Groq API error: {response.text}")
    
    result = response.json()
    if 'choices' in result and len(result['choices']) > 0:
        return result['choices'][0]['message']['content']
    else:
        raise Exception("No content in API response")

def generate_mock_content(prompt):
    """Generate realistic mock content for demo (always 4 choices per question)"""
    
    if 'question' in prompt.lower() and 'multiple' in prompt.lower():
        return """Q1. What is the process by which plants convert light energy into chemical energy?
A) Respiration
B) Photosynthesis
C) Fermentation
D) Transpiration
Answer: B

Q2. Which wavelength of light is most important for photosynthesis?
A) Red and blue light
B) Yellow light
C) Green light
D) Infrared light
Answer: A

Q3. What is the primary product of the light-dependent reactions?
A) Glucose
B) Oxygen and ATP
C) Carbon dioxide
D) Water
Answer: B

Q4. The light-independent reactions of photosynthesis are also known as:
A) Calvin Cycle
B) Krebs Cycle
C) Electron Transport Chain
D) Glycolysis
Answer: A

Q5. Where do the light-dependent reactions occur in the chloroplast?
A) Stroma
B) Thylakoid membrane
C) Ribosome
D) Vacuole
Answer: B"""
    
    elif 'flashcard' in prompt.lower() or 'flashcard' in prompt.lower():
        return """Q: What is photosynthesis?
A: The process by which plants use sunlight, water, and carbon dioxide to produce glucose and oxygen

Q: What are the two main stages of photosynthesis?
A: Light-dependent reactions (in thylakoids) and light-independent reactions/Calvin Cycle (in stroma)

Q: What pigment absorbs light energy in photosynthesis?
A: Chlorophyll, primarily in chlorophyll a and chlorophyll b

Q: What gas do plants release as a byproduct of photosynthesis?
A: Oxygen (O2)

Q: Where in the plant cell does photosynthesis occur?
A: In the chloroplasts

Q: What is the role of ATP in photosynthesis?
A: ATP provides energy for the Calvin Cycle to convert CO2 into glucose"""
    
    else:
        # Generic educational response
        return """Topic: The subject you requested

Key Point 1: This app is running with Groq AI integration ready!

Key Point 2: The app architecture is set up with a secure backend, so all API keys stay hidden from the browser.

Key Point 3: For now, high-quality mock responses are displayed.

⚡ QUICK SETUP - Enable Real AI (2 minutes):
1. Go to https://console.groq.com and sign up (free)
2. Create an API key
3. In PowerShell, run: $env:GROQ_API_KEY="your_key_here"
4. Restart the backend server
5. Your app will now use real Groq AI!"""

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f'🚀 AI Backend Server running on http://localhost:{port}')
    print(f'📡 API endpoint: http://localhost:{port}/api/generate')
    
    if USE_REAL_API:
        print(f'✅ Using GROQ API (Real AI enabled!)')
        print(f'🔑 API Key: {GROQ_API_KEY[:10]}...')
    else:
        print(f'✅ Using Mock Data (High-quality demo mode)')
        print(f'')
        print(f'⚡ To enable REAL AI:')
        print(f'   1. Get free key from https://console.groq.com')
        print(f'   2. In PowerShell: $env:GROQ_API_KEY="your_key_here"')
        print(f'   3. Restart this server')
    
    app.run(debug=False, host='0.0.0.0', port=port)
