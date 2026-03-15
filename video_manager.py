import json
import os
from datetime import datetime
import re

class VideoManager:
    def __init__(self, file_path='data/videos.json'):
        # Resolve path relative to this file to avoid CWD issues
        if not os.path.isabs(file_path):
            base_dir = os.path.dirname(__file__)
            self.file_path = os.path.join(base_dir, file_path)
        else:
            self.file_path = file_path
        self.ensure_file_exists()
    
    def ensure_file_exists(self):
        """Ensure the videos.json file exists with proper structure"""
        if not os.path.exists(self.file_path):
            os.makedirs(os.path.dirname(self.file_path), exist_ok=True)
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump({"videos": []}, f, indent=2, ensure_ascii=False)
    
    def load_videos(self):
        """Load all videos from JSON file"""
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('videos', [])
        except (FileNotFoundError, json.JSONDecodeError):
            return []
    
    def save_videos(self, videos):
        """Save videos to JSON file"""
        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump({"videos": videos}, f, indent=2, ensure_ascii=False)
    
    def extract_youtube_id(self, url):
        """Extract YouTube video ID from various URL formats"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
            r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def get_featured_video(self):
        """Get the featured video (first featured video found)"""
        videos = self.load_videos()
        for video in videos:
            if video.get('featured', False):
                return video
        return videos[0] if videos else None
    
    def add_video(self, title, description, youtube_url, category="general", featured=False):
        """Add a new video"""
        videos = self.load_videos()
        
        # Extract YouTube ID
        embed_id = self.extract_youtube_id(youtube_url)
        if not embed_id:
            raise ValueError("Invalid YouTube URL")
        
        # Generate new ID
        new_id = str(len(videos) + 1)
        
        # Create video object
        video = {
            "id": new_id,
            "title": title,
            "description": description,
            "youtube_url": youtube_url,
            "embed_id": embed_id,
            "thumbnail": f"https://img.youtube.com/vi/{embed_id}/maxresdefault.jpg",
            "category": category,
            "featured": featured,
            "created_at": datetime.now().isoformat(),
            "views": 0,
            "duration": "0:00"
        }
        
        videos.append(video)
        self.save_videos(videos)
        return video
    
    def update_video(self, video_id, **kwargs):
        """Update an existing video"""
        videos = self.load_videos()
        
        for video in videos:
            if video['id'] == str(video_id):
                # Update fields
                for key, value in kwargs.items():
                    if key in video:
                        video[key] = value
                
                # Update embed_id if youtube_url changed
                if 'youtube_url' in kwargs:
                    embed_id = self.extract_youtube_id(kwargs['youtube_url'])
                    if embed_id:
                        video['embed_id'] = embed_id
                        video['thumbnail'] = f"https://img.youtube.com/vi/{embed_id}/maxresdefault.jpg"
                
                self.save_videos(videos)
                return video
        
        return None
    
    def delete_video(self, video_id):
        """Delete a video"""
        videos = self.load_videos()
        videos = [v for v in videos if v['id'] != str(video_id)]
        self.save_videos(videos)
        return True
    
    def get_video_by_id(self, video_id):
        """Get a specific video by ID"""
        videos = self.load_videos()
        for video in videos:
            if video['id'] == str(video_id):
                return video
        return None
    
    def get_videos_by_category(self, category):
        """Get videos by category"""
        videos = self.load_videos()
        return [v for v in videos if v.get('category') == category]
    
    def toggle_featured(self, video_id):
        """Toggle featured status of a video"""
        videos = self.load_videos()
        
        for video in videos:
            if video['id'] == str(video_id):
                video['featured'] = not video.get('featured', False)
                self.save_videos(videos)
                return video
        
        return None 

    def increment_view(self, video_id: str) -> int:
        """Increment the views count for a video by 1 and return the new count."""
        videos = self.load_videos()
        for video in videos:
            if video['id'] == str(video_id):
                current = int(video.get('views', 0) or 0)
                video['views'] = current + 1
                self.save_videos(videos)
                return video['views']
        return -1