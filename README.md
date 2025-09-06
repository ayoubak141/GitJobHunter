# **GitJobhunter 🤖**

*Your personal, automated job-finding agent that runs on GitHub Actions.*

GitJobhunter is a Python-based bot that automates your job search. It fetches new job postings daily from multiple RSS feeds, filters out the ones you've already seen, and sends clean, formatted notifications directly to your Discord. Stop manually checking job boards and let your personal agent do the work for you.

## **Key Features ✨**

* **Multi-Source Searching**: Pulls job listings from any number of RSS feeds.  
* **Smart & Stateful**: Remembers which jobs it has sent to avoid duplicates.  
* **Highly Configurable**: Easily change job searches (keywords, locations) by editing a simple JSON file.  
* **Rich Discord Notifications**: Delivers well-formatted, clickable job alerts directly to your server.  
* **Fully Automated**: Runs on a "set it and forget it" daily schedule using GitHub Actions.

## **Tech Stack 🛠️**

* **Backend**: Python  
* **Libraries**: feedparser, requests  
* **Automation**: GitHub Actions

## **Getting Started 🚀**

Follow these steps to get your own instance of GitJobhunter up and running.

### **Prerequisites**

* Python 3.10+  
* A GitHub Account  
* A Discord Server where you have permission to create webhooks

### **Installation & Setup**

1. **Fork this repository** to your own GitHub account.  
2. **Clone your forked repository** to your local machine:  
   ```bash
   git clone https://github.com/YOUR_USERNAME/GitJobhunter.git
   cd GitJobhunter
   ```
3. **Create and Activate a Virtual Environment**:
   It is strongly recommended to use a Python virtual environment to manage dependencies.
   * **Create the environment**:
     ```bash
     python3 -m venv venv
     ```
   * **Activate it**:
     * On macOS/Linux:
       ```bash
       source venv/bin/activate
       ```
     * On Windows:
       ```bash
       .\venv\Scripts\activate
       ```
4. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
5. **Create a Discord Webhook**:  
   * In your Discord server, go to Server Settings > Integrations > Webhooks.  
   * Click New Webhook, give it a name (e.g., "Job Bot"), and copy the **Webhook URL**.  
6. **Set up GitHub Secrets**:  
   * In your forked GitHub repository, go to Settings > Secrets and variables > Actions.  
   * Click New repository secret.  
   * **Name**: DISCORD_WEBHOOK_URL  
   * **Value**: Paste the Webhook URL you copied from Discord.  
7. **Configure Your Job Searches**:  
   * Open the config.json file and customize it with your desired job searches (see the **Configuration** section below for details).  
8. **Commit and Push Your Configuration**:  
   ```bash
   git add config.json
   git commit -m "feat: Configure initial job searches"
   git push
   ```

7. **Activate the Workflow**: The GitHub Action is now set up\! It will run on its daily schedule. You can also trigger it manually by going to the Actions tab in your repository, clicking on the workflow, and selecting Run workflow.

## **Configuration ⚙️**

The config.json file is the heart of GitJobhunter. It allows you to define exactly what jobs you're looking for by creating a list of "feed objects."

* `name`: A friendly name for the feed, which will be used in notifications.
* `url`: The full URL of the RSS feed.
* `source`: The name of the job board or source.
* `category`: A category for the job feed.
* `params`: A dictionary of query parameters to be added to the URL, or `null` if there are none.

**Example config.json:**

```json
{
  "feeds": [
    {
      "name": "We Work Remotely - All Jobs",
      "url": "https://weworkremotely.com/remote-jobs.rss",
      "source": "We Work Remotely",
      "category": "remote/general",
      "params": null
    },
    {
      "name": "Indeed Job Search (Example)",
      "url": "https://rss.indeed.com/rss?q=software+engineer&l=Remote",
      "source": "Indeed",
      "category": "general/search",
      "params": {
        "q": "software+engineer",
        "l": "Remote"
      }
    }
  ]
}
```

## **License 📄**

This project is licensed under the MIT License.