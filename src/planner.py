"""
Planner module implementing the ReAct (Reasoning + Acting) pattern.
Breaks down user goals into sub-tasks and creates execution plans.
"""

import uuid
import time
import json
from typing import Optional, Dict, Any, List
from executor import executor
from memory import memory


class DirectorPlanner:
    """
    Plans the director agent's actions by breaking down user commands into sub-tasks.
    Implements a simplified ReAct pattern:
    1. Reason: Analyze user command and current state
    2. Plan: Break down into actionable sub-tasks
    3. Act: Execute planned actions (delegated to executor)
    4. Observe: Update state and memory
    """
    
    def __init__(self):
        self.executor = executor
        self.memory = memory
    
    async def plan_turn(self, scene_state: Optional[Dict[str, Any]], user_command: str, session_id: str = "default") -> Dict[str, Any]:
        """
        Main planning method: breaks down user command into sub-tasks.
        
        Args:
            scene_state: Current scene state (None if new scene)
            user_command: User's director instruction
            session_id: Session identifier for memory
            
        Returns:
            Execution plan with sub-tasks
        """
        print(f"[PLANNER] Analyzing command: '{user_command}'")
        
        # Step 1: Retrieve relevant memory/context
        context = self._retrieve_context(scene_state, session_id)
        
        # Step 2: Reason about the command (using Gemini for planning)
        reasoning = await self._reason_about_command(user_command, context)
        
        # Step 3: Break down into sub-tasks
        plan = self._create_execution_plan(user_command, context, reasoning)
        
        print(f"[PLANNER] Created plan with {len(plan.get('actions', []))} sub-tasks")
        return plan
    
    def _retrieve_context(self, scene_state: Optional[Dict[str, Any]], session_id: str) -> Dict[str, Any]:
        """
        Retrieve relevant memory and context for planning.
        
        Args:
            scene_state: Current scene state
            session_id: Session identifier
            
        Returns:
            Context dictionary with scene info, recent dialogue, actors
        """
        if scene_state:
            # Store current state in memory
            self.memory.store_scene_state(session_id, scene_state)
            recent_lines = self.memory.get_recent_context(session_id, num_lines=5)
            actors = self.memory.get_actor_context(session_id)
            metadata = self.memory.get_scene_metadata(session_id)
        else:
            # New scene - no context yet
            recent_lines = []
            actors = []
            metadata = {
                'title': 'Untitled',
                'genre': 'Drama',
                'setting': 'Unknown',
                'currentBeat': 0
            }
        
        return {
            'scene_state': scene_state,
            'recent_lines': recent_lines,
            'actors': actors,
            'metadata': metadata,
            'session_id': session_id
        }
    
    async def _reason_about_command(self, user_command: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Use Gemini to reason about the user command and determine what needs to be done.
        This is the "Reasoning" step of ReAct.
        
        Args:
            user_command: User's director instruction
            context: Current context
            
        Returns:
            Reasoning result with identified tasks
        """
        # Build reasoning prompt for Gemini
        recent_dialogue = "\n".join([
            f"{line.get('actorId', 'unknown')}: {line.get('text', '')}"
            for line in context['recent_lines']
        ]) if context['recent_lines'] else "No previous dialogue."
        
        actors_info = ", ".join([
            f"{a.get('name', 'Unknown')} ({a.get('role', 'unknown')})"
            for a in context['actors']
        ]) if context['actors'] else "No actors defined."
        
        reasoning_prompt = f"""You are a film director's AI assistant. Analyze the director's instruction and determine what actions need to be taken.

CURRENT SCENE CONTEXT:
- Setting: {context['metadata'].get('setting', 'Unknown')}
- Genre: {context['metadata'].get('genre', 'Drama')}
- Actors: {actors_info}
- Recent Dialogue:
{recent_dialogue}

DIRECTOR'S INSTRUCTION: "{user_command}"

TASK: Analyze this instruction and determine:
1. Does this require initializing a new scene? (Yes/No)
2. What type of dialogue/action should be generated? (dialogue, action, both)
3. Which actors should be involved? (list actor IDs)
4. How many lines should be generated? (1-3)

Respond in JSON format:
{{
    "needs_initialization": true/false,
    "dialogue_type": "dialogue|action|both",
    "involved_actors": ["actor_id1", "actor_id2"],
    "num_lines": 2,
    "reasoning": "Brief explanation of your analysis"
}}
"""
        
        try:
            # Call Gemini for reasoning
            response_text = await self.executor.call_gemini(reasoning_prompt)
            # Parse JSON response
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            reasoning_result = json.loads(clean_text)
            print(f"[PLANNER] Reasoning: {reasoning_result.get('reasoning', 'No reasoning provided')}")
            return reasoning_result
        except Exception as e:
            print(f"[PLANNER] Reasoning failed, using defaults: {e}")
            # Fallback reasoning
            return {
                "needs_initialization": context['scene_state'] is None,
                "dialogue_type": "dialogue",
                "involved_actors": [a.get('id') for a in context['actors'][:2]] if context['actors'] else [],
                "num_lines": 2,
                "reasoning": "Default reasoning due to parsing error"
            }
    
    def _create_execution_plan(self, user_command: str, context: Dict[str, Any], reasoning: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create an execution plan with sub-tasks based on reasoning.
        
        Args:
            user_command: User's director instruction
            context: Current context
            reasoning: Reasoning result from Gemini
            
        Returns:
            Execution plan with list of actions
        """
        actions: List[Dict[str, Any]] = []
        
        # Sub-task 1: Initialize scene if needed
        if reasoning.get('needs_initialization', False) or context['scene_state'] is None:
            actions.append({
                'type': 'initialize_scene',
                'description': 'Initialize a new scene with default actors and setting'
            })
        
        # Sub-task 2: Generate dialogue/action lines
        actions.append({
            'type': 'generate_dialogue',
            'description': f"Generate {reasoning.get('num_lines', 2)} lines of {reasoning.get('dialogue_type', 'dialogue')}",
            'user_command': user_command,
            'dialogue_type': reasoning.get('dialogue_type', 'dialogue'),
            'num_lines': reasoning.get('num_lines', 2),
            'involved_actors': reasoning.get('involved_actors', [])
        })
        
        # Sub-task 3: Generate audio for each line (will be done after dialogue generation)
        # This is added dynamically after dialogue is generated
        
        return {
            'plan_id': str(uuid.uuid4()),
            'user_command': user_command,
            'reasoning': reasoning,
            'actions': actions,
            'context': {
                'session_id': context['session_id'],
                'current_beat': context['metadata'].get('currentBeat', 0)
            }
        }
    
    async def process_turn(self, scene_state: Optional[Dict[str, Any]], user_command: str, session_id: str = "default") -> Dict[str, Any]:
        """
        Main orchestration method: Plan -> Execute -> Update State.
        This is the complete ReAct cycle.
        
        Args:
            scene_state: Current scene state (None if new scene)
            user_command: User's director instruction
            session_id: Session identifier
            
        Returns:
            Updated scene state
        """
        # Step 1: PLAN - Break down into sub-tasks
        plan = await self.plan_turn(scene_state, user_command, session_id)
        
        # Step 2: EXECUTE - Run the planned actions
        execution_results = await self.executor.execute_plan(plan, scene_state or {})
        
        # Step 3: OBSERVE - Process results and update state
        updated_state = await self._process_execution_results(
            scene_state,
            plan,
            execution_results,
            session_id
        )
        
        # Step 4: STORE - Update memory
        self.memory.store_scene_state(session_id, updated_state)
        self.memory.log_interaction(session_id, user_command, {
            'plan_id': plan['plan_id'],
            'actions_count': len(plan['actions']),
            'success': execution_results['success']
        })
        
        return updated_state
    
    async def _process_execution_results(
        self,
        scene_state: Optional[Dict[str, Any]],
        plan: Dict[str, Any],
        execution_results: Dict[str, Any],
        session_id: str
    ) -> Dict[str, Any]:
        """
        Process execution results and build updated scene state.
        
        Args:
            scene_state: Original scene state
            plan: Execution plan
            execution_results: Results from executor
            session_id: Session identifier
            
        Returns:
            Updated scene state
        """
        # Initialize scene if needed
        if scene_state is None:
            init_action = next((a for a in execution_results['actions_taken'] if a['action'] == 'initialize_scene'), None)
            if init_action and init_action.get('success'):
                scene_state = init_action['result']
            else:
                # Fallback initialization
                scene_state = self.executor._initialize_default_scene()
        
        # Extract generated dialogue lines
        dialogue_action = next((a for a in execution_results['actions_taken'] if a['action'] == 'generate_dialogue'), None)
        new_lines_data = dialogue_action['result'] if dialogue_action and dialogue_action.get('success') else []
        
        # Process each new line: add audio and create full Line objects
        processed_lines = []
        for line_data in new_lines_data:
            # Generate audio for this line
            audio_url = await self.executor._execute_action({
                'type': 'generate_audio',
                'text': line_data.get('text', ''),
                'voice_id': 'default_voice'
            }, scene_state)
            
            # Create full Line object
            full_line = {
                "id": str(uuid.uuid4()),
                "actorId": line_data.get('actorId', 'unknown'),
                "text": line_data.get('text', '...'),
                "timestamp": int(time.time() * 1000),
                "beatIndex": scene_state['currentBeat'] + 1,
                "audioUrl": audio_url
            }
            processed_lines.append(full_line)
        
        # Update scene state
        scene_state['lines'].extend(processed_lines)
        scene_state['currentBeat'] += 1
        
        return scene_state


# Singleton instance (maintains backward compatibility)
agent = DirectorPlanner()

# Alias for backward compatibility
DirectorAgent = DirectorPlanner
