"""
Memory module for storing and retrieving scene context and dialogue history.
Implements a simple in-memory store with context window management.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
import json


class SceneMemory:
    """
    Manages memory for the Director Agent.
    Stores scene state, dialogue history, and provides context retrieval.
    """
    
    def __init__(self, max_history_lines: int = 10):
        """
        Initialize memory store.
        
        Args:
            max_history_lines: Maximum number of recent lines to keep in context
        """
        self.max_history_lines = max_history_lines
        self.scene_states: Dict[str, Dict[str, Any]] = {}  # session_id -> scene_state
        self.dialogue_history: Dict[str, List[Dict[str, Any]]] = {}  # session_id -> lines
        
    def store_scene_state(self, session_id: str, scene_state: Dict[str, Any]) -> None:
        """
        Store or update scene state for a session.
        
        Args:
            session_id: Unique identifier for the session
            scene_state: Complete scene state dictionary
        """
        self.scene_states[session_id] = scene_state.copy()
        # Also update dialogue history
        if 'lines' in scene_state:
            self.dialogue_history[session_id] = scene_state['lines'].copy()
    
    def retrieve_scene_state(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve stored scene state for a session.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            Scene state dictionary or None if not found
        """
        return self.scene_states.get(session_id)
    
    def get_recent_context(self, session_id: str, num_lines: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieve recent dialogue lines for context.
        Uses sliding window to manage token usage.
        
        Args:
            session_id: Unique identifier for the session
            num_lines: Number of recent lines to retrieve
            
        Returns:
            List of recent dialogue lines
        """
        history = self.dialogue_history.get(session_id, [])
        # Return last N lines
        return history[-num_lines:] if len(history) > num_lines else history
    
    def get_actor_context(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve actor information for context.
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            List of actor dictionaries
        """
        scene_state = self.retrieve_scene_state(session_id)
        if scene_state:
            return scene_state.get('actors', [])
        return []
    
    def get_scene_metadata(self, session_id: str) -> Dict[str, Any]:
        """
        Retrieve scene metadata (title, genre, setting).
        
        Args:
            session_id: Unique identifier for the session
            
        Returns:
            Dictionary with title, genre, setting
        """
        scene_state = self.retrieve_scene_state(session_id)
        if scene_state:
            return {
                'title': scene_state.get('title', 'Untitled'),
                'genre': scene_state.get('genre', 'Drama'),
                'setting': scene_state.get('setting', 'Unknown'),
                'currentBeat': scene_state.get('currentBeat', 0)
            }
        return {
            'title': 'Untitled',
            'genre': 'Drama',
            'setting': 'Unknown',
            'currentBeat': 0
        }
    
    def clear_session(self, session_id: str) -> None:
        """
        Clear all memory for a session.
        
        Args:
            session_id: Unique identifier for the session
        """
        if session_id in self.scene_states:
            del self.scene_states[session_id]
        if session_id in self.dialogue_history:
            del self.dialogue_history[session_id]
    
    def log_interaction(self, session_id: str, user_command: str, agent_response: Dict[str, Any]) -> None:
        """
        Log an interaction for observability.
        
        Args:
            session_id: Unique identifier for the session
            user_command: User's director command
            agent_response: Agent's response/actions
        """
        timestamp = datetime.now().isoformat()
        log_entry = {
            'timestamp': timestamp,
            'user_command': user_command,
            'agent_response': agent_response
        }
        # In a production system, this would write to a log file or database
        print(f"[MEMORY LOG] {session_id} | {timestamp} | Command: {user_command}")


# Singleton instance
memory = SceneMemory(max_history_lines=10)

