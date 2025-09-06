#!/usr/bin/env python3
"""
Feed Health Manager - Utility script to manage RSS feed health
"""

import json
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any
import argparse


def load_feed_health(file_path: str = "feed_health.json") -> Dict[str, Dict[str, Any]]:
    """Load feed health data from file."""
    try:
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading feed health data: {e}")
    return {}


def save_feed_health(feed_health: Dict[str, Dict[str, Any]], file_path: str = "feed_health.json") -> None:
    """Save feed health data to file."""
    try:
        with open(file_path, "w") as f:
            json.dump(feed_health, f, indent=2)
        print(f"Feed health data saved to {file_path}")
    except Exception as e:
        print(f"Error saving feed health data: {e}")


def display_health_status(feed_health: Dict[str, Dict[str, Any]]) -> None:
    """Display comprehensive feed health status."""
    if not feed_health:
        print("No feed health data available.")
        return
    
    print("\n=== FEED HEALTH STATUS ===\n")
    
    healthy_feeds = []
    unhealthy_feeds = []
    disabled_feeds = []
    
    for feed_name, health in feed_health.items():
        if health.get("disabled", False):
            disabled_feeds.append((feed_name, health))
        elif health.get("consecutive_failures", 0) > 0:
            unhealthy_feeds.append((feed_name, health))
        else:
            healthy_feeds.append((feed_name, health))
    
    # Healthy feeds
    if healthy_feeds:
        print(f"🟢 HEALTHY FEEDS ({len(healthy_feeds)}):")
        for feed_name, health in healthy_feeds:
            success_rate = (health.get("total_successes", 0) / max(health.get("total_attempts", 1), 1)) * 100
            last_success = health.get("last_success", "Never")
            if last_success != "Never":
                last_success = datetime.fromisoformat(last_success).strftime("%Y-%m-%d %H:%M")
            print(f"  ✓ {feed_name}")
            print(f"    Success Rate: {success_rate:.1f}% | Last Success: {last_success}")
        print()
    
    # Unhealthy feeds
    if unhealthy_feeds:
        print(f"🟡 UNHEALTHY FEEDS ({len(unhealthy_feeds)}):")
        for feed_name, health in unhealthy_feeds:
            failures = health.get("consecutive_failures", 0)
            last_status = health.get("last_status_code", "Unknown")
            last_failure = health.get("last_failure", "Unknown")
            if last_failure != "Unknown":
                last_failure = datetime.fromisoformat(last_failure).strftime("%Y-%m-%d %H:%M")
            print(f"  ⚠️  {feed_name}")
            print(f"    Consecutive Failures: {failures} | Last Status: {last_status} | Last Failure: {last_failure}")
        print()
    
    # Disabled feeds
    if disabled_feeds:
        print(f"🔴 DISABLED FEEDS ({len(disabled_feeds)}):")
        for feed_name, health in disabled_feeds:
            failures = health.get("consecutive_failures", 0)
            last_status = health.get("last_status_code", "Unknown")
            last_failure = health.get("last_failure", "Unknown")
            if last_failure != "Unknown":
                last_failure = datetime.fromisoformat(last_failure).strftime("%Y-%m-%d %H:%M")
            print(f"  ❌ {feed_name}")
            print(f"    Consecutive Failures: {failures} | Last Status: {last_status} | Last Failure: {last_failure}")
        print()
    
    # Summary
    total_feeds = len(healthy_feeds) + len(unhealthy_feeds) + len(disabled_feeds)
    print(f"SUMMARY: {len(healthy_feeds)} healthy, {len(unhealthy_feeds)} unhealthy, {len(disabled_feeds)} disabled out of {total_feeds} total feeds")


def reset_feed_health(feed_health: Dict[str, Dict[str, Any]], feed_name: str) -> bool:
    """Reset health status for a specific feed."""
    if feed_name not in feed_health:
        print(f"Feed '{feed_name}' not found in health data.")
        return False
    
    feed_health[feed_name]["consecutive_failures"] = 0
    feed_health[feed_name]["disabled"] = False
    print(f"Reset health status for feed: {feed_name}")
    return True


def enable_feed(feed_health: Dict[str, Dict[str, Any]], feed_name: str) -> bool:
    """Enable a disabled feed."""
    if feed_name not in feed_health:
        print(f"Feed '{feed_name}' not found in health data.")
        return False
    
    feed_health[feed_name]["disabled"] = False
    feed_health[feed_name]["consecutive_failures"] = 0
    print(f"Enabled feed: {feed_name}")
    return True


def disable_feed(feed_health: Dict[str, Dict[str, Any]], feed_name: str) -> bool:
    """Disable a feed."""
    if feed_name not in feed_health:
        print(f"Feed '{feed_name}' not found in health data.")
        return False
    
    feed_health[feed_name]["disabled"] = True
    print(f"Disabled feed: {feed_name}")
    return True


def cleanup_old_health_data(feed_health: Dict[str, Dict[str, Any]], days: int = 30) -> int:
    """Remove health data older than specified days."""
    cutoff_date = datetime.now() - timedelta(days=days)
    feeds_to_remove = []
    
    for feed_name, health in feed_health.items():
        last_activity = None
        
        # Check last success or failure date
        if health.get("last_success"):
            try:
                last_activity = datetime.fromisoformat(health["last_success"])
            except:
                pass
        
        if health.get("last_failure"):
            try:
                failure_date = datetime.fromisoformat(health["last_failure"])
                if not last_activity or failure_date > last_activity:
                    last_activity = failure_date
            except:
                pass
        
        # If no recent activity, mark for removal
        if not last_activity or last_activity < cutoff_date:
            feeds_to_remove.append(feed_name)
    
    # Remove old feeds
    for feed_name in feeds_to_remove:
        del feed_health[feed_name]
        print(f"Removed old health data for: {feed_name}")
    
    return len(feeds_to_remove)


def main():
    parser = argparse.ArgumentParser(description="Manage RSS feed health status")
    parser.add_argument("--status", action="store_true", help="Show feed health status")
    parser.add_argument("--reset", type=str, help="Reset health for specific feed")
    parser.add_argument("--enable", type=str, help="Enable specific feed")
    parser.add_argument("--disable", type=str, help="Disable specific feed")
    parser.add_argument("--cleanup", type=int, help="Remove health data older than N days")
    parser.add_argument("--file", type=str, default="feed_health.json", help="Health data file path")
    
    args = parser.parse_args()
    
    if not any([args.status, args.reset, args.enable, args.disable, args.cleanup]):
        parser.print_help()
        return
    
    feed_health = load_feed_health(args.file)
    modified = False
    
    if args.status:
        display_health_status(feed_health)
    
    if args.reset:
        if reset_feed_health(feed_health, args.reset):
            modified = True
    
    if args.enable:
        if enable_feed(feed_health, args.enable):
            modified = True
    
    if args.disable:
        if disable_feed(feed_health, args.disable):
            modified = True
    
    if args.cleanup:
        removed_count = cleanup_old_health_data(feed_health, args.cleanup)
        if removed_count > 0:
            modified = True
            print(f"Cleaned up {removed_count} old feed health entries")
    
    if modified:
        save_feed_health(feed_health, args.file)


if __name__ == "__main__":
    main()
