"""
Claude Integration for Video Analyzer Skill
Enables Claude to automatically analyze videos and extract setups
"""

from video_analyzer import VideoAnalyzer
import json


class ClaudeVideoSkill:
    """Bridge between Claude and VideoAnalyzer"""
    
    def __init__(self):
        self.analyzer = VideoAnalyzer()
    
    def analyze_video_link(self, video_url: str):
        """
        Claude calls this function when user provides a video link
        
        Usage in Claude:
        "Analise este vídeo: https://youtube.com/watch?v=..."
        """
        return self.analyzer.analyze_complete(video_url)
    
    def get_audio_setup(self, video_url: str):
        """Extract only audio configuration"""
        return self.analyzer.extract_audio_setup(video_url)
    
    def get_visual_templates(self, video_url: str):
        """Extract only visual information"""
        return self.analyzer.extract_visual_templates(video_url)
    
    def format_for_claude(self, analysis: dict) -> str:
        """Format analysis output for Claude readability"""
        
        output = """
# 📊 ANÁLISE COMPLETA DO VÍDEO

## 🔊 CONFIGURAÇÃO DE ÁUDIO (SETUP)

**Recomendações:**
"""
        
        if "audio_setup" in analysis:
            audio = analysis["audio_setup"]["recommended_setup"]
            output += f"""
- **Microfone:** {audio.get('microphone', 'Não especificado')}
- **Interface:** {audio.get('interface', 'Não especificado')}
- **Software Recomendado:**
  {chr(10).join(['  - ' + s for s in audio.get('software', [])])}
- **Configurações:**
  - Sample Rate: {audio.get('settings', {}).get('sample_rate')}
  - Bit Depth: {audio.get('settings', {}).get('bit_depth')}
  - Canais: {audio.get('settings', {}).get('channels')}
"""
        
        output += """

## 🎨 TEMPLATES VISUAIS

**Especificações:**
"""
        
        if "visual_templates" in analysis:
            visual = analysis["visual_templates"]
            output += f"""
- **Resolução:** {visual.get('resolution')}
- **Aspect Ratio:** {visual.get('aspect_ratio')}
- **FPS:** {visual.get('fps')}
- **Ferramentas Recomendadas:**
  {chr(10).join(['  - ' + t for t in visual.get('template_suggestions', [])])}
"""
        
        output += """

## 📋 RECOMENDAÇÕES COMPLETAS

**Produção:**
"""
        
        if "recommendations" in analysis:
            rec = analysis["recommendations"]
            production = rec.get("production", {})
            output += f"""
- **Tipo:** {production.get('type')}
- **Iluminação:** {production.get('lighting')}
- **Fundo:** {production.get('background')}
- **Custo Estimado:** {rec.get('audio', {}).get('estimated_cost')}
"""
        
        return output


# Export for Claude integration
skill = ClaudeVideoSkill()

# Functions available to Claude
def analyze_video_from_link(url: str):
    """
    Análise completa de vídeo: áudio + visual
    
    Args:
        url: Link do vídeo (YouTube, Vimeo, etc)
    
    Returns:
        Análise com setup de áudio e templates visuais
    """
    analysis = skill.analyze_video_link(url)
    return skill.format_for_claude(analysis)


def get_audio_recommendations(url: str):
    """
    Extrai apenas recomendações de áudio
    
    Args:
        url: Link do vídeo
    
    Returns:
        Setup de áudio recomendado
    """
    return skill.get_audio_setup(url)


def get_visual_specs(url: str):
    """
    Extrai apenas especificações visuais
    
    Args:
        url: Link do vídeo
    
    Returns:
        Informações visuais para templates
    """
    return skill.get_visual_templates(url)


# Tool definitions for Claude
CLAUDE_TOOLS = [
    {
        "name": "analyze_video_from_link",
        "description": "Analisa um vídeo para extrair configuração de áudio e templates visuais",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL do vídeo (YouTube, Vimeo, etc)"
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "get_audio_recommendations",
        "description": "Extrai apenas recomendações de configuração de áudio",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL do vídeo"
                }
            },
            "required": ["url"]
        }
    },
    {
        "name": "get_visual_specs",
        "description": "Extrai apenas especificações visuais para criar templates",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "URL do vídeo"
                }
            },
            "required": ["url"]
        }
    }
]
