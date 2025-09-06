import pytest
import json
import tempfile
import os
from unittest.mock import patch, mock_open, MagicMock
from datetime import datetime, timedelta
import asyncio
import aiohttp

# Import the functions we want to test
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from job_finder import (
    Config, load_config, load_seen_jobs, save_seen_jobs,
    sanitize_text, health_check, cleanup_old_jobs,
    fetch_feed_async, send_discord_notification
)


class TestConfig:
    """Test configuration class"""
    
    def test_config_defaults(self):
        """Test that default config values are set correctly"""
        assert Config.CONFIG_FILE == "config.json"
        assert Config.SEEN_JOBS_FILE == "seen_jobs.json"
        assert Config.MAX_JOBS_PER_RUN == 50
        assert Config.REQUEST_TIMEOUT == 30
        assert Config.MAX_RETRIES == 3


class TestUtilityFunctions:
    """Test utility functions"""
    
    def test_sanitize_text_normal(self):
        """Test text sanitization with normal text"""
        result = sanitize_text("Software Engineer")
        assert result == "Software Engineer"
    
    def test_sanitize_text_html(self):
        """Test text sanitization with HTML entities"""
        result = sanitize_text("Software &amp; Hardware Engineer")
        assert result == "Software  Hardware Engineer"
    
    def test_sanitize_text_dangerous_chars(self):
        """Test text sanitization with dangerous characters"""
        result = sanitize_text("Test <script>alert('xss')</script> Job")
        assert result == "Test scriptalert('xss')/script Job"
    
    def test_sanitize_text_empty(self):
        """Test text sanitization with empty input"""
        result = sanitize_text("")
        assert result == "N/A"
    
    def test_sanitize_text_none(self):
        """Test text sanitization with None input"""
        result = sanitize_text(None)
        assert result == "N/A"
    
    def test_sanitize_text_long(self):
        """Test text sanitization with long text"""
        long_text = "A" * 600
        result = sanitize_text(long_text)
        assert len(result) == 500


class TestHealthCheck:
    """Test health check functionality"""
    
    @patch.dict(os.environ, {'DISCORD_WEBHOOK_URL': 'https://discord.com/webhook'})
    @patch('os.path.exists')
    def test_health_check_success(self, mock_exists):
        """Test health check with all requirements met"""
        mock_exists.return_value = True
        Config.DISCORD_WEBHOOK_URL = 'https://discord.com/webhook'
        
        issues = health_check()
        assert len(issues) == 0
    
    @patch.dict(os.environ, {}, clear=True)
    @patch('os.path.exists')
    def test_health_check_missing_webhook(self, mock_exists):
        """Test health check with missing webhook URL"""
        mock_exists.return_value = True
        Config.DISCORD_WEBHOOK_URL = None
        
        issues = health_check()
        assert "DISCORD_WEBHOOK_URL not configured" in issues
    
    @patch.dict(os.environ, {'DISCORD_WEBHOOK_URL': 'https://discord.com/webhook'})
    @patch('os.path.exists')
    def test_health_check_missing_config(self, mock_exists):
        """Test health check with missing config file"""
        mock_exists.return_value = False
        Config.DISCORD_WEBHOOK_URL = 'https://discord.com/webhook'
        
        issues = health_check()
        assert any("Config file" in issue for issue in issues)


