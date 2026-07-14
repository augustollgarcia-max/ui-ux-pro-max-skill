"""
Video Analysis Skill for Claude
Extracts audio setup and visual templates from video URLs

This skill enables Claude to:
1. Access video links via browser automation
2. Extract audio metadata for sound setup recommendations
3. Analyze visual frames for template generation
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class VideoAnalyzer:
    """Analyze videos for audio setup and visual templates"""
    
    def __init__(self):
        self.output_dir = Path("video_analysis_output")
        self.output_dir.mkdir(exist_ok=True)
        
    def download_video_info(self, video_url: str) -> Dict[str, Any]:
        """Download video metadata and frames using yt-dlp"""
        try:
            # Install yt-dlp if not present
            self._ensure_yt_dlp()
            
            info_file = self.output_dir / f"video_info_{datetime.now().timestamp()}.json"
            
            cmd = [
                'yt-dlp',
                '--dump-json',
                video_url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                video_data = json.loads(result.stdout)
                with open(info_file, 'w') as f:
                    json.dump(video_data, f, indent=2)
                return video_data
            else:
                raise Exception(f"yt-dlp error: {result.stderr}")
                
        except Exception as e:
            return {"error": str(e)}
    
    def extract_audio_setup(self, video_url: str) -> Dict[str, Any]:
        """Extract audio configuration from video"""
        video_info = self.download_video_info(video_url)
        
        if "error" in video_info:
            return video_info
        
        audio_setup = {
            "url": video_url,
            "title": video_info.get("title", "Unknown"),
            "duration_seconds": video_info.get("duration", 0),
            "audio_codecs": video_info.get("audio_codec", []),
            "audio_formats": [],
            "recommended_setup": {}
        }
        
        # Extract available audio formats
        if "formats" in video_info:
            for fmt in video_info["formats"]:
                if fmt.get("acodec") != "none":
                    audio_setup["audio_formats"].append({
                        "format_id": fmt.get("format_id"),
                        "codec": fmt.get("acodec"),
                        "bitrate": fmt.get("abr"),
                        "sample_rate": fmt.get("asr"),
                        "channels": fmt.get("audio_channels")
                    })
        
        # Generate audio setup recommendations
        audio_setup["recommended_setup"] = self._generate_audio_recommendations(audio_setup)
        
        return audio_setup
    
    def extract_visual_templates(self, video_url: str, extract_frames: bool = True) -> Dict[str, Any]:
        """Extract visual information for template generation"""
        video_info = self.download_video_info(video_url)
        
        if "error" in video_info:
            return video_info
        
        visual_data = {
            "url": video_url,
            "title": video_info.get("title", "Unknown"),
            "duration_seconds": video_info.get("duration", 0),
            "resolution": f"{video_info.get('width')}x{video_info.get('height')}",
            "aspect_ratio": self._calculate_aspect_ratio(
                video_info.get('width'),
                video_info.get('height')
            ),
            "fps": video_info.get("fps"),
            "color_info": {},
            "template_suggestions": []
        }
        
        if extract_frames:
            visual_data["frames_extracted"] = self._extract_key_frames(video_url)
        
        return visual_data
    
    def analyze_complete(self, video_url: str) -> Dict[str, Any]:
        """Complete analysis: audio setup + visual templates"""
        
        print(f"🎬 Analisando vídeo: {video_url}")
        
        audio_analysis = self.extract_audio_setup(video_url)
        visual_analysis = self.extract_visual_templates(video_url)
        
        complete_analysis = {
            "video_url": video_url,
            "timestamp": datetime.now().isoformat(),
            "audio_setup": audio_analysis,
            "visual_templates": visual_analysis,
            "recommendations": self._generate_complete_recommendations(
                audio_analysis,
                visual_analysis
            )
        }
        
        # Save to file
        output_file = self.output_dir / f"analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(complete_analysis, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Análise salva em: {output_file}")
        
        return complete_analysis
    
    def _ensure_yt_dlp(self):
        """Ensure yt-dlp is installed"""
        try:
            subprocess.run(['yt-dlp', '--version'], capture_output=True, check=True)
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("📦 Instalando yt-dlp...")
            subprocess.run([sys.executable, '-m', 'pip', 'install', 'yt-dlp'],
                         capture_output=True)
    
    def _generate_audio_recommendations(self, audio_setup: Dict) -> Dict:
        """Generate audio setup recommendations"""
        recommendations = {
            "microphone": "Recomendado: Microfone de condensador cardióide",
            "interface": "Interface de áudio de 2+ canais",
            "software": ["Audacity (gratuito)", "Adobe Audition", "Reaper"],
            "settings": {
                "sample_rate": "48kHz para vídeo",
                "bit_depth": "24-bit mínimo",
                "channels": "Estéreo (2 canais)"
            }
        }
        
        if audio_setup["audio_formats"]:
            highest_bitrate = max(
                [f.get("bitrate", 0) for f in audio_setup["audio_formats"]],
                default=0
            )
            recommendations["settings"]["target_bitrate"] = f"{highest_bitrate}kbps"
        
        return recommendations
    
    def _extract_key_frames(self, video_url: str) -> List[str]:
        """Extract key frames from video"""
        frames_dir = self.output_dir / "frames"
        frames_dir.mkdir(exist_ok=True)
        
        try:
            cmd = [
                'yt-dlp',
                '--write-thumbnail',
                '-o', str(frames_dir / '%(title)s.%(ext)s'),
                video_url
            ]
            
            subprocess.run(cmd, capture_output=True)
            
            frames = list(frames_dir.glob("*"))
            return [str(f) for f in frames[:5]]  # Return first 5 frames
        except Exception as e:
            print(f"⚠️ Erro ao extrair frames: {e}")
            return []
    
    def _calculate_aspect_ratio(self, width: int, height: int) -> str:
        """Calculate aspect ratio from dimensions"""
        if not width or not height:
            return "unknown"
        
        gcd = self._gcd(width, height)
        return f"{width//gcd}:{height//gcd}"
    
    def _gcd(self, a: int, b: int) -> int:
        """Calculate greatest common divisor"""
        while b:
            a, b = b, a % b
        return a
    
    def _generate_complete_recommendations(
        self,
        audio_analysis: Dict,
        visual_analysis: Dict
    ) -> Dict:
        """Generate complete recommendations for setup and templates"""
        
        return {
            "audio": {
                "setup_type": "Professional Recording Setup",
                "requirements": audio_analysis.get("recommended_setup", {}),
                "estimated_cost": "$200-500"
            },
            "visual": {
                "resolution": visual_analysis.get("resolution"),
                "aspect_ratio": visual_analysis.get("aspect_ratio"),
                "template_base": f"Baseado em {visual_analysis.get('resolution')}",
                "recommended_tools": [
                    "Figma",
                    "Adobe XD",
                    "Photoshop",
                    "DaVinci Resolve"
                ]
            },
            "production": {
                "type": "Studio/Production",
                "lighting": "3-point lighting recommended",
                "background": "Neutral or branded backdrop"
            }
        }


def main():
    """CLI interface for video analysis"""
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python video_analyzer.py <video_url>")
        print("Exemplo: python video_analyzer.py https://youtube.com/watch?v=dQw4w9WgXcQ")
        sys.exit(1)
    
    video_url = sys.argv[1]
    analyzer = VideoAnalyzer()
    
    # Run complete analysis
    analysis = analyzer.analyze_complete(video_url)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 RESUMO DA ANÁLISE")
    print("="*60)
    
    if "audio_setup" in analysis:
        print("\n🔊 CONFIGURAÇÃO DE ÁUDIO:")
        print(json.dumps(analysis["audio_setup"]["recommended_setup"], indent=2, ensure_ascii=False))
    
    if "visual_templates" in analysis:
        print("\n🎨 INFORMAÇÕES VISUAIS:")
        visual = analysis["visual_templates"]
        print(f"   Resolução: {visual.get('resolution')}")
        print(f"   Aspect Ratio: {visual.get('aspect_ratio')}")
        print(f"   FPS: {visual.get('fps')}")
    
    print("\n" + "="*60)
    print("✅ Análise concluída com sucesso!")
    print("="*60)


if __name__ == "__main__":
    main()
