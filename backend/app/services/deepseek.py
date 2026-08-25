import os
from openai import AsyncOpenAI

def get_client_and_model(route: str = "deepseek"):
    groq_key = os.getenv('GROQ_API_KEY', '').strip()
    openrouter_key = os.getenv('OPENROUTER_API_KEY', '').strip()
    deepseek_key = os.getenv('DEEPSEEK_API_KEY', '').strip()

    # Prioritize DeepSeek as primary because the configured Groq model is unsupported
    if deepseek_key and deepseek_key != 'sk-placeholder':
        return AsyncOpenAI(api_key=deepseek_key, base_url='https://api.deepseek.com'), os.getenv('DEEPSEEK_MODEL', 'deepseek-chat')
    elif groq_key:
        return AsyncOpenAI(api_key=groq_key, base_url='https://api.groq.com/openai/v1'), os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
    elif openrouter_key:
        return AsyncOpenAI(api_key=openrouter_key, base_url='https://openrouter.ai/api/v1'), os.getenv('OPENROUTER_MODEL', 'meta-llama/llama-3.3-70b-instruct:free')
    else:
        return AsyncOpenAI(api_key='sk-placeholder', base_url='https://api.deepseek.com'), 'deepseek-chat'

def should_use_deepseek(user_prompt: str) -> bool:
    text = user_prompt.lower()
    
    # Extract original user query from structured prompt if present
    if "query:\n" in text:
        parts = text.split("query:\n", 1)
        if len(parts) > 1 and "\nevidence:" in parts[1]:
            text = parts[1].split("\nevidence:", 1)[0]
            
    text = text.strip()
    
    # If the user query is very short (greetings, simple yes/no, etc.)
    if len(text) < 15:
        return False
        
    complex_indicators = [
        "analyze", "audit", "compare", "difference", "explain", "review", 
        "draft", "contract", "agreement", "clause", "vs", "versus",
        "precedent", "judgement", "ruling", "statute", "constitution",
        "legal opinion", "liability", "suit", "appeal", "writ", "petition",
        "kyon", "kya", "batao", "why", "how", "evaluate", "details",
        "ipc", "bns", "crpc", "bnss", "evidence act"
    ]
    
    # Route to DeepSeek if query contains complex keywords or is relatively detailed
    if len(text) > 80 or any(indicator in text for indicator in complex_indicators):
        return True
        
    return False

async def chat(system: str, user: str):
    # Determine routing based on query complexity
    route = "deepseek" if should_use_deepseek(user) else "groq"
    
    client, model = get_client_and_model(route)
    print(f"Routing request to model: {model} (route: {route})")
    
    r = await client.chat.completions.create(
        model=model,
        messages=[
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': user}
        ],
        temperature=0.2
    )
    return r.choices[0].message.content

