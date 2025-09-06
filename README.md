# GitJobHunter

A Python script that checks job RSS feeds and posts new listings to Discord. Runs daily via GitHub Actions.

## Project Status

⚠️ **This project is not completed yet but is functional** - The core features work as intended, but there may be ongoing improvements and additional features being developed.

## What it does

- Checks 13 pre-configured job RSS feeds (WeWorkRemotely, RemoteOK, Indeed, etc.)
- Filters out jobs you've already seen 
- Sends new jobs to your Discord channel
- Runs automatically every day at 8 AM UTC

## Requirements

- Python 3.10+
- Discord webhook URL
- GitHub account (for automated runs)

## Setup Options

### Option 1: GitHub Actions (Recommended)

**Step 1: Get Discord Webhook**
- Open Discord and go to your server
- Right-click the channel where you want job notifications
- Select `Edit Channel` → `Integrations` → `Webhooks`
- Click `Create Webhook`
- Give it a name (e.g., "Job Hunter") and optionally set an avatar
- Click `Copy Webhook URL` - save this URL
- Click `Save Changes`

**Step 2: Setup GitHub Actions**
- Fork this repository to your GitHub account
- In your forked repo, go to `Settings` → `Secrets and variables` → `Actions`
- Click `New repository secret`
- Name: `DISCORD_WEBHOOK_URL`
- Value: paste your Discord webhook URL
- Click `Add secret`

**Step 3: Enable Actions**
- Go to the `Actions` tab in your repository
- Click `I understand my workflows, go ahead and enable them`
- The bot will now run automatically daily at 8 AM UTC

### Option 2: Run Locally

## Testing
**Step 1: Clone and Install**
```bash
git clone https://github.com/YOUR_USERNAME/GitJobHunter.git
cd GitJobHunter
pip install -r requirements.txt
```

**Step 2: Get Discord Webhook (same as above)**
- Open Discord → your server → right-click channel
- Edit Channel → Integrations → Webhooks → Create Webhook
- Copy the webhook URL

**Step 3: Set Environment Variable**
```bash
export DISCORD_WEBHOOK_URL="your_discord_webhook_url_here"
```

**Step 4: Run the Script**
```bash
python job_finder.py
```

**Step 5: Schedule It (Optional)**
Add to your crontab to run daily:
```bash
crontab -e
# Add this line to run daily at 8 AM:
0 8 * * * cd /path/to/GitJobHunter && python job_finder.py
```

## GitHub Actions Details

**Manual Trigger:**
- Go to your repo → `Actions` → `GitJobhunter` → `Run workflow`

**View Logs:**
- Go to `Actions` tab → click on latest workflow run → click on job to see logs

**Customize Schedule:**
Edit `.github/workflows/main.yml` and change the cron schedule:
```yaml
schedule:
  - cron: '0 8 * * *'  # Currently 8 AM UTC daily
```

## Discord Webhook Setup (Detailed)

**What is a Discord Webhook?**
A webhook is a URL that allows external applications to send messages to your Discord channel.

**Step-by-Step Instructions:**

1. **Open Discord** (desktop app or web)
2. **Go to your server** where you want job notifications
3. **Right-click on the text channel** you want to use
4. **Select "Edit Channel"** from the menu
5. **Click "Integrations"** in the left sidebar
6. **Click "Webhooks"** 
7. **Click "Create Webhook"** button
8. **Configure the webhook:**
   - Name: "Job Hunter" (or any name you like)
   - Avatar: Optional - upload an image
   - Channel: Should already be selected
9. **Click "Copy Webhook URL"** - this is what you need
10. **Click "Save Changes"**

**Test Your Webhook:**
```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"content":"✅ Job Hunter webhook is working!"}'
```

## Job Sources

The script checks these RSS feeds:
- WeWorkRemotely (all jobs + programming)
- RemoteOK 
- Remotive
- Hacker News jobs
- Indeed (remote software engineer)
- Monster, Craigslist, Upwork (examples)

*Total: 13 feeds configured in `config.json`*

## Troubleshooting

**Not getting notifications?**
```bash
# Test your webhook
curl -X POST "YOUR_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"content":"Test"}'
```

**Want to see what's happening?**
```bash
export LOG_LEVEL="DEBUG"
python job_finder.py
```

**Check GitHub Actions logs:**
Go to your repo → Actions → latest workflow run

## 🚀 Upcoming Features (Next Few Days)

We're actively working on several exciting enhancements to make GitJobHunter even more powerful and intelligent:

### 🎯 Smart Job Filtering
- **Keyword filtering system** - Include/exclude jobs based on specific keywords, technologies, or requirements
- **Location-based filtering** - Filter jobs by geographic location, remote-only options, or specific cities/countries
- **Job type classification** - Automatically categorize and filter jobs by employment type (full-time, contract, freelance, part-time)

### 🤖 AI-Powered Job Matching
- **CV-based job matching** - Upload your CV/resume and get an AI-powered matching score for each job posting
- **Intelligent job ranking** - Jobs will be ranked by relevance to your skills and experience
- **Personalized recommendations** - Get tailored job suggestions based on your profile and preferences

These features will transform GitJobHunter from a simple job aggregator into an intelligent career assistant that helps you find the most relevant opportunities while filtering out the noise.

Stay tuned for updates! 🎉

## License

MIT