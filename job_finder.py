import os
import json
import time
import asyncio
import aiohttp
import feedparser
import requests
import logging
import html
import re
from datetime import datetime, timedelta
from urllib.parse import urlencode
from typing import Optional, List, Dict, Any, Set
import jsonschema

# --- Configuration Class ---
class Config:
    DISCORD_WEBHOOK_URL: Optional[str] = os.getenv("DISCORD_WEBHOOK_URL")
    CONFIG_FILE: str = os.getenv("CONFIG_FILE", "config.json")
    SEEN_JOBS_FILE: str = os.getenv("SEEN_JOBS_FILE", "seen_jobs.json")
    MAX_JOBS_PER_RUN: int = int(os.getenv("MAX_JOBS_PER_RUN", "50"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_DELAY: int = int(os.getenv("RETRY_DELAY", "2"))
    CLEANUP_AGE_DAYS: int = int(os.getenv("CLEANUP_AGE_DAYS", "30"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# --- Schema Validation ---
CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "feeds": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["name", "url", "source"],
                "properties": {
                    "name": {"type": "string", "minLength": 1},
                    "url": {"type": "string", "format": "uri"},
                    "source": {"type": "string", "minLength": 1},
                    "category": {"type": "string"},
                    "params": {"type": ["object", "null"]}
                }
            }
        }
    },
    "required": ["feeds"]
}

# --- Logging Setup ---
def setup_logging():
    """Setup structured logging with file and console handlers"""
    logger = logging.getLogger(__name__)
    logger.setLevel(getattr(logging, Config.LOG_LEVEL.upper()))
    
    # Clear existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    
    # File handler
    try:
        file_handler = logging.FileHandler('job_finder.log')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except Exception as e:
        print(f"Warning: Could not create log file: {e}")
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger

logger = setup_logging()

# --- Utility Functions ---
def sanitize_text(text: str | None) -> str:
    """Sanitize text for Discord output"""
    if not text:
        return "N/A"
    # HTML decode
    text = html.unescape(text)
    # Remove potentially dangerous characters
    text = re.sub(r'[<>@&]', '', text)
    return text[:500]  # Limit length

def health_check() -> List[str]:
    """Verify system health before running"""
    issues = []
    
    if not Config.DISCORD_WEBHOOK_URL:
        issues.append("DISCORD_WEBHOOK_URL not configured")
    
    if not os.path.exists(Config.CONFIG_FILE):
        issues.append(f"Config file {Config.CONFIG_FILE} not found")
    
    return issues

def cleanup_old_jobs(seen_jobs_data: Dict[str, str], max_age_days: Optional[int] = None) -> Dict[str, str]:
    """Remove job entries older than max_age_days"""
    if max_age_days is None:
        max_age_days = Config.CLEANUP_AGE_DAYS
    
    cutoff_date = datetime.now() - timedelta(days=max_age_days)
    cleaned_data = {}
    
    for job_link, timestamp_str in seen_jobs_data.items():
        try:
            timestamp = datetime.fromisoformat(timestamp_str)
            if timestamp > cutoff_date:
                cleaned_data[job_link] = timestamp_str
        except (ValueError, TypeError):
            # Keep jobs with invalid timestamps for now
            cleaned_data[job_link] = timestamp_str
    
    removed_count = len(seen_jobs_data) - len(cleaned_data)
    if removed_count > 0:
        logger.info(f"Cleaned up {removed_count} old job entries")
    
    return cleaned_data

def load_config() -> List[Dict[str, Any]]:
    """Loads job search configurations from config.json with validation."""
    try:
        with open(Config.CONFIG_FILE, 'r') as f:
            config_data = json.load(f)
        
        # Validate configuration against schema
        jsonschema.validate(config_data, CONFIG_SCHEMA)
        logger.info(f"Loaded {len(config_data['feeds'])} feed configurations")
        return config_data["feeds"]
        
    except FileNotFoundError:
        logger.error(f"Config file {Config.CONFIG_FILE} not found")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {Config.CONFIG_FILE}: {e}")
        return []
    except jsonschema.ValidationError as e:
        logger.error(f"Invalid configuration schema: {e.message}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error loading {Config.CONFIG_FILE}: {e}")
        return []

