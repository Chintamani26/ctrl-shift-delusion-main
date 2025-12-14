# Demo Video

## Overview

This demo showcases **ManchAI**, a real-time AI scriptwriting studio where users collaborate with a Gemini-powered Director AI to create dynamic scripts.

## Video Link

📺 **Demo Video**: [Add your video link here]
- YouTube (unlisted) / Loom / Vimeo / or other hosted platform
- **Duration**: 3-5 minutes
- **Format**: Public or unlisted link (NOT a raw video file upload)

⚠️ **Important**: Videos longer than 5 minutes may not be reviewed. Raw video file uploads will not be accepted.

## Timestamps & Highlights

### 00:00 - 00:30 — Introduction & Problem Statement
- **What to show**:
  - Brief introduction to ManchAI
  - The problem: Traditional scriptwriting is linear and time-consuming
  - The solution: Real-time AI collaboration for dynamic script generation
  - Quick overview of the interface (3-panel layout)

### 00:30 - 01:30 — User Input & Planning Step
- **What to show**:
  - User enters a director command (e.g., "Alex confronts Morgan about the secret")
  - Click "Direct" button
  - Show the processing state (loading indicator)
  - Explain how the Director Agent plans the turn:
    - Analyzes current scene state
    - Prepares context for Gemini API
    - Constructs prompt with actors, setting, recent dialogue

### 01:30 - 02:30 — Tool Calls & AI Generation
- **What to show**:
  - Highlight the Gemini API call (can show network tab or console logs)
  - Show how Gemini generates dialogue based on:
    - Scene context (setting, genre, actors)
    - Recent dialogue history
    - User's director command
  - Display the generated lines appearing in ScriptPanel
  - Show beat organization (lines grouped by beat index)
  - Demonstrate TTS audio URL generation (mock implementation)

### 02:30 - 03:30 — Final Output & Advanced Features
- **What to show**:
  - Multiple turns showing scene progression
  - Beat counter incrementing
  - Cast panel showing actor information
  - Auto-scroll to latest line
  - Highlighting of newest additions
  - Show how different commands generate different dialogue styles

### 03:30 - 04:00 — Edge Cases & Limitations (Optional)
- **What to show**:
  - Error handling (if applicable)
  - Scene initialization from scratch
  - Multiple actors interacting
  - Action lines vs dialogue lines

### 04:00 - 05:00 — Conclusion & Future Work
- **What to show**:
  - Summary of key features
  - Potential use cases (content creation, education, entertainment)
  - Future enhancements (ElevenLabs TTS, persistence, collaboration)

## Key Points to Highlight

### Agentic Behavior
1. **Planning**: Director Agent analyzes context and plans the turn
2. **Tool Use**: Calls Gemini API with structured prompts
3. **Memory**: Maintains scene state and dialogue history
4. **Execution**: Generates lines, assigns beats, updates state

### Technical Highlights
- Real-time script generation
- Beat-based organization
- Type-safe TypeScript implementation
- Async/await patterns
- Error handling and fallbacks

### User Experience
- Intuitive 3-panel interface
- Real-time updates
- Visual feedback (loading states, highlights)
- Dark cinematic theme

## Recording Tips

1. **Screen Recording**: Use OBS, Loom, or QuickTime
2. **Audio**: Clear narration explaining each step
3. **Pacing**: Don't rush - show each feature clearly
4. **Testing**: Record a practice run first
5. **Editing**: Trim unnecessary pauses, add timestamps

## Submission Checklist

- [ ] Video is 3-5 minutes long
- [ ] Video is hosted on a public platform (YouTube, Loom, etc.)
- [ ] Link is accessible without login
- [ ] Timestamps are provided in this document
- [ ] Video demonstrates all key features
- [ ] Agentic behavior is clearly explained
- [ ] Technical implementation is highlighted

---

**Note**: Replace `[Add your video link here]` with your actual video URL once uploaded.
