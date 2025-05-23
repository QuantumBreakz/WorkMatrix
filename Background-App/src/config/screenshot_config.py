from dataclasses import dataclass
from typing import Optional, Dict, List
import json
from pathlib import Path
from ..config.directory_config import CONFIG_DIR

@dataclass
class ScreenshotSettings:
    """Configuration settings for screenshot capture."""
    interval: int = 300  # seconds between screenshots
    quality: int = 85  # JPEG quality (0-100)
    max_size_mb: int = 5  # maximum screenshot size in MB
    compression: bool = True  # whether to compress screenshots
    capture_all_monitors: bool = False  # whether to capture all monitors
    privacy_mode: bool = True  # whether to enable privacy features
    blur_sensitive: bool = True  # whether to blur sensitive content
    max_storage_gb: int = 10  # maximum storage per user in GB
    retention_days: int = 7  # days to keep screenshots
    excluded_apps: List[str] = None  # apps to exclude from capture
    excluded_windows: List[str] = None  # window titles to exclude
    allowed_extensions: List[str] = None  # allowed file extensions

    def __post_init__(self):
        """Initialize default values for lists."""
        if self.excluded_apps is None:
            self.excluded_apps = [
                "password", "login", "auth", "bank", "credit",
                "secure", "private", "confidential"
            ]
        if self.excluded_windows is None:
            self.excluded_windows = [
                "password", "login", "auth", "bank", "credit",
                "secure", "private", "confidential"
            ]
        if self.allowed_extensions is None:
            self.allowed_extensions = [".png", ".jpg", ".jpeg"]

    @classmethod
    def load(cls, user_id: str) -> 'ScreenshotSettings':
        """Load settings from user's config file."""
        config_file = CONFIG_DIR / f"screenshot_{user_id}.json"
        if config_file.exists():
            with open(config_file, 'r') as f:
                data = json.load(f)
                return cls(**data)
        return cls()

    def save(self, user_id: str):
        """Save settings to user's config file."""
        config_file = CONFIG_DIR / f"screenshot_{user_id}.json"
        with open(config_file, 'w') as f:
            json.dump(self.__dict__, f, indent=4)

    def to_dict(self) -> Dict:
        """Convert settings to dictionary."""
        return {
            "interval": self.interval,
            "quality": self.quality,
            "max_size_mb": self.max_size_mb,
            "compression": self.compression,
            "capture_all_monitors": self.capture_all_monitors,
            "privacy_mode": self.privacy_mode,
            "blur_sensitive": self.blur_sensitive,
            "max_storage_gb": self.max_storage_gb,
            "retention_days": self.retention_days,
            "excluded_apps": self.excluded_apps,
            "excluded_windows": self.excluded_windows,
            "allowed_extensions": self.allowed_extensions
        }

    def validate(self) -> List[str]:
        """Validate settings and return list of errors."""
        errors = []
        
        if self.interval < 60:
            errors.append("Screenshot interval must be at least 60 seconds")
        if not 0 <= self.quality <= 100:
            errors.append("Quality must be between 0 and 100")
        if self.max_size_mb < 1:
            errors.append("Maximum size must be at least 1MB")
        if self.max_storage_gb < 1:
            errors.append("Maximum storage must be at least 1GB")
        if self.retention_days < 1:
            errors.append("Retention period must be at least 1 day")
            
        return errors

    def is_app_excluded(self, app_name: str) -> bool:
        """Check if an app should be excluded from capture."""
        app_name_lower = app_name.lower()
        return any(excluded.lower() in app_name_lower 
                  for excluded in self.excluded_apps)

    def is_window_excluded(self, window_title: str) -> bool:
        """Check if a window should be excluded from capture."""
        window_title_lower = window_title.lower()
        return any(excluded.lower() in window_title_lower 
                  for excluded in self.excluded_windows)

    def get_storage_path(self, user_id: str) -> Path:
        """Get the storage path for user's screenshots."""
        from ..config.directory_config import SCREENSHOTS_DIR
        return SCREENSHOTS_DIR / user_id

    def get_max_storage_bytes(self) -> int:
        """Get maximum storage in bytes."""
        return self.max_storage_gb * 1024 * 1024 * 1024 