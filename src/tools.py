import os
import time
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class DirectorTools:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def generate_dialogue(self, scene_state: dict, user_command: str) -> list:
        """
        Uses Gemini to generate new dialogue lines based on the scene state and user command.
        """
        # Construct the context from the last 5 lines to save tokens
        recent_lines = scene_state.get('lines', [])[-5:]
        history_text = "\n".join([f"{l['actorId']}: {l['text']}" for l in recent_lines])
        
        actors_list = ", ".join([a['name'] for a in scene_state.get('actors', [])])
        setting = scene_state.get('setting', 'Unknown')

        prompt = f"""
        You are a scriptwriter for a movie.
        
        CONTEXT:
        Setting: {setting}
        Characters: {actors_list}
        Recent Dialogue:
        {history_text}

        DIRECTOR INSTRUCTION: "{user_command}"

        TASK:
        Generate 2-3 lines of dialogue or action keys based on the instruction.
        Return raw JSON only. Format:
        {{
            "newLines": [
                {{ "actorId": "hero_id", "text": "Line of dialogue..." }},
                {{ "actorId": "villain_id", "text": "Response..." }}
            ]
        }}
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
        # Simulate processing time
        time.sleep(0.5) 
        
        # Return a mock URL
        # In a real hackathon, you'd upload the audio to S3/Cloudinary and return that URL
        return f"https://via.placeholder.com/150?text=Audio+For:+{text[:10]}"

# Instantiate a singleton to be used by the planner
tools = DirectorTools()