class TestDataManagement:
    """Test data loading and saving functions"""
    
    def test_load_config_success(self):
        """Test successful config loading"""
        mock_config = {
            "feeds": [
                {
                    "name": "Test Feed",
                    "url": "https://example.com/feed.rss",
                    "source": "Test Source"
                }
            ]
        }
        
        with patch("builtins.open", mock_open(read_data=json.dumps(mock_config))):
            result = load_config()
            assert len(result) == 1
            assert result[0]["name"] == "Test Feed"
    
    def test_load_config_file_not_found(self):
        """Test config loading with missing file"""
        with patch("builtins.open", side_effect=FileNotFoundError()):
            result = load_config()
            assert result == []
    
    def test_load_config_invalid_json(self):
        """Test config loading with invalid JSON"""
        with patch("builtins.open", mock_open(read_data="invalid json")):
            result = load_config()
            assert result == []
    
    def test_load_seen_jobs_success(self):
        """Test successful seen jobs loading"""
        current_time = datetime.now()
        recent_time = current_time - timedelta(days=5)  # Use recent dates
        
        mock_data = {
            "https://example.com/job1": recent_time.isoformat(),
            "https://example.com/job2": current_time.isoformat()
        }
        
        with patch("builtins.open", mock_open(read_data=json.dumps(mock_data))):
            result = load_seen_jobs()
            assert len(result) == 2
            assert "https://example.com/job1" in result
    
    def test_load_seen_jobs_legacy_format(self):
        """Test seen jobs loading with legacy list format"""
        mock_data = ["https://example.com/job1", "https://example.com/job2"]
        
        with patch("builtins.open", mock_open(read_data=json.dumps(mock_data))):
            result = load_seen_jobs()
            assert len(result) == 2
            assert "https://example.com/job1" in result
    
    def test_cleanup_old_jobs(self):
        """Test cleanup of old job entries"""
        current_time = datetime.now()
        old_time = current_time - timedelta(days=35)
        recent_time = current_time - timedelta(days=10)
        
        seen_jobs = {
            "https://example.com/old": old_time.isoformat(),
            "https://example.com/recent": recent_time.isoformat(),
            "https://example.com/current": current_time.isoformat()
        }
        
        result = cleanup_old_jobs(seen_jobs, max_age_days=30)
        assert len(result) == 2
        assert "https://example.com/old" not in result
        assert "https://example.com/recent" in result
        assert "https://example.com/current" in result


class TestAsyncFunctions:
    """Test async functions"""
    
    @pytest.mark.asyncio
    async def test_fetch_feed_async_success(self):
        """Test successful async feed fetching"""
        mock_response = MagicMock()
        mock_response.status = 200
        
        # Create a proper coroutine for text() method
        async def mock_text():
            return """<?xml version="1.0"?>
        <rss version="2.0">
            <channel>
                <item>
                    <title>Test Job</title>
                    <link>https://example.com/job1</link>
                </item>
            </channel>
        </rss>"""
        
        mock_response.text = mock_text
        
        # Create proper async context manager
        class MockAsyncContextManager:
            async def __aenter__(self):
                return mock_response
            async def __aexit__(self, exc_type, exc_val, exc_tb):
                pass
        
        mock_session = MagicMock()
        mock_session.get.return_value = MockAsyncContextManager()
        
        feed_config = {
            "name": "Test Feed",
            "url": "https://example.com/feed.rss",
            "params": None
        }
        
        result = await fetch_feed_async(mock_session, feed_config)
        assert result is not None
        assert len(result.entries) == 1
        assert result.entries[0].title == "Test Job"
    
    @pytest.mark.asyncio
    async def test_fetch_feed_async_timeout(self):
        """Test async feed fetching with timeout"""
        mock_session = MagicMock()
        mock_session.get.side_effect = asyncio.TimeoutError()
        
        feed_config = {
            "name": "Test Feed",
            "url": "https://example.com/feed.rss",
            "params": None
        }
        
        result = await fetch_feed_async(mock_session, feed_config)
        assert result is None


class TestDiscordNotification:
    """Test Discord notification functionality"""
    
    @patch('requests.post')
    def test_send_discord_notification_success(self, mock_post):
        """Test successful Discord notification"""
        mock_response = MagicMock()
        mock_response.raise_for_status.return_value = None
        mock_post.return_value = mock_response
        
        Config.DISCORD_WEBHOOK_URL = "https://discord.com/webhook"
        
        new_jobs = [
            {
                "title": "Test Job",
                "link": "https://example.com/job1",
                "source_name": "Test Source",
                "published": "2023-01-01"
            }
        ]
        
        send_discord_notification(new_jobs)
        assert mock_post.called
    
    def test_send_discord_notification_no_webhook(self):
        """Test Discord notification with no webhook URL"""
        Config.DISCORD_WEBHOOK_URL = None
        
        new_jobs = [
            {
                "title": "Test Job",
                "link": "https://example.com/job1",
                "source_name": "Test Source",
                "published": "2023-01-01"
            }
        ]
        
        # Should not raise an exception
        send_discord_notification(new_jobs)


if __name__ == "__main__":
    pytest.main([__file__])
