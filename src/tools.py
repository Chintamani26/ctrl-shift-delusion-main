"""
DirectorTools: Tool integration module for Gemini API and TTS.
This module provides the actual implementation of tool calls used by the executor.
"""

import os
import asyncio
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from .env file
# Try to load from project root first, then current directory
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()  # Try current directory

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here" or GEMINI_API_KEY.strip() == "":
    print("[ERROR] GEMINI_API_KEY not found or not set in .env file!")
    print("[ERROR] Please create a .env file in the project root with: GEMINI_API_KEY=your_actual_key")
    print("[ERROR] Get your API key from: https://makersuite.google.com/app/apikey")
    print("[ERROR] The backend will start but API calls will fail until the key is set.")
    # Don't raise error - let the server start so user can see the error message
    GEMINI_API_KEY = None

if GEMINI_API_KEY:
    # Explicitly configure Gemini with API key (don't rely on default credentials)
    genai.configure(api_key=GEMINI_API_KEY)
    print(f"[INFO] Gemini API configured successfully (key length: {len(GEMINI_API_KEY)} chars)")
else:
    print("[WARNING] Gemini API not configured - API calls will fail!")

class DirectorTools:
    def __init__(self):
        # Use available models - gemini-2.0-flash is widely available
        # Fallback chain: gemini-2.0-flash -> gemini-pro-latest -> gemini-pro
        try:
            self.model = genai.GenerativeModel('gemini-2.0-flash')
            print("[INFO] Using model: gemini-2.0-flash")
        except Exception as e:
            print(f"[WARNING] gemini-2.0-flash not available, trying gemini-pro-latest: {e}")
            try:
                self.model = genai.GenerativeModel('gemini-pro-latest')
                print("[INFO] Using model: gemini-pro-latest")
            except Exception as e2:
                print(f"[WARNING] gemini-pro-latest failed, trying gemini-pro: {e2}")
                try:
                    self.model = genai.GenerativeModel('gemini-pro')
                    print("[INFO] Using model: gemini-pro")
                except Exception as e3:
                    raise ValueError(f"Could not initialize any Gemini model. Last error: {e3}")

    async def generate_dialogue(self, scene_state: dict, user_command: str) -> list:
        """
        Uses Gemini to generate new dialogue lines based on the scene state and user command.
        """
        # Construct the context from the last 5 lines to save tokens
        recent_lines = scene_state.get('lines', [])[-5:]
        history_text = "\n".join([f"{l['actorId']}: {l['text']}" for l in recent_lines])
        
        actors_list = ", ".join([a['name'] for a in scene_state.get('actors', [])])
        setting = scene_state.get('setting', 'Unknown')

        # Get actor IDs for reference
        actor_ids = {a['name']: a['id'] for a in scene_state.get('actors', [])}
        actor_id_list = ", ".join([f"{name} (id: {id})" for name, id in actor_ids.items()])
        
        prompt = f"""You are a professional scriptwriter for a movie. Generate dialogue and action lines based on the director's instruction.

SCENE CONTEXT:
- Setting: {setting}
- Characters: {actors_list}
- Character IDs: {actor_id_list}
- Recent Dialogue:
{history_text if history_text else "(Scene just started - no previous dialogue)"}

DIRECTOR'S INSTRUCTION: "{user_command}"

IMPORTANT: The director's instruction is the PRIMARY directive. Generate dialogue that DIRECTLY responds to and fulfills this instruction.

TASK:
Generate 2-3 lines of dialogue or action that directly address the director's instruction: "{user_command}"

Return ONLY raw JSON (no markdown, no explanations). Format:
{{
    "newLines": [
        {{ "actorId": "hero", "text": "Dialogue that fulfills the director's instruction..." }},
        {{ "actorId": "ai", "text": "Response that continues the scene..." }}
    ]
}}

Use the exact actor IDs from the character list above. Make sure the dialogue directly relates to: "{user_command}"
"""

        try:
            response = self.model.generate_content(prompt)
            # Clean up potential markdown formatting from the response
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            data = json.loads(clean_text)
            return data.get("newLines", [])
        except Exception as e:
            print(f"Error generating dialogue: {e}")
            # Fallback error line
            return [{"actorId": "system", "text": f"Error parsing script: {str(e)}"}]

    async def generate_tts_audio(self, text: str, voice_id: str) -> str:
        """
        Mocks the Text-to-Speech generation.
        TODO: Replace with ElevenLabs API call.
        """
        # Simulate processing time (non-blocking)
        await asyncio.sleep(0.5) 
        
        # Return a mock URL
        # In a real hackathon, you'd upload the audio to S3/Cloudinary and return that URL
        return f"https://via.placeholder.com/150?text=Audio+For:+{text[:10]}"

# Instantiate a singleton to be used by the planner
tools = DirectorTools()