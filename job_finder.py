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
from typing import Optional, List, Dict, Any
import jsonschema


# --- Configuration Class ---
class Config:
    DISCORD_WEBHOOK_URL: Optional[str] = os.getenv("DISCORD_WEBHOOK_URL")
    CONFIG_FILE: str = os.getenv("CONFIG_FILE", "config.json")
    SEEN_JOBS_FILE: str = os.getenv("SEEN_JOBS_FILE", "seen_jobs.json")
    FEED_HEALTH_FILE: str = os.getenv("FEED_HEALTH_FILE", "feed_health.json")
    MAX_JOBS_PER_RUN: int = int(os.getenv("MAX_JOBS_PER_RUN", "50"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "30"))
    MAX_RETRIES: int = int(os.getenv("MAX_RETRIES", "3"))
    RETRY_DELAY: int = int(os.getenv("RETRY_DELAY", "2"))
    CLEANUP_AGE_DAYS: int = int(os.getenv("CLEANUP_AGE_DAYS", "30"))
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    FEED_FAILURE_THRESHOLD: int = int(os.getenv("FEED_FAILURE_THRESHOLD", "5"))  # Consecutive failures before disabling


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
                    "params": {"type": ["object", "null"]},
                    "enabled": {"type": "boolean"},  # Allow disabling feeds
                },
            },
        }
    },
    "required": ["feeds"],
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
        "%(asctime)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s"
    )

    # File handler
    try:
        file_handler = logging.FileHandler("job_finder.log")
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
def sanitize_text(text: str | None, max_length: int = 500) -> str:
    """Sanitize text for Discord output with enhanced cleaning"""
    if not text:
        return "N/A"
    
    # HTML decode
    text = html.unescape(text)
    
    # Remove or replace problematic characters for Discord
    text = re.sub(r"[<>@&\u0000-\u001F\u007F-\u009F]", "", text)  # Remove control characters
    text = re.sub(r"\*{3,}", "**", text)  # Limit consecutive asterisks
    text = re.sub(r"_{3,}", "__", text)   # Limit consecutive underscores
    text = re.sub(r"`{3,}", "``", text)   # Limit consecutive backticks
    text = re.sub(r"\s+", " ", text)      # Normalize whitespace
    text = text.strip()
    
    # Truncate to max length with proper ending
    if len(text) > max_length:
        text = text[:max_length-3] + "..."
    
    return text


def health_check() -> List[str]:
    """Verify system health before running"""
    issues = []

    if not Config.DISCORD_WEBHOOK_URL:
        issues.append("DISCORD_WEBHOOK_URL not configured")

    if not os.path.exists(Config.CONFIG_FILE):
        issues.append(f"Config file {Config.CONFIG_FILE} not found")

    return issues


def cleanup_old_jobs(
    seen_jobs_data: Dict[str, str], max_age_days: Optional[int] = None
) -> Dict[str, str]:
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
        with open(Config.CONFIG_FILE, "r") as f:
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
        with open(Config.SEEN_JOBS_FILE, "r") as f:
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
        with open(Config.SEEN_JOBS_FILE, "w") as f:
            json.dump(seen_jobs, f, indent=2)
        logger.info(f"Saved {len(seen_jobs)} seen job entries")
    except Exception as e:
        logger.error(f"Error saving seen jobs: {e}")


