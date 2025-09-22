# 🚀 Azure Deployment Guide for Hackronyx Project

## Prerequisites for Student Deployment

### 1. Azure Student Account Setup
- **Azure for Students**: Get $100 in free credits + free services
- **GitHub Student Pack**: Additional $200 in Azure credits
- **Total**: Up to $300 in free Azure credits!

### 2. Required Accounts
- ✅ **Student Email ID** (already have)
- ✅ **GitHub Account** (for code repository)
- 🔄 **Azure Account** (we'll create this)

---

## Step 1: Create Azure Account with Student Benefits

### 1.1 Sign up for Azure for Students
1. Go to [Azure for Students](https://azure.microsoft.com/en-us/free/students/)
2. Click **"Start free"**
3. Sign in with your **student email ID**
4. Verify your student status (may require school verification)
5. Complete the signup process

### 1.2 Activate GitHub Student Pack
1. Go to [GitHub Education](https://education.github.com/pack)
2. Apply with your student email
3. Get approved (usually within 24-48 hours)
4. Link your GitHub account to Azure for additional credits

---

## Step 2: Prepare Your Project for Azure

### 2.1 Create GitHub Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial commit for Azure deployment"

# Create GitHub repository and push
# Go to GitHub.com → New Repository → Create
git remote add origin https://github.com/YOUR_USERNAME/hackronyx.git
git push -u origin main
```

### 2.2 Environment Variables Setup
Create a `.env` file in your project root:

```env
# AI Services
GEMINI_API_KEY=your_gemini_api_key
SCRAPINGDOG_API_KEY=your_scrapingdog_key
GITHUB_TOKEN=your_github_token
OPENROUTER_API_KEY=your_openrouter_key

# Azure AI Services
AZURE_ENDPOINT=your_azure_endpoint
AZURE_MODEL=your_azure_model
AZURE_TOKEN=your_azure_token

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# App Configuration
FLASK_ENV=production
PORT=5000
```

---

## Step 3: Deploy to Azure App Service

### 3.1 Create Azure App Service
1. **Login to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with your student account

2. **Create Resource Group**
   - Click "Create a resource"
   - Search "Resource Group"
   - Name: `hackronyx-rg`
   - Region: Choose closest to your users

3. **Create App Service Plan**
   - Click "Create a resource"
   - Search "App Service Plan"
   - Choose **F1 Free tier** (perfect for students!)
   - Link to your resource group

4. **Create Web App**
   - Click "Create a resource"
   - Search "Web App"
   - Name: `hackronyx-app` (must be globally unique)
   - Runtime: **Python 3.11**
   - Operating System: **Linux**
   - Region: Same as resource group
   - App Service Plan: Select the one you created

### 3.2 Configure Deployment

#### Option A: Direct GitHub Deployment (Recommended)
1. In your Web App, go to **Deployment Center**
2. Choose **GitHub** as source
3. Authorize Azure to access your GitHub
4. Select your repository: `hackronyx`
5. Branch: `main`
6. Click **Save**

#### Option B: Manual Deployment
1. Install **Azure CLI**:
   ```bash
   # Windows (PowerShell as Admin)
   Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
   Start-Process msiexec.exe -Wait -ArgumentList '/I AzureCLI.msi /quiet'
   
   # Or use winget
   winget install Microsoft.AzureCLI
   ```

2. Login to Azure:
   ```bash
   az login
   ```

3. Deploy your app:
   ```bash
   # Install Azure CLI extension
   az extension add --name webapp
   
   # Deploy from local folder
   az webapp deployment source config-zip \
     --resource-group hackronyx-rg \
     --name hackronyx-app \
     --src ./deployment.zip
   ```

---

## Step 4: Configure Environment Variables

### 4.1 Set Application Settings
1. In Azure Portal, go to your Web App
2. Navigate to **Configuration** → **Application settings**
3. Add each environment variable from your `.env` file:

| Name | Value | Description |
|------|-------|-------------|
| `GEMINI_API_KEY` | `your_actual_key` | Google Gemini API |
| `SCRAPINGDOG_API_KEY` | `your_actual_key` | Web scraping service |
| `GITHUB_TOKEN` | `your_actual_key` | GitHub API access |
| `OPENROUTER_API_KEY` | `your_actual_key` | OpenRouter AI service |
| `SUPABASE_URL` | `your_actual_url` | Database connection |
| `SUPABASE_ANON_KEY` | `your_actual_key` | Database public key |
| `SUPABASE_SERVICE_KEY` | `your_actual_key` | Database service key |
| `FLASK_ENV` | `production` | Flask environment |
| `PORT` | `5000` | Application port |

### 4.2 Save Configuration
- Click **Save** after adding all variables
- The app will restart automatically

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Get Free Domain
- Use **Freenom** for free `.tk`, `.ml`, `.ga` domains
- Or use **GitHub Pages** subdomain: `yourusername.github.io`

### 5.2 Configure in Azure
1. Go to **Custom domains** in your Web App
2. Add your domain
3. Follow DNS configuration instructions
4. Enable SSL certificate (free with Azure)

---

## Step 6: Monitor and Scale

### 6.1 Application Insights (Free Tier)
1. Enable **Application Insights** for monitoring
2. Track performance, errors, and usage
3. Set up alerts for critical issues

### 6.2 Scaling Options
- **F1 Free**: 1 GB RAM, 1 GB storage
- **B1 Basic**: $13.14/month (60% off with student discount)
- **S1 Standard**: $73.50/month (60% off with student discount)

---

## Step 7: Cost Optimization for Students

### 7.1 Free Services You Get
- ✅ **App Service F1**: Free forever
- ✅ **Application Insights**: 5GB free per month
- ✅ **Azure Database**: 32GB free for 12 months
- ✅ **Storage Account**: 5GB free
- ✅ **CDN**: 1TB free for 12 months

### 7.2 Estimated Monthly Costs
- **Free Tier**: $0/month
- **Basic Tier**: ~$5/month (with student discount)
- **Standard Tier**: ~$30/month (with student discount)

---

## Step 8: Troubleshooting

### 8.1 Common Issues

**Deployment Failed:**
```bash
# Check logs
az webapp log tail --resource-group hackronyx-rg --name hackronyx-app
```

**Environment Variables Not Working:**
- Ensure all variables are set in Azure Portal
- Restart the app after adding variables
- Check variable names match exactly

**App Not Starting:**
- Check the startup command in Azure
- Verify all dependencies are in requirements.txt
- Check application logs

### 8.2 Debug Commands
```bash
# View app logs
az webapp log tail --resource-group hackronyx-rg --name hackronyx-app

# Check app status
az webapp show --resource-group hackronyx-rg --name hackronyx-app

# Restart app
az webapp restart --resource-group hackronyx-rg --name hackronyx-app
```

---

## Step 9: Post-Deployment Checklist

### 9.1 Test Your Deployment
- [ ] App loads at `https://hackronyx-app.azurewebsites.net`
- [ ] All API endpoints work
- [ ] Database connections work
- [ ] Environment variables are loaded
- [ ] Frontend builds and serves correctly

### 9.2 Security Checklist
- [ ] Remove hardcoded API keys from code
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS (automatic with Azure)
- [ ] Configure CORS properly
- [ ] Set up proper authentication

### 9.3 Performance Optimization
- [ ] Enable compression
- [ ] Configure caching headers
- [ ] Optimize images and assets
- [ ] Set up CDN if needed

---

## Step 10: Going Live

### 10.1 Final Steps
1. **Test thoroughly** on the Azure URL
2. **Update DNS** if using custom domain
3. **Share your app** with users
4. **Monitor usage** and performance
5. **Set up backups** for important data

### 10.2 Student Benefits Summary
- 🎓 **$300 in free Azure credits**
- 🚀 **Free App Service hosting**
- 📊 **Free monitoring and analytics**
- 🔒 **Free SSL certificates**
- 🌐 **Global CDN included**
- 📱 **Mobile app support**

---

## 🎉 Congratulations!

Your Hackronyx project is now live on Azure! 

**Your app URL**: `https://hackronyx-app.azurewebsites.net`

**Next Steps:**
1. Share your app with friends and users
2. Monitor performance in Azure Portal
3. Scale up as your user base grows
4. Consider adding more Azure services as needed

**Need Help?**
- Azure Documentation: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
- Student Support: [azure.microsoft.com/students](https://azure.microsoft.com/students)
- Community: [Stack Overflow](https://stackoverflow.com/questions/tagged/azure)

---

*This guide leverages Azure for Students benefits to give you the best possible hosting experience at minimal cost!*
