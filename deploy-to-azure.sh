#!/bin/bash

echo "🚀 Deploying Hackronyx to Azure..."
echo

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first."
    echo "Run: curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
    exit 1
fi

echo "✅ Azure CLI found"
echo

# Login to Azure
echo "🔐 Logging into Azure..."
az login
if [ $? -ne 0 ]; then
    echo "❌ Failed to login to Azure"
    exit 1
fi

echo "✅ Successfully logged into Azure"
echo

# Set variables
RESOURCE_GROUP="hackronyx-rg"
APP_NAME="hackronyx-app"
LOCATION="eastus"

echo "📋 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION
if [ $? -ne 0 ]; then
    echo "❌ Failed to create resource group"
    exit 1
fi

echo "✅ Resource group created"
echo

echo "🏗️ Creating App Service plan..."
az appservice plan create --name "${APP_NAME}-plan" --resource-group $RESOURCE_GROUP --sku F1 --is-linux
if [ $? -ne 0 ]; then
    echo "❌ Failed to create App Service plan"
    exit 1
fi

echo "✅ App Service plan created"
echo

echo "🌐 Creating Web App..."
az webapp create --resource-group $RESOURCE_GROUP --plan "${APP_NAME}-plan" --name $APP_NAME --runtime "PYTHON|3.11"
if [ $? -ne 0 ]; then
    echo "❌ Failed to create Web App"
    exit 1
fi

echo "✅ Web App created"
echo

echo "📦 Deploying application..."
az webapp deployment source config --resource-group $RESOURCE_GROUP --name $APP_NAME --repo-url https://github.com/YOUR_USERNAME/hackronyx.git --branch main --manual-integration
if [ $? -ne 0 ]; then
    echo "❌ Failed to configure deployment source"
    echo "Please update the GitHub URL in this script"
    exit 1
fi

echo "✅ Deployment configured"
echo

echo "🔧 Setting up environment variables..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings @.azure/appsettings.json
if [ $? -ne 0 ]; then
    echo "⚠️ Failed to set app settings. Please set them manually in Azure Portal"
fi

echo "✅ Environment variables configured"
echo

echo "🎉 Deployment completed!"
echo
echo "🌐 Your app URL: https://${APP_NAME}.azurewebsites.net"
echo
echo "📝 Next steps:"
echo "1. Update environment variables in Azure Portal"
echo "2. Test your application"
echo "3. Configure custom domain (optional)"
echo