def load_feed_health() -> Dict[str, Dict[str, Any]]:
    """Load feed health tracking data."""
    try:
        if os.path.exists(Config.FEED_HEALTH_FILE):
            with open(Config.FEED_HEALTH_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        logger.error(f"Error loading feed health data: {e}")
    return {}


def save_feed_health(feed_health: Dict[str, Dict[str, Any]]) -> None:
    """Save feed health tracking data."""
    try:
        with open(Config.FEED_HEALTH_FILE, "w") as f:
            json.dump(feed_health, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving feed health data: {e}")


def update_feed_health(feed_health: Dict[str, Dict[str, Any]], feed_name: str, 
                      success: bool, status_code: Optional[int] = None) -> None:
    """Update feed health tracking."""
    now = datetime.now().isoformat()
    
    if feed_name not in feed_health:
        feed_health[feed_name] = {
            "consecutive_failures": 0,
            "total_attempts": 0,
            "total_successes": 0,
            "last_success": None,
            "last_failure": None,
            "last_status_code": None,
            "disabled": False
        }
    
    health = feed_health[feed_name]
    health["total_attempts"] += 1
    health["last_status_code"] = status_code
    
    if success:
        health["consecutive_failures"] = 0
        health["total_successes"] += 1
        health["last_success"] = now
        health["disabled"] = False  # Re-enable if successful
    else:
        health["consecutive_failures"] += 1
        health["last_failure"] = now
        
        # Auto-disable if too many consecutive failures
        if health["consecutive_failures"] >= Config.FEED_FAILURE_THRESHOLD:
            health["disabled"] = True
            logger.warning(
                f"Auto-disabling feed '{feed_name}' after {health['consecutive_failures']} "
                f"consecutive failures. Last status: {status_code}"
            )


def is_feed_healthy(feed_health: Dict[str, Dict[str, Any]], feed_name: str) -> bool:
    """Check if a feed should be processed based on health status."""
    if feed_name not in feed_health:
        return True
    
    health = feed_health[feed_name]
    return not health.get("disabled", False)


async def fetch_feed_async(
    session: aiohttp.ClientSession, feed_config: Dict[str, Any], 
    feed_health: Dict[str, Dict[str, Any]]
) -> Optional[feedparser.FeedParserDict]:
    """Asynchronously fetch and parse an RSS feed with intelligent retry logic"""
    
    feed_name = feed_config['name']
    
    # Check if feed is disabled due to health issues
    if not is_feed_healthy(feed_health, feed_name):
        logger.info(f"Skipping disabled feed: {feed_name}")
        return None
    
    # Check if feed is manually disabled in config
    if not feed_config.get('enabled', True):
        logger.info(f"Skipping manually disabled feed: {feed_name}")
        return None
    
    # HTTP status codes that should not be retried
    NO_RETRY_CODES = {400, 401, 403, 404, 410, 451}  # Client errors that won't change
    PERMANENT_FAILURE_CODES = {410}  # Resource permanently gone
    
    last_status_code = None
    
    for attempt in range(Config.MAX_RETRIES):
        try:
            params = (
                urlencode(feed_config["params"]) if feed_config.get("params") else None
            )
            url = f"{feed_config['url']}?{params}" if params else feed_config["url"]

            # Add user agent and headers to reduce blocking
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; JobFinder/1.0; RSS Reader)',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache'
            }

            timeout = aiohttp.ClientTimeout(total=Config.REQUEST_TIMEOUT)
            async with session.get(url, headers=headers, timeout=timeout) as response:
                last_status_code = response.status
                
                if response.status == 200:
                    content = await response.text()
                    feed = feedparser.parse(content)
                    logger.info(
                        f"Successfully fetched {feed_name} (attempt {attempt + 1})"
                    )
                    # Update health tracking for success
                    update_feed_health(feed_health, feed_name, True, response.status)
                    return feed
                
                # Handle different HTTP error categories
                elif response.status in PERMANENT_FAILURE_CODES:
                    logger.error(
                        f"HTTP {response.status} (Permanent failure) for {feed_name} - "
                        f"Resource permanently unavailable, skipping retries"
                    )
                    update_feed_health(feed_health, feed_name, False, response.status)
                    return None
                
                elif response.status in NO_RETRY_CODES:
                    logger.error(
                        f"HTTP {response.status} (Client error) for {feed_name} - "
                        f"Not retrying client errors. Check feed URL and permissions."
                    )
                    update_feed_health(feed_health, feed_name, False, response.status)
                    return None
                
                elif response.status == 429:  # Rate limited
                    retry_after = response.headers.get('Retry-After', Config.RETRY_DELAY * 2)
                    try:
                        retry_after = int(retry_after)
                    except (ValueError, TypeError):
                        retry_after = Config.RETRY_DELAY * 2
                    
                    logger.warning(
                        f"HTTP 429 (Rate limited) for {feed_name} (attempt {attempt + 1}) - "
                        f"Waiting {retry_after} seconds"
                    )
                    
                    if attempt < Config.MAX_RETRIES - 1:
                        await asyncio.sleep(retry_after)
                    continue
                
                elif 500 <= response.status < 600:  # Server errors
                    logger.warning(
                        f"HTTP {response.status} (Server error) for {feed_name} (attempt {attempt + 1}) - "
                        f"Server issue, will retry"
                    )
                
                else:
                    logger.warning(
                        f"HTTP {response.status} for {feed_name} (attempt {attempt + 1})"
                    )

        except asyncio.TimeoutError:
            logger.warning(f"Timeout for {feed_name} (attempt {attempt + 1})")
            last_status_code = None  # Timeout, not HTTP status
        except aiohttp.ClientError as e:
            logger.warning(
                f"Client error for {feed_name} (attempt {attempt + 1}): {e}"
            )
            last_status_code = None
        except Exception as e:
            logger.warning(
                f"Unexpected error fetching {feed_name} (attempt {attempt + 1}): {e}"
            )
            last_status_code = None

        # Only retry if we haven't hit a non-retryable error
        if attempt < Config.MAX_RETRIES - 1:
            # Use longer delays for server errors
            delay = Config.RETRY_DELAY * (attempt + 1)
            if last_status_code and last_status_code >= 500:
                delay *= 2  # Double delay for server errors
            
            logger.debug(f"Waiting {delay} seconds before retry {attempt + 2}")
            await asyncio.sleep(delay)

    # Update health tracking for final failure
    update_feed_health(feed_health, feed_name, False, last_status_code)
    
    logger.error(
        f"Failed to fetch {feed_name} after {Config.MAX_RETRIES} attempts"
    )
    return None


