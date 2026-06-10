"""
Production AI Service using Groq API
"""
import json
from groq import Groq
from ..config import get_settings


class AIService:
    """Service layer for AI operations using Groq"""
    
    def __init__(self):
        settings = get_settings()
        self.client = None
        if settings.groq_api_key:
            try:
                self.client = Groq(api_key=settings.groq_api_key)
            except Exception as e:
                print(f"❌ Groq client initialization failed: {e}")
                self.client = None
    
    def is_available(self) -> bool:
        """Check if AI service is available"""
        return self.client is not None
    
    def _call_api(self, messages: list, temperature: float = 0.7) -> str:
        """Internal method to call Groq API"""
        if not self.client:
            return ""
        
        try:
            response = self.client.chat.completions.create(
                model=settings.ai_model,
                messages=messages,
                temperature=temperature,
                max_tokens=2048
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return ""
    
    def generate_summary(self, text: str, max_length: int = None, style: str = 'comprehensive') -> str:
        """Generate a summary from text with different styles"""
        if not self.client:
            return "AI service not available."
        
        style_prompts = {
            'comprehensive': 'Create a comprehensive summary covering all key points.',
            'bullet': 'Create a bullet-point summary of the main ideas.',
            'exam': 'Summarize focusing on exam-relevant information.',
            'beginner': 'Create a beginner-friendly summary with simple language.',
            'advanced': 'Create an advanced summary with technical details.',
            'lecture': 'Summarize as structured lecture notes.'
        }
        
        prompt = f"{style_prompts.get(style, style_prompts['comprehensive'])}\n\nContent:\n{text}"
        
        messages = [
            {"role": "system", "content": "You are an expert at summarizing educational content."},
            {"role": "user", "content": prompt}
        ]
        
        return self._call_api(messages, temperature=0.5)
    
    def generate_quiz(self, text: str, num_questions: int = 5, difficulty: str = "medium"):
        """Generate quiz questions from text"""
        if not self.client:
            return []
        
        prompt = f"""Generate {num_questions} multiple-choice quiz questions from the following content.
Difficulty: {difficulty}

Return ONLY valid JSON in this exact format:
[
  {{
    "question": "Question text?",
    "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
    "correct_answer": "A",
    "explanation": "Why this is correct"
  }}
]

Content:
{text}"""
        
        messages = [
            {"role": "system", "content": "You are a quiz generator. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_api(messages, temperature=0.7)
        
        try:
            questions = json.loads(response)
            return questions if isinstance(questions, list) else []
        except:
            return []
    
    def generate_flashcards(self, text: str, num_cards: int = 10):
        """Generate flashcards from text"""
        if not self.client:
            return []
        
        prompt = f"""Generate {num_cards} flashcards from the following content.

Return ONLY valid JSON in this exact format:
[
  {{
    "front": "Question or term",
    "back": "Answer or definition"
  }}
]

Content:
{text}"""
        
        messages = [
            {"role": "system", "content": "You are a flashcard generator. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_api(messages, temperature=0.7)
        
        try:
            cards = json.loads(response)
            return cards if isinstance(cards, list) else []
        except:
            return []
    
    def generate_outline(self, text: str) -> str:
        """Generate an outline from text"""
        if not self.client:
            return "AI service not available."
        
        messages = [
            {"role": "system", "content": "You are an expert at creating structured outlines."},
            {"role": "user", "content": f"Create a structured outline from this content:\n\n{text}"}
        ]
        
        return self._call_api(messages, temperature=0.5)
    
    def suggest_tags(self, text: str, max_tags: int = 5) -> list:
        """Suggest tags for content"""
        if not self.client:
            return []
        
        prompt = f"""Suggest {max_tags} relevant tags for this content.
Return ONLY a JSON array of strings: ["tag1", "tag2", ...]

Content:
{text}"""
        
        messages = [
            {"role": "system", "content": "You are a tag suggester. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_api(messages, temperature=0.5)
        
        try:
            tags = json.loads(response)
            return tags if isinstance(tags, list) else []
        except:
            return []
    
    def check_grammar(self, text: str):
        """Check grammar and suggest corrections"""
        if not self.client:
            return {
                "corrected_text": text,
                "suggestions": [],
                "has_errors": False
            }
        
        prompt = f"""Check grammar and provide corrections.
Return ONLY valid JSON:
{{
  "corrected_text": "corrected version",
  "suggestions": ["suggestion 1", "suggestion 2"],
  "has_errors": true
}}

Text:
{text}"""
        
        messages = [
            {"role": "system", "content": "You are a grammar checker. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_api(messages, temperature=0.3)
        
        try:
            result = json.loads(response)
            return result
        except:
            return {
                "corrected_text": text,
                "suggestions": [],
                "has_errors": False
            }
    
    def chat(self, message: str, context: str = None, history: list = None) -> str:
        """AI tutor chat"""
        if not self.client:
            return "AI service not available."
        
        messages = [
            {"role": "system", "content": "You are Misk0nception AI, a helpful study assistant. Be concise, clear, and educational."}
        ]
        
        if context:
            messages.append({
                "role": "system", 
                "content": f"Reference material:\n{context[:2000]}"
            })
        
        if history:
            messages.extend(history[-5:])
        
        messages.append({"role": "user", "content": message})
        
        return self._call_api(messages, temperature=0.7)
    
    def smart_format(self, text: str) -> str:
        """Format text with better structure"""
        if not self.client:
            return text
        
        messages = [
            {"role": "system", "content": "You are a text formatter. Improve structure and readability."},
            {"role": "user", "content": f"Format and structure this text:\n\n{text}"}
        ]
        
        return self._call_api(messages, temperature=0.5)
    
    def highlight_concepts(self, text: str) -> dict:
        """Identify and highlight key concepts"""
        if not self.client:
            return {"text": text, "concepts": []}
        
        prompt = f"""Identify key concepts in this text.
Return ONLY valid JSON:
{{
  "text": "original text",
  "concepts": ["concept1", "concept2"]
}}

Text:
{text}"""
        
        messages = [
            {"role": "system", "content": "You are a concept highlighter. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ]
        
        response = self._call_api(messages, temperature=0.5)
        
        try:
            result = json.loads(response)
            return result
        except:
            return {"text": text, "concepts": []}
    
    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribe audio file using Groq Whisper"""
        if not self.client:
            raise Exception("AI service not available.")
        
        try:
            with open(audio_file_path, "rb") as file:
                transcription = self.client.audio.transcriptions.create(
                    file=(audio_file_path, file.read()),
                    model="whisper-large-v3-turbo",
                    response_format="text",
                    temperature=0.0
                )
                
            return str(transcription).strip() if transcription else ""
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")
            
            print(f"[DEBUG] After processing - result length: {len(result)}, content: '{result[:200] if result else '(empty)'}'")
            
            if result:
                print(f"[OK] Transcribed: {len(result)} characters")
            else:
                print(f"[WARN] No speech detected in audio")
            
            return result
            
        except Exception as e:
            error_msg = str(e)
            print(f"[ERROR] Transcription error: {error_msg}")
            raise Exception(f"Failed to transcribe audio: {error_msg}")
    
    def solve_math(self, problem: str) -> str:
        """Solve math problems with step-by-step explanations"""
        if not self.ai_tools.client:
            return "AI service not available."
        
        prompt = f"""Solve this math problem with detailed step-by-step explanation:

{problem}

Provide:
1. The problem statement
2. Step-by-step solution with explanations
3. Final answer
4. Verification if applicable

Format your response clearly with numbered steps."""

        try:
            response = self.ai_tools.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Math solving error: {str(e)}")
            return f"Error: {str(e)}"
    
    def generate_diagram(self, description: str) -> str:
        """Generate Mermaid.js diagram code from description"""
        if not self.ai_tools.client:
            return "AI service not available."
        
        prompt = f"""Generate Mermaid.js diagram code for the following description:

{description}

Requirements:
1. Use proper Mermaid.js syntax
2. Choose the most appropriate diagram type (flowchart, sequenceDiagram, classDiagram, stateDiagram, etc.)
3. Make it clear and well-organized
4. Include meaningful labels and connections
5. Return ONLY the Mermaid code, no explanations or markdown code blocks

Example format:
graph TD
    A[Start] --> B{{Decision?}}
    B -->|Yes| C[Do this]
    B -->|No| D[Do that]
    C --> E[End]
    D --> E"""

        try:
            response = self.ai_tools.client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
            )
            code = response.choices[0].message.content.strip()
            # Remove markdown code blocks if present
            if code.startswith('```'):
                lines = code.split('\n')
                if lines[0].startswith('```'):
                    lines = lines[1:]
                if lines and lines[-1].startswith('```'):
                    lines = lines[:-1]
                code = '\n'.join(lines).strip()
            return code
        except Exception as e:
            print(f"Diagram generation error: {str(e)}")
            return f"Error: {str(e)}"


