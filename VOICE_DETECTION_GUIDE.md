# Voice Detection Troubleshooting Guide

## Current Status

Your browser should now properly handle speech recognition with improved debugging.

## How to Test Voice Recognition

### 1. **Check Microphone Permissions**
- Open your browser settings
- Find "Permissions" or "Privacy"
- Look for "Microphone"
- Make sure this site has permission to use microphone
- If denied, click "Allow" when prompted

### 2. **Test via Browser Console**
1. Open Developer Tools: `F12` or `Right-click → Inspect`
2. Go to **Console** tab
3. Say one of these keywords clearly:
   - "Help me"
   - "Save me"
   - "Help"

### 3. **Monitor Console Logs**
Watch for these messages:
- ✅ **SUCCESS**: `"Keyword match detected: Help me → help me"`
- ✅ **LISTENING**: `"Speech recognition started, listening for keywords: [...]"`
- ✅ **DETECTED**: `"Speech detected: help me"`

### 4. **Common Issues**

**Issue**: "Microphone access denied"
- **Fix**: Allow microphone access in browser settings
- Click the lock icon in address bar → Permissions → Microphone → Allow

**Issue**: "No speech detected in time"
- **Fix**: Speak more clearly and louder
- Stay silent for a moment after speaking
- The system waits ~5 seconds for speech before timing out

**Issue**: "Network error"
- **Fix**: Check your internet connection
- The speech recognition service requires network access
- Restart the app if connection was interrupted

**Issue**: Still not recognizing
- **Fix**: Try these keywords explicitly:
  1. "Help me" (English)
  2. "Save me" (English)
  3. "Help" (English - simplest)
  
- **Not supported**: Hindi keywords (बचाओ, मदद, Bachao) require special language setup

## Improved Changes Made

### 1. **Language Setting**
- Changed from `en-IN` (Indian English) to `en-US` (US English)
- US English has better browser support and recognition accuracy

### 2. **Better Keyword Matching**
- Now checks for exact phrase matches
- Handles variations with spaces and punctuation
- More forgiving with whitespace

### 3. **Enhanced Logging**
- Shows exactly what the system heard
- Displays keyword matching details
- Helps diagnose what went wrong

### 4. **Graceful Error Handling**
- Automatically restarts after temporary errors
- Handles permission denials with clear messages
- Won't crash if microphone unavailable

## Testing Keywords

In order of easiest to hardest to recognize:

1. **"Help"** ← Start with this
2. **"Help me"** ← Natural phrase
3. **"Save me"** ← More complex
4. **"Help me help me help me"** ← Repetition helps

## Expected Behavior

When you say a keyword:

1. Console shows: `"Speech detected: [what you said]"`
2. If matches keyword: `"Keyword match detected: Help me → help me"`
3. SOS automatically triggers: `"Voice SOS trigger activated: Help me"`
4. Toast notification appears: `"SOS keyword detected: Help me"`

## How to Debug Further

1. **Check browser support**:
   - Open Console
   - Type: `typeof webkitSpeechRecognition || typeof SpeechRecognition`
   - Should return: `"function"` (not `"undefined"`)

2. **Monitor what's being heard**:
   - Keep Console open
   - Speak test phrases
   - Watch the `"Speech detected:"` messages

3. **Check if keywords match**:
   - Console shows if keyword was found
   - Compare exact text you spoke vs keyword
   - Make sure spaces and capitalization don't matter (they're normalized)

## Next Steps if Still Not Working

1. Try a **different browser** (Chrome has best support)
2. Check **microphone hardware** works (test in video call)
3. Verify **internet connection** is stable
4. **Clear browser cache**: DevTools → Application → Clear Storage
5. Restart the app completely

## Keywords Being Listened For

These are converted to lowercase for matching:
- `Help me`
- `Save me`
- `बचाओ` (requires Hindi support)
- `मदद` (requires Hindi support)
- `Bachao`
- `Help`

---

**Status**: Voice detection is now more robust and should handle errors gracefully.
**Test Recommendation**: Say "Help" clearly while watching the browser console.