def load_seen_jobs() -> Dict[str, str]:
    """Loads seen job links with timestamps from seen_jobs.json."""
    try:
        with open(Config.SEEN_JOBS_FILE, 'r') as f:
            data = json.load(f)
        
        # Handle legacy format (list) and convert to dict with timestamps
        if isinstance(data, list):
            logger.info("Converting legacy seen_jobs format to timestamped format")
            current_time = datetime.now().isoformat()
            data = {job_link: current_time for job_link in data}
        
        # Cleanup old entries
        data = cleanup_old_jobs(data)
        logger.info(f"Loaded {len(data)} seen job entries")
        return data
        
    except FileNotFoundError:
        logger.info("No seen jobs file found, starting fresh")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in {Config.SEEN_JOBS_FILE}: {e}")
        return {}
    except Exception as e:
        logger.error(f"Unexpected error loading {Config.SEEN_JOBS_FILE}: {e}")
        return {}

def save_seen_jobs(seen_jobs: Dict[str, str]) -> None:
    """Saves seen job links with timestamps to seen_jobs.json."""
    try:
        with open(Config.SEEN_JOBS_FILE, 'w') as f:
            json.dump(seen_jobs, f, indent=2)
        logger.info(f"Saved {len(seen_jobs)} seen job entries")
    except Exception as e:
        logger.error(f"Error saving seen jobs: {e}")



async def fetch_feed_async(session: aiohttp.ClientSession, feed_config: Dict[str, Any]) -> Optional[feedparser.FeedParserDict]:
    """Asynchronously fetch and parse an RSS feed with retry logic"""
    for attempt in range(Config.MAX_RETRIES):
        try:
            params = urlencode(feed_config["params"]) if feed_config.get("params") else None
            url = f"{feed_config['url']}?{params}" if params else feed_config['url']
            
            async with session.get(url, timeout=aiohttp.ClientTimeout(total=Config.REQUEST_TIMEOUT)) as response:
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    logger.info(f"Successfully fetched {feed_config['name']} (attempt {attempt + 1})")
                    return feed
                else:
                    logger.warning(f"HTTP {response.status} for {feed_config['name']} (attempt {attempt + 1})")
                    
        except asyncio.TimeoutError:
            logger.warning(f"Timeout for {feed_config['name']} (attempt {attempt + 1})")
        except Exception as e:
            logger.warning(f"Error fetching {feed_config['name']} (attempt {attempt + 1}): {e}")
        
        if attempt < Config.MAX_RETRIES - 1:
            await asyncio.sleep(Config.RETRY_DELAY * (attempt + 1))  # Exponential backoff
    
    logger.error(f"Failed to fetch {feed_config['name']} after {Config.MAX_RETRIES} attempts")
    return None

