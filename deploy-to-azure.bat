@echo off
echo 🚀 Deploying Hackronyx to Azure...
echo.

REM Check if Azure CLI is installed
az --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Azure CLI not found. Please install it first.
    echo Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
    pause
    exit /b 1
)

echo ✅ Azure CLI found
echo.

REM Login to Azure
echo 🔐 Logging into Azure...
az login
if %errorlevel% neq 0 (
    echo ❌ Failed to login to Azure
    pause
    exit /b 1
)

echo ✅ Successfully logged into Azure
echo.

REM Set variables
set RESOURCE_GROUP=hackronyx-rg
set APP_NAME=hackronyx-app
set LOCATION=eastus

echo 📋 Creating resource group...
az group create --name %RESOURCE_GROUP% --location %LOCATION%
if %errorlevel% neq 0 (
    echo ❌ Failed to create resource group
    pause
    exit /b 1
)

echo ✅ Resource group created
echo.

echo 🏗️ Creating App Service plan...
az appservice plan create --name %APP_NAME%-plan --resource-group %RESOURCE_GROUP% --sku F1 --is-linux
if %errorlevel% neq 0 (
    echo ❌ Failed to create App Service plan
    pause
    exit /b 1
)

echo ✅ App Service plan created
echo.

echo 🌐 Creating Web App...
az webapp create --resource-group %RESOURCE_GROUP% --plan %APP_NAME%-plan --name %APP_NAME% --runtime "PYTHON|3.11"
if %errorlevel% neq 0 (
    echo ❌ Failed to create Web App
    pause
    exit /b 1
)

echo ✅ Web App created
echo.

echo 📦 Deploying application...
az webapp deployment source config --resource-group %RESOURCE_GROUP% --name %APP_NAME% --repo-url https://github.com/YOUR_USERNAME/hackronyx.git --branch main --manual-integration
if %errorlevel% neq 0 (
    echo ❌ Failed to configure deployment source
    echo Please update the GitHub URL in this script
    pause
    exit /b 1
)

echo ✅ Deployment configured
echo.

echo 🔧 Setting up environment variables...
az webapp config appsettings set --resource-group %RESOURCE_GROUP% --name %APP_NAME% --settings @.azure/appsettings.json
if %errorlevel% neq 0 (
    echo ⚠️ Failed to set app settings. Please set them manually in Azure Portal
)

echo ✅ Environment variables configured
echo.

echo 🎉 Deployment completed!
echo.
echo 🌐 Your app URL: https://%APP_NAME%.azurewebsites.net
echo.
echo 📝 Next steps:
echo 1. Update environment variables in Azure Portal
echo 2. Test your application
echo 3. Configure custom domain (optional)
echo.
pause
