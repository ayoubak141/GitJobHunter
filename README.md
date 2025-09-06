# **GitJobhunter 🤖**

*Your personal, automated job-finding agent that runs on GitHub Actions.*

GitJobhunter is a robust Python-based bot that automates your job search with enterprise-grade reliability. It fetches new job postings daily from multiple RSS feeds, intelligently filters duplicates, and sends professional notifications directly to your Discord. Built with async processing, comprehensive error handling, and full test coverage.

## **Key Features ✨**

* **🚀 Async Processing**: Concurrent feed fetching for optimal performance
* **🛡️ Production Ready**: Comprehensive error handling, retries, and logging
* **🧹 Smart Data Management**: Automatic cleanup of old job entries 
* **📊 Full Monitoring**: Structured logging and health checks
* **🧪 Fully Tested**: Complete unit test coverage with pytest
* **⚙️ Highly Configurable**: Environment-based configuration with validation
* **🔄 Auto-Recovery**: Retry logic with exponential backoff
* **📱 Rich Notifications**: Mobile-optimized Discord alerts with sanitized content
* **🔒 Security First**: Input sanitization and secure webhook handling

## **Tech Stack 🛠️**

* **Backend**: Python 3.10+ with asyncio
* **Libraries**: aiohttp, feedparser, requests, jsonschema
* **Testing**: pytest with async support
* **Quality**: flake8 linting, comprehensive error handling
* **Automation**: GitHub Actions with matrix testing
* **Monitoring**: Structured logging with file and console output

## **Quick Start 🚀**

### **Automated Installation**
```bash
git clone https://github.com/YOUR_USERNAME/GitJobhunter.git
cd GitJobhunter
./install_and_test.sh
```

### **Manual Installation**

**Prerequisites:**
* Python 3.10+
* A Discord server with webhook permissions

**Setup:**
1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/GitJobhunter.git
   cd GitJobhunter
   pip install -r requirements.txt
   ```

2. **Configure Discord webhook:**
   ```bash
   export DISCORD_WEBHOOK_URL="your_discord_webhook_url"
   ```

3. **Run health check:**
   ```bash
   python job_finder.py
   ```

4. **Run tests:**
   ```bash
   pytest tests/ -v
   ```

## **Configuration ⚙️**

### **Environment Variables**
```bash
# Required
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Optional (with defaults)
export CONFIG_FILE="config.json"                # Config file path
export SEEN_JOBS_FILE="seen_jobs.json"         # Seen jobs storage
export MAX_JOBS_PER_RUN="50"                   # Max jobs per notification
export REQUEST_TIMEOUT="30"                    # HTTP timeout in seconds
export MAX_RETRIES="3"                         # Retry attempts per feed
export RETRY_DELAY="2"                         # Base delay between retries
export CLEANUP_AGE_DAYS="30"                   # Days to keep old job records
export LOG_LEVEL="INFO"                        # Logging level (DEBUG/INFO/WARNING/ERROR)
```

### **config.json Structure**
```json
{
  "feeds": [
    {
      "name": "WeWorkRemotely Programming",
      "url": "https://weworkremotely.com/categories/remote-programming-jobs.rss",
      "source": "WeWorkRemotely",
      "category": "remote/tech",
      "params": null
    },
    {
      "name": "Indeed Remote Software Engineer",
      "url": "https://rss.indeed.com/rss",
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

## **GitHub Actions Setup 🔧**

The improved workflow includes:
- **Multi-Python testing** (3.10, 3.11, 3.12)
- **Dependency caching** for faster builds  
- **Automated testing** on push/PR
- **Code quality checks** with flake8
- **Separate test and deployment jobs**

## **Advanced Features 🔬**

### **Async Processing**
```python
# Concurrent feed fetching with proper error handling
async with aiohttp.ClientSession() as session:
    tasks = [fetch_feed_async(session, feed) for feed in feeds]
    results = await asyncio.gather(*tasks, return_exceptions=True)
```

### **Smart Data Cleanup**
```python
# Automatic cleanup of job entries older than 30 days
cleaned_data = cleanup_old_jobs(seen_jobs, max_age_days=30)
```

### **Health Monitoring**
```python
# Pre-flight health checks
health_issues = health_check()
if health_issues:
    logger.error("Health check failed: %s", health_issues)
```

### **Input Sanitization**
```python
# Secure text processing for Discord
sanitized_title = sanitize_text(job_title)
```

## **Testing 🧪**

### **Run All Tests**
```bash
pytest tests/ -v
```

### **Run Specific Test Categories**
```bash
pytest tests/test_job_finder.py::TestConfig -v
pytest tests/test_job_finder.py::TestAsyncFunctions -v
```

### **Test Coverage**
```bash
pytest tests/ --cov=job_finder --cov-report=html
```

## **Monitoring & Debugging 📊**

### **Log Levels**
- **DEBUG**: Detailed execution information
- **INFO**: General operation status  
- **WARNING**: Recoverable issues
- **ERROR**: Serious problems requiring attention

### **Log Files**
- Application logs: `job_finder.log`
- Structured format with timestamps and function names
- Automatic log rotation (configure as needed)

### **Health Checks**
Built-in health monitoring checks:
- Discord webhook URL configuration
- Config file existence and validity  
- Feed accessibility
- Data file integrity

## **Production Deployment 🚀**

### **Recommended Settings**
```bash
export LOG_LEVEL="INFO"
export MAX_JOBS_PER_RUN="25"
export REQUEST_TIMEOUT="45"
export MAX_RETRIES="5"
export CLEANUP_AGE_DAYS="14"
```

### **GitHub Secrets Required**
- `DISCORD_WEBHOOK_URL`: Your Discord webhook URL

### **Optional GitHub Secrets**
- `LOG_LEVEL`: Override default logging level
- `MAX_JOBS_PER_RUN`: Limit notifications per run

## **Troubleshooting 🔧**

### **Common Issues**

**No jobs found:**
```bash
# Check feed accessibility
export LOG_LEVEL="DEBUG"
python job_finder.py
```

**Discord notifications not working:**
```bash
# Verify webhook URL
curl -X POST "$DISCORD_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"content":"Test message"}'
```

**Config validation errors:**
```bash
# Test configuration
python -c "from job_finder import load_config; print(load_config())"
```

## **Development 👨‍💻**

### **Code Quality**
```bash
# Linting
flake8 job_finder.py --max-line-length=120

# Type checking (if mypy installed)
mypy job_finder.py
```

### **Adding New Features**
1. Write tests first (`tests/test_job_finder.py`)
2. Implement feature with proper error handling
3. Add logging statements
4. Update documentation
5. Ensure CI passes

## **Performance 📈**

**Benchmarks** (with 13 feeds):
- **Sequential processing**: ~45 seconds
- **Async processing**: ~8-12 seconds
- **Memory usage**: ~25MB peak
- **Network efficiency**: Concurrent with timeouts

## **Security 🔒**

- ✅ Environment variable configuration
- ✅ Input sanitization for Discord messages  
- ✅ HTML entity decoding
- ✅ URL validation in configuration
- ✅ Secure request handling with timeouts
- ✅ No sensitive data in logs

## **License 📄**

This project is licensed under the MIT License.

## **Contributing 🤝**

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

---

**Made with ❤️ for job seekers everywhere**