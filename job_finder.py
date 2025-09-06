import os
import json
import feedparser
import requests
from urllib.parse import urlencode

# --- Configuration ---
DISCORD_WEBHOOK_URL = os.environ.get("DISCORD_WEBHOOK_URL")
CONFIG_FILE = "config.json"
SEEN_JOBS_FILE = "seen_jobs.json"

def load_config():
    """Loads job search configurations from config.json."""
    try:
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)["feeds"]
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading {CONFIG_FILE}: {e}")
        return []

def load_seen_jobs():
    """Loads seen job links from seen_jobs.json."""
    try:
        with open(SEEN_JOBS_FILE, 'r') as f:
            return set(json.load(f))
    except (FileNotFoundError, json.JSONDecodeError):
        return set()

def save_seen_jobs(seen_jobs):
    """Saves seen job links to seen_jobs.json."""
    with open(SEEN_JOBS_FILE, 'w') as f:
        json.dump(list(seen_jobs), f, indent=2)

def send_discord_notification(new_jobs):
    """Sends a consolidated notification for new jobs to Discord."""
    if not DISCORD_WEBHOOK_URL:
        print("DISCORD_WEBHOOK_URL not set. Skipping notification.")
        return

    embeds = []
    for job in new_jobs:
        embeds.append({
            "title": job['title'],
            "url": job['link'],
            "description": f"Source: {job['source_name']}",
            "footer": {
                "text": f"Published: {job.get('published', 'N/A')}"
            }
        })

    # Discord has a limit of 10 embeds per message
    for i in range(0, len(embeds), 10):
        chunk = embeds[i:i+10]
        data = {
            "content": f"**Found {len(chunk)} new job postings!**",
            "embeds": chunk
        }
        try:
            response = requests.post(DISCORD_WEBHOOK_URL, json=data)
            response.raise_for_status()
            print(f"Successfully sent {len(chunk)} job notifications to Discord.")
        except requests.exceptions.RequestException as e:
            print(f"Error sending Discord notification: {e}")

def main():
    """Main function to find and report new jobs."""
    # if not DISCORD_WEBHOOK_URL:
    #     print("Error: DISCORD_WEBHOOK_URL environment variable not set.")
    #     return

    feeds = load_config()
    if not feeds:
        print("No feeds configured. Exiting.")
        return

    seen_jobs = load_seen_jobs()
    new_jobs = []

    print("Starting job search...")

    for feed_config in feeds:
        params = urlencode(feed_config["params"]) if feed_config.get("params") else None
        url = f"{feed_config['url']}?{params}" if params else feed_config['url']
        print(f"Fetching jobs from: {feed_config['name']}...")

        try:
            feed = feedparser.parse(url)
        except Exception as e:
            print(f"Error fetching or parsing feed for {feed_config['name']}: {e}")
            continue

        for entry in feed.entries:
            job_link = entry.get("link")
            if job_link and job_link not in seen_jobs:
                print(f"  Found new job: {entry.get('title')}")
                new_jobs.append({
                    "title": entry.get("title", "No Title"),
                    "link": job_link,
                    "source_name": feed_config["name"],
                    "published": entry.get("published")
                })
                seen_jobs.add(job_link)
                print(f"   job link: {job_link}")

    print("Job search complete.")

    if new_jobs:
        print(f"Found a total of {len(new_jobs)} new jobs. Sending notification...")
        # send_discord_notification(new_jobs)
        save_seen_jobs(seen_jobs)
    else:
        print("No new jobs found.")

if __name__ == "__main__":
    main()