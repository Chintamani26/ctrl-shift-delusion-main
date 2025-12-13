import uuid
import time
from typing import Optional, Dict, Any
from tools import tools

class DirectorAgent:
    def __init__(self):
        self.tools = tools

    async def process_turn(self, scene_state: Optional[Dict[str, Any]], user_command: str):
        """
        Orchestrates the director turn:
        1. If no scene exists, create default.
        2. Generate script using Gemini.
        3. Generate Audio for new lines.
        4. Return updated state.
        """
        
        # 1. Initialize State if Empty
        if not scene_state:
            scene_state = {
                "title": "The Golden Hackathon",
                "genre": "Cyberpunk Mystery",
                "setting": "A dimly lit server room in New Delhi.",
                "actors": [
                    {"id": "hero", "name": "Arjun", "role": "protagonist", "language": "en-US", "voiceId": "v1", "style": "Nervous"},
                    {"id": "ai", "name": "Nexus", "role": "supporting", "language": "en-US", "voiceId": "v2", "style": "Robotic"}
                ],
                "lines": [],
                "currentBeat": 0
            }
            # If it's a fresh start, we don't need to generate lines based on command yet, 
            # unless we want an opening line. Let's just return the init state.
            if not user_command:
                return scene_state

        # 2. Generate New Lines (The Thinking Step)
        print(f"Director Agent processing: {user_command}")
        new_lines_data = await self.tools.generate_dialogue(scene_state, user_command)

        # 3. Process Lines & Add Audio (The Action Step)
        processed_lines = []
        for line_data in new_lines_data:
            # Generate Audio
            audio_url = await self.tools.generate_tts_audio(line_data['text'], "default_voice")
            
            # Construct full Line object
            full_line = {
                "id": str(uuid.uuid4()),
                "actorId": line_data.get('actorId', 'unknown'),
                "text": line_data.get('text', '...'),
                "timestamp": int(time.time() * 1000),
                "beatIndex": scene_state['currentBeat'] + 1,
                "audioUrl": audio_url
            }
            processed_lines.append(full_line)

        # 4. Update and Return State
        scene_state['lines'].extend(processed_lines)
        scene_state['currentBeat'] += 1
        
        return scene_state

# Singleton instance
agent = DirectorAgent()