def validate_timestamp(timestamp_str: str | None) -> str | None:
    """Validate and format timestamp for Discord embed"""
    if not timestamp_str:
        return None
    
    try:
        # Try common timestamp formats
        formats = [
            "%Y-%m-%dT%H:%M:%S%z",     # ISO with timezone
            "%Y-%m-%dT%H:%M:%SZ",      # ISO with Z
            "%Y-%m-%dT%H:%M:%S",       # ISO without timezone
            "%Y-%m-%d %H:%M:%S",       # Common format
            "%a, %d %b %Y %H:%M:%S %Z", # RSS format
            "%a, %d %b %Y %H:%M:%S %z", # RSS with timezone
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(timestamp_str.strip(), fmt)
                # Return in ISO format
                return dt.isoformat()
            except ValueError:
                continue
        
        # If no format matches, return None
        return None
    except Exception:
        return None


def send_discord_notification(new_jobs: List[Dict[str, Any]]) -> None:
    """Sends mobile-optimized job notifications to Discord with enhanced formatting."""
    if not Config.DISCORD_WEBHOOK_URL:
        logger.warning("DISCORD_WEBHOOK_URL not set. Skipping notification.")
        return

    # Limit to prevent overwhelming notifications
    if len(new_jobs) > Config.MAX_JOBS_PER_RUN:
        logger.info(
            f"Found {len(new_jobs)} jobs, limiting to {Config.MAX_JOBS_PER_RUN} to prevent spam."
        )
        new_jobs = new_jobs[: Config.MAX_JOBS_PER_RUN]

    embeds = []
    total_jobs = len(new_jobs)

    for i, job in enumerate(new_jobs, 1):
        try:
            # Create mobile-friendly title with job counter - sanitize the title
            title = sanitize_text(job.get("title", "Untitled Job"), max_length=200)  # Discord limit 256
            title = f"🎯 {title}"
            
            # Ensure title doesn't exceed Discord's limit
            if len(title) > 256:
                title = title[:253] + "..."

            # Format description with key info for mobile viewing
            source_name = sanitize_text(job.get('source_name', 'Unknown'), max_length=100)
            description = f"**Source:** {source_name}\n"
            
            if job.get("published"):
                published_date = str(job['published'])[:10]  # Keep date short
                description += f"**Posted:** {published_date}\n"
            
            description += f"**Job #{i} of {total_jobs}**"

            # Validate job link
            job_link = job.get("link", "")
            if not job_link or not job_link.startswith(("http://", "https://")):
                logger.warning(f"Invalid or missing job link for job {i}: {job_link}")
                job_link = "https://example.com"  # Fallback

            # Validate timestamp
            timestamp = validate_timestamp(job.get("published"))

            embed = {
                "title": title,
                "url": job_link,
                "description": description,
                "color": 0x00FF00,  # Green color for positive job news
                "footer": {"text": f"GitJobHunter • {source_name}"},
            }

            # Only add timestamp if it's valid
            if timestamp:
                embed["timestamp"] = timestamp

            # Add fields for better mobile layout
            embed["fields"] = [
                {
                    "name": "🔗 Apply",
                    "value": f"[Click here to apply]({job_link})",
                    "inline": True,
                }
            ]

            embeds.append(embed)
            
        except Exception as e:
            logger.error(f"Error creating embed for job {i}: {e}")
            continue

    if not embeds:
        logger.warning("No valid embeds created. Skipping notification.")
        return

    # Discord has a limit of 10 embeds per message
    for i in range(0, len(embeds), 10):
        chunk = embeds[i : i + 10]
        chunk_start = i + 1
        chunk_end = min(i + 10, len(embeds))

        # Enhanced header message with summary
        if len(embeds) <= 10:
            content = (
                f"🚀 **{len(embeds)} New Job{'s' if len(embeds) != 1 else ''} Found!**\n"
                "💼 Fresh opportunities are waiting for you!"
            )
        else:
            content = (
                f"🚀 **Jobs {chunk_start}-{chunk_end} of {len(embeds)} New Positions!**\n"
                "💼 More opportunities discovered!"
            )

        data = {"content": content, "embeds": chunk}

        try:
            response = requests.post(
                Config.DISCORD_WEBHOOK_URL, 
                json=data, 
                timeout=Config.REQUEST_TIMEOUT,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            logger.info(
                f"Successfully sent jobs {chunk_start}-{chunk_end} notification to Discord."
            )

            # Small delay between batches to be extra nice to Discord's API
            if i + 10 < len(embeds):
                time.sleep(1)

        except requests.exceptions.RequestException as e:
            logger.error(
                f"Error sending Discord notification for jobs {chunk_start}-{chunk_end}: {e}"
            )
            # Log the response content for debugging
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.text
                    logger.error(f"Discord API response: {error_detail}")
                except:
                    logger.error("Could not read error response from Discord API")
        except Exception as e:
            logger.error(f"Unexpected error sending Discord notification: {e}")


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
    feed_health = load_feed_health()
    new_jobs = []

    logger.info("Starting job search...")

    # Create async session for concurrent feed processing
    timeout = aiohttp.ClientTimeout(total=Config.REQUEST_TIMEOUT)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        # Process feeds concurrently
        tasks = [fetch_feed_async(session, feed_config, feed_health) for feed_config in feeds]
        feeds_results = await asyncio.gather(*tasks, return_exceptions=True)

        for feed_config, feed_result in zip(feeds, feeds_results):
            if isinstance(feed_result, Exception):
                logger.error(
                    f"Exception processing {feed_config['name']}: {feed_result}"
                )
                continue

            if feed_result is None:
                continue

            # At this point, feed_result is guaranteed to be a valid FeedParserDict
            try:
                feed = feed_result
                entries = getattr(feed, "entries", [])
                logger.info(
                    f"Processing {len(entries)} entries from {feed_config['name']}"
                )

                for entry in entries:
                    job_link = entry.get("link")
                    if job_link and job_link not in seen_jobs:
                        job_title = sanitize_text(str(entry.get("title", "No Title")))
                        logger.info(f"Found new job: {job_title}")

                        new_jobs.append(
                            {
                                "title": job_title,
                                "link": str(job_link),
                                "source_name": feed_config["name"],
                                "published": entry.get("published"),
                            }
                        )

                        # Add with timestamp
                        seen_jobs[str(job_link)] = datetime.now().isoformat()
                        logger.debug(f"Job link: {job_link}")
            except (AttributeError, TypeError) as e:
                logger.error(f"Invalid feed structure from {feed_config['name']}: {e}")
                continue

    logger.info("Job search complete.")

    # Save feed health data
    save_feed_health(feed_health)

    if new_jobs:
        logger.info(
            f"Found a total of {len(new_jobs)} new jobs. Sending notification..."
        )
        send_discord_notification(new_jobs)
        save_seen_jobs(seen_jobs)
    else:
        logger.info("No new jobs found.")

    # Log feed health summary
    disabled_feeds = [name for name, health in feed_health.items() if health.get("disabled")]
    if disabled_feeds:
        logger.warning(f"Disabled feeds due to repeated failures: {', '.join(disabled_feeds)}")
    
    healthy_feeds = [name for name, health in feed_health.items() 
                    if not health.get("disabled") and health.get("total_successes", 0) > 0]
    logger.info(f"Healthy feeds: {len(healthy_feeds)}, Disabled feeds: {len(disabled_feeds)}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Job search interrupted by user")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise
