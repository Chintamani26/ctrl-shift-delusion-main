"""
Executor module for executing tool calls and LLM operations.
Handles the "Act" phase of the ReAct pattern.
"""

import json
from typing import Dict, Any, List, Optional
from tools import tools


class ToolExecutor:
    """
    Executes tool calls and manages LLM interactions.
    This is the "executor" that carries out planned actions.
    """
    
    def __init__(self):
        self.tools = tools
        self.execution_log: List[Dict[str, Any]] = []
    
    async def execute_plan(self, plan: Dict[str, Any], scene_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a planned sequence of actions.
        
        Args:
            plan: Dictionary containing planned actions
            scene_state: Current scene state
            
        Returns:
            Dictionary with execution results
        """
        results = {
            'success': True,
            'actions_taken': [],
            'errors': []
        }
        
        # Execute each planned action
        for action in plan.get('actions', []):
            try:
                action_result = await self._execute_action(action, scene_state)
                results['actions_taken'].append({
                    'action': action['type'],
                    'result': action_result,
                    'success': True
                })
            except Exception as e:
                results['success'] = False
                results['errors'].append({
                    'action': action.get('type', 'unknown'),
                    'error': str(e)
                })
                print(f"[EXECUTOR ERROR] Failed to execute {action.get('type')}: {e}")
        
        return results
    
    async def _execute_action(self, action: Dict[str, Any], scene_state: Dict[str, Any]) -> Any:
        """
        Execute a single action.
        
        Args:
            action: Action dictionary with type and parameters
            scene_state: Current scene state
            
        Returns:
            Result of the action execution
        """
        action_type = action.get('type')
        
        if action_type == 'generate_dialogue':
            # Execute dialogue generation using Gemini
            user_command = action.get('user_command', '')
            return await self.tools.generate_dialogue(scene_state, user_command)
        
        elif action_type == 'generate_audio':
            # Execute TTS audio generation
            text = action.get('text', '')
            voice_id = action.get('voice_id', 'default_voice')
            return await self.tools.generate_tts_audio(text, voice_id)
        
        elif action_type == 'initialize_scene':
            # Initialize a new scene
            return self._initialize_default_scene()
        
        else:
            raise ValueError(f"Unknown action type: {action_type}")
    
    def _initialize_default_scene(self) -> Dict[str, Any]:
        """
        Create a default scene state.
        
        Returns:
            Default scene state dictionary
        """
        return {
            "title": "The Golden Hackathon",
            "genre": "Cyberpunk Mystery",
            "setting": "A dimly lit server room in New Delhi.",
            "actors": [
                {
                    "id": "hero",
                    "name": "Arjun",
                    "role": "protagonist",
                    "language": "en-US",
                    "voiceId": "v1",
                    "style": "Nervous"
                },
                {
                    "id": "ai",
                    "name": "Nexus",
                    "role": "supporting",
                    "language": "en-US",
                    "voiceId": "v2",
                    "style": "Robotic"
                }
            ],
            "lines": [],
            "currentBeat": 0
        }
    
    async def call_gemini(self, prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Direct call to Gemini API (used by planner for reasoning).
        
        Args:
            prompt: The prompt to send to Gemini
            context: Optional context dictionary
            
        Returns:
            Gemini's response text
        """
        try:
            # Use the tools' model for consistency
            response = self.tools.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"[EXECUTOR ERROR] Gemini API call failed: {e}")
            raise
    
    def log_execution(self, action: str, result: Any, success: bool = True) -> None:
        """
        Log an execution step for observability.
        
        Args:
            action: Description of the action
            result: Result of the action
            success: Whether the action succeeded
        """
        log_entry = {
            'action': action,
            'success': success,
            'result': str(result)[:100] if result else None  # Truncate for logging
        }
        self.execution_log.append(log_entry)
        if len(self.execution_log) > 100:  # Keep last 100 entries
            self.execution_log = self.execution_log[-100:]


# Singleton instance
executor = ToolExecutor()

