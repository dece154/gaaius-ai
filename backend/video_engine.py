"""
GAAIUS Video Engine - AI-Powered Video Generation System
Generates videos by creating AI keyframes and stitching them together
"""

import os
import asyncio
import uuid
import tempfile
from pathlib import Path
from typing import List, Optional, Dict, Any
from PIL import Image
import io
from huggingface_hub import InferenceClient
from groq import Groq
import imageio
import numpy as np

class VideoEngine:
    """
    Video generation engine that creates videos from text prompts
    using AI-generated keyframes and smooth transitions.
    """
    
    def __init__(self, hf_token: str, groq_api_key: str, output_dir: Path):
        self.hf_client = InferenceClient(api_key=hf_token)
        self.groq_client = Groq(api_key=groq_api_key)
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
    async def generate_video(
        self, 
        prompt: str, 
        duration: int = 5,  # seconds
        fps: int = 8,
        style: str = "cinematic"
    ) -> Dict[str, Any]:
        """
        Generate a video from a text prompt.
        
        Args:
            prompt: The video description
            duration: Video length in seconds
            fps: Frames per second
            style: Visual style (cinematic, anime, realistic, etc.)
            
        Returns:
            Dict with video_path, metadata
        """
        video_id = str(uuid.uuid4())
        
        # Step 1: Generate scene descriptions using Groq
        scenes = await self._generate_scenes(prompt, duration, style)
        
        # Step 2: Generate keyframe images for each scene
        keyframes = await self._generate_keyframes(scenes, style)
        
        # Step 3: Create smooth transitions and compile video
        video_path = await self._compile_video(keyframes, video_id, fps, duration)
        
        return {
            "video_id": video_id,
            "video_path": video_path,
            "scenes": scenes,
            "keyframe_count": len(keyframes),
            "duration": duration,
            "fps": fps
        }
    
    async def _generate_scenes(
        self, 
        prompt: str, 
        duration: int,
        style: str
    ) -> List[Dict[str, str]]:
        """Use Groq to break down the prompt into scene descriptions."""
        
        num_scenes = max(3, duration // 2)  # At least 3 scenes, more for longer videos
        
        system_prompt = f"""You are a professional cinematographer and storyboard artist.
Given a video concept, break it down into {num_scenes} distinct visual scenes.
Each scene should be a detailed image prompt suitable for AI image generation.
Style: {style}

Output format (JSON array):
[
  {{"scene_number": 1, "description": "detailed visual description", "duration_ratio": 0.33}},
  ...
]

Rules:
- Each description should be vivid and specific
- Include lighting, composition, colors, mood
- Ensure visual continuity between scenes
- Duration ratios must sum to 1.0
- Keep descriptions under 200 characters for image generation"""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create scenes for: {prompt}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            # Parse JSON from response
            import json
            import re
            
            # Find JSON array in response
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                scenes = json.loads(json_match.group())
            else:
                # Fallback: create simple scenes
                scenes = self._create_fallback_scenes(prompt, num_scenes, style)
                
            return scenes
            
        except Exception as e:
            print(f"Scene generation error: {e}")
            return self._create_fallback_scenes(prompt, num_scenes, style)
    
    def _create_fallback_scenes(
        self, 
        prompt: str, 
        num_scenes: int,
        style: str
    ) -> List[Dict[str, str]]:
        """Create simple fallback scenes if AI generation fails."""
        ratio = 1.0 / num_scenes
        scenes = []
        
        modifiers = [
            "establishing wide shot of",
            "medium shot focusing on",
            "close-up detail of",
            "dynamic angle showing",
            "atmospheric view of"
        ]
        
        for i in range(num_scenes):
            modifier = modifiers[i % len(modifiers)]
            scenes.append({
                "scene_number": i + 1,
                "description": f"{style} style, {modifier} {prompt}",
                "duration_ratio": ratio
            })
            
        return scenes
    
    async def _generate_keyframes(
        self, 
        scenes: List[Dict[str, str]],
        style: str
    ) -> List[Image.Image]:
        """Generate images for each scene using Pollinations AI (100% FREE)."""
        import requests as req
        import urllib.parse
        
        keyframes = []
        
        for scene in scenes:
            description = scene.get("description", "")
            enhanced_prompt = f"{description}, {style} style, high quality, detailed"
            
            try:
                # Use Pollinations.ai - completely free, no API key needed
                encoded_prompt = urllib.parse.quote(enhanced_prompt)
                API_URL = f"https://pollinations.ai/p/{encoded_prompt}?width=1024&height=576&nologo=true"
                
                response = req.get(API_URL, timeout=120)
                
                if response.status_code == 200:
                    image = Image.open(io.BytesIO(response.content))
                    keyframes.append(image)
                else:
                    # Create placeholder if generation fails
                    placeholder = Image.new('RGB', (1024, 576), color=(30, 30, 40))
                    keyframes.append(placeholder)
                    
            except Exception as e:
                print(f"Keyframe generation error: {e}")
                placeholder = Image.new('RGB', (1024, 576), color=(30, 30, 40))
                keyframes.append(placeholder)
                
            await asyncio.sleep(2)  # Small delay between requests
            
        return keyframes
    
    async def _compile_video(
        self, 
        keyframes: List[Image.Image],
        video_id: str,
        fps: int,
        duration: int
    ) -> str:
        """Compile keyframes into a video with smooth transitions."""
        
        if not keyframes:
            raise ValueError("No keyframes to compile")
            
        # Calculate frames needed
        total_frames = fps * duration
        frames_per_keyframe = total_frames // len(keyframes)
        transition_frames = fps // 2  # Half second transitions
        
        # Resize all keyframes to consistent size
        target_size = (1024, 576)  # 16:9 aspect ratio
        resized_keyframes = []
        for kf in keyframes:
            resized = kf.resize(target_size, Image.Resampling.LANCZOS)
            resized_keyframes.append(np.array(resized))
        
        # Generate all frames with transitions
        all_frames = []
        
        for i, keyframe in enumerate(resized_keyframes):
            # Add frames for this keyframe
            hold_frames = frames_per_keyframe - transition_frames
            for _ in range(max(1, hold_frames)):
                all_frames.append(keyframe)
            
            # Add transition to next keyframe
            if i < len(resized_keyframes) - 1:
                next_keyframe = resized_keyframes[i + 1]
                transition = self._create_transition(
                    keyframe, 
                    next_keyframe, 
                    transition_frames
                )
                all_frames.extend(transition)
        
        # Ensure we have enough frames
        while len(all_frames) < total_frames:
            all_frames.append(all_frames[-1])
        
        # Trim to exact duration
        all_frames = all_frames[:total_frames]
        
        # Write video
        video_path = self.output_dir / f"{video_id}.mp4"
        
        writer = imageio.get_writer(
            str(video_path),
            fps=fps,
            codec='libx264',
            quality=8,
            pixelformat='yuv420p'
        )
        
        for frame in all_frames:
            writer.append_data(frame)
            
        writer.close()
        
        return str(video_path)
    
    def _create_transition(
        self, 
        frame1: np.ndarray, 
        frame2: np.ndarray, 
        num_frames: int
    ) -> List[np.ndarray]:
        """Create a smooth crossfade transition between two frames."""
        
        transition = []
        
        for i in range(num_frames):
            alpha = i / num_frames
            blended = (1 - alpha) * frame1 + alpha * frame2
            transition.append(blended.astype(np.uint8))
            
        return transition


class StoryVideoEngine(VideoEngine):
    """
    Extended video engine for creating longer story-based videos.
    Can handle complex narratives with multiple chapters.
    """
    
    async def generate_story_video(
        self,
        story_prompt: str,
        chapters: int = 3,
        duration_per_chapter: int = 10,
        style: str = "cinematic"
    ) -> Dict[str, Any]:
        """
        Generate a longer story video with multiple chapters.
        
        Args:
            story_prompt: The story concept
            chapters: Number of chapters
            duration_per_chapter: Seconds per chapter
            style: Visual style
            
        Returns:
            Dict with video info
        """
        
        video_id = str(uuid.uuid4())
        
        # Step 1: Generate chapter outlines
        chapter_outlines = await self._generate_chapters(
            story_prompt, 
            chapters,
            style
        )
        
        # Step 2: Generate each chapter as a mini-video
        chapter_videos = []
        for i, chapter in enumerate(chapter_outlines):
            print(f"Generating chapter {i+1}/{chapters}...")
            
            chapter_result = await self.generate_video(
                prompt=chapter["description"],
                duration=duration_per_chapter,
                fps=8,
                style=style
            )
            chapter_videos.append(chapter_result)
            
        # Step 3: Concatenate all chapters
        final_video_path = await self._concatenate_videos(
            chapter_videos,
            video_id
        )
        
        return {
            "video_id": video_id,
            "video_path": final_video_path,
            "chapters": chapter_outlines,
            "total_duration": chapters * duration_per_chapter,
            "chapter_count": chapters
        }
    
    async def _generate_chapters(
        self,
        story_prompt: str,
        num_chapters: int,
        style: str
    ) -> List[Dict[str, str]]:
        """Generate chapter outlines using AI."""
        
        system_prompt = f"""You are a master storyteller and filmmaker.
Break down this story into {num_chapters} compelling chapters.
Each chapter should have a clear visual narrative.

Output format (JSON array):
[
  {{"chapter": 1, "title": "chapter title", "description": "visual description for video generation"}},
  ...
]

Rules:
- Create a coherent narrative arc
- Each description should be vivid and filmable
- Maintain {style} visual style throughout
- Keep descriptions under 150 characters"""

        try:
            response = self.groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Create chapters for: {story_prompt}"}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            
            import json
            import re
            
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                return json.loads(json_match.group())
                
        except Exception as e:
            print(f"Chapter generation error: {e}")
            
        # Fallback
        return [
            {"chapter": i+1, "title": f"Part {i+1}", "description": f"{story_prompt} - part {i+1}"}
            for i in range(num_chapters)
        ]
    
    async def _concatenate_videos(
        self,
        chapter_results: List[Dict],
        video_id: str
    ) -> str:
        """Concatenate multiple chapter videos into one."""
        
        final_path = self.output_dir / f"{video_id}_full.mp4"
        
        # Read all frames from all chapters
        all_frames = []
        
        for chapter in chapter_results:
            video_path = chapter["video_path"]
            reader = imageio.get_reader(video_path)
            
            for frame in reader:
                all_frames.append(frame)
                
            reader.close()
        
        # Write combined video
        writer = imageio.get_writer(
            str(final_path),
            fps=8,
            codec='libx264',
            quality=8,
            pixelformat='yuv420p'
        )
        
        for frame in all_frames:
            writer.append_data(frame)
            
        writer.close()
        
        return str(final_path)