def send_discord_notification(new_jobs: List[Dict[str, Any]]) -> None:
    """Sends mobile-optimized job notifications to Discord with enhanced formatting."""
    if not Config.DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL not set. Skipping notification.")
        return

    # Limit to prevent overwhelming notifications
    if len(new_jobs) > Config.MAX_JOBS_PER_RUN:
        logger.info(f"Found {len(new_jobs)} jobs, limiting to {Config.MAX_JOBS_PER_RUN} to prevent spam.")
        new_jobs = new_jobs[:Config.MAX_JOBS_PER_RUN]

    embeds = []
    total_jobs = len(new_jobs)
    
    for i, job in enumerate(new_jobs, 1):
        # Create mobile-friendly title with job counter - sanitize the title
        title = sanitize_text(job['title'])
        title = f"🎯 {title[:80]}{'...' if len(title) > 80 else ''}"
        
        # Format description with key info for mobile viewing
        description = f"**Source:** {sanitize_text(job['source_name'])}\n"
        if job.get('published'):
            description += f"**Posted:** {job['published'][:10]}\n"  # Keep date short
        description += f"**Job #{i} of {total_jobs}**"
        
        embed = {
            "title": title,
            "url": job['link'],
            "description": description,
            "color": 0x00ff00,  # Green color for positive job news
            "footer": {
                "text": f"GitJobHunter • {sanitize_text(job['source_name'])}"
            },
            "timestamp": job.get('published') or None
        }
        
        # Add fields for better mobile layout
        embed["fields"] = [
            {
                "name": "🔗 Apply",
                "value": f"[Click here to apply]({job['link']})",
                "inline": True
            }
        ]
        
        embeds.append(embed)

    # Discord has a limit of 10 embeds per message
    for i in range(0, len(embeds), 10):
        chunk = embeds[i:i+10]
        chunk_start = i + 1
        chunk_end = min(i + 10, total_jobs)
        
        # Enhanced header message with summary
        if total_jobs <= 10:
            content = f"🚀 **{total_jobs} New Job{'s' if total_jobs != 1 else ''} Found!**\n💼 Fresh opportunities are waiting for you!"
        else:
            content = f"🚀 **Jobs {chunk_start}-{chunk_end} of {total_jobs} New Positions!**\n💼 More opportunities discovered!"
        
        data = {
            "content": content,
            "embeds": chunk
        }
        
        try:
            response = requests.post(Config.DISCORD_WEBHOOK_URL, json=data, timeout=Config.REQUEST_TIMEOUT)
            response.raise_for_status()
            logger.info(f"Successfully sent jobs {chunk_start}-{chunk_end} notification to Discord.")
            
            # Small delay between batches to be extra nice to Discord's API
            if i + 10 < len(embeds):
                time.sleep(1)
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Error sending Discord notification for jobs {chunk_start}-{chunk_end}: {e}")



async def main() -> None:
    """Main function to find and report new jobs with async processing."""
    # Health check
    health_issues = health_check()
    if health_issues:
        for issue in health_issues:
            logger.error(issue)
        if not Config.DISCORD_WEBHOOK_URL:
            logger.info("Continuing without Discord notifications...")
        if not os.path.exists(Config.CONFIG_FILE):
            return

    feeds = load_config()
    if not feeds:
        logger.error("No feeds configured. Exiting.")
        return

    seen_jobs = load_seen_jobs()
    new_jobs = []

    logger.info("Starting job search...")

    # Create async session for concurrent feed processing
    timeout = aiohttp.ClientTimeout(total=Config.REQUEST_TIMEOUT)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        # Process feeds concurrently
        tasks = [fetch_feed_async(session, feed_config) for feed_config in feeds]
        feeds_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for feed_config, feed_result in zip(feeds, feeds_results):
            if isinstance(feed_result, Exception):
                logger.error(f"Exception processing {feed_config['name']}: {feed_result}")
                continue
            
            if feed_result is None:
                continue
                
            # At this point, feed_result is guaranteed to be a valid FeedParserDict
            try:
                feed = feed_result
                entries = getattr(feed, 'entries', [])
                logger.info(f"Processing {len(entries)} entries from {feed_config['name']}")
                
                for entry in entries:
                    job_link = entry.get("link")
                    if job_link and job_link not in seen_jobs:
                        job_title = sanitize_text(str(entry.get('title', 'No Title')))
                        logger.info(f"Found new job: {job_title}")
                        
                        new_jobs.append({
                            "title": job_title,
                            "link": str(job_link),
                            "source_name": feed_config["name"],
                            "published": entry.get("published")
                        })
                        
                        # Add with timestamp
                        seen_jobs[str(job_link)] = datetime.now().isoformat()
                        logger.debug(f"Job link: {job_link}")
            except (AttributeError, TypeError) as e:
                logger.error(f"Invalid feed structure from {feed_config['name']}: {e}")
                continue

    logger.info("Job search complete.")

    if new_jobs:
        logger.info(f"Found a total of {len(new_jobs)} new jobs. Sending notification...")
        send_discord_notification(new_jobs)
        save_seen_jobs(seen_jobs)
    else:
        logger.info("No new jobs found.")



if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Job search interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise