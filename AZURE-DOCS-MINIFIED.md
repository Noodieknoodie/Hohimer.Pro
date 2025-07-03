# AZURE DOCS MINIFIED - Teams Tab Deployment Guide

## Teams Tab Manifest Configuration

### manifest.json Schema
```json
{
  "$schema": "https://developer.microsoft.com/en-us/json-schemas/teams/v1.16/MicrosoftTeams.schema.json",
  "manifestVersion": "1.16",
  "version": "1.0.0",
  "id": "${{TEAMS_APP_ID}}",
  "packageName": "com.hohimer.pro",
  "developer": {
    "name": "Hohimer Wealth Management",
    "websiteUrl": "https://hohimer.com",
    "privacyUrl": "https://hohimer.com/privacy",
    "termsOfUseUrl": "https://hohimer.com/terms"
  },
  "name": {
    "short": "HohimerPro",
    "full": "HohimerPro 401k Payment Tracker"
  },
  "description": {
    "short": "Track 401k advisor fee payments",
    "full": "Investment management suite for tracking and managing 401k advisor fee payments"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "accentColor": "#2563EB",
  "staticTabs": [
    {
      "entityId": "home",
      "name": "Home",
      "contentUrl": "${{TAB_ENDPOINT}}/tab",
      "scopes": ["personal", "groupChat", "team"]
    }
  ],
  "permissions": ["identity", "messageTeamMembers"],
  "validDomains": ["${{TAB_DOMAIN}}"]
}
```

## Teams Toolkit Commands

### Local Development
```bash
# Run locally with Teams
npm run dev:teamsfx

# This runs the m365agents.local.yml which:
# 1. Sets up local HTTPS (required for Teams)
# 2. Creates local app package
# 3. Installs to Teams for testing
```

### Deployment Commands
```bash
# Provision Azure resources
m365agents provision

# Deploy to Azure
m365agents deploy

# Publish to Teams app catalog
m365agents publish
```

## Azure Functions Integration

### Required Environment Variables
```
TEAMS_APP_ID=<from Teams app registration>
TAB_ENDPOINT=https://<your-app>.azurewebsites.net
TAB_DOMAIN=<your-app>.azurewebsites.net
REACT_APP_API_URL=https://<your-functions>.azurewebsites.net/api
SQL_SERVER=<azure-sql-server>.database.windows.net
SQL_DATABASE=hohimerpro
```

### Azure Resources Created by Teams Toolkit
1. **Azure App Service** - Hosts React frontend
2. **Azure Functions** - Already exists (Python backend)
3. **Azure AD App Registration** - For Teams authentication
4. **Storage Account** - For deployment artifacts

## Authentication Flow

### Teams SSO Setup
1. App registration in Azure AD
2. API permissions: User.Read (delegated)
3. Redirect URI: https://teams.microsoft.com/auth-end
4. Implicit grant: ID tokens enabled

### Frontend Authentication
```javascript
// In Teams context
import * as microsoftTeams from "@microsoft/teams-js";

microsoftTeams.app.initialize();
microsoftTeams.authentication.getAuthToken({
  successCallback: (token) => {
    // Use token for API calls
  },
  failureCallback: (error) => {
    // Handle auth failure
  }
});
```

## Deployment Process

### 1. Prepare Environment
```bash
# Set required environment variables
export TEAMS_APP_ID=<your-app-id>
export TAB_ENDPOINT=https://<app-name>.azurewebsites.net
export TAB_DOMAIN=<app-name>.azurewebsites.net
```

### 2. Build Application
```bash
npm run build
```

### 3. Provision Resources
```bash
m365agents provision
# This creates Azure resources defined in infra/azure.bicep
```

### 4. Deploy Code
```bash
m365agents deploy
# Deploys built assets to Azure App Service
```

### 5. Publish to Teams
```bash
m365agents publish
# Uploads app package to Teams admin center
```

## Key Files for Teams Integration

### m365agents.yml
- Defines provisioning and deployment pipeline
- Specifies Azure resources to create
- Sets deployment configurations

### m365agents.local.yml
- Local development configuration
- SSL certificate setup for HTTPS
- Local Teams app installation

### infra/azure.bicep
- Infrastructure as Code template
- Defines Azure App Service plan
- Sets up authentication configuration

### src/static/scripts/m365agents.ts
- Teams SDK initialization
- Context awareness (personal/team/channel)
- Theme detection and updates

## Troubleshooting

### Common Issues
1. **HTTPS Required**: Teams requires HTTPS even locally
   - Solution: Teams Toolkit handles SSL certificates automatically

2. **CORS Errors**: API calls blocked
   - Solution: Configure CORS in Azure Functions to allow Teams domain

3. **Auth Token Invalid**: 401 errors on API
   - Solution: Ensure Azure AD app registration includes API permissions

4. **Manifest Validation**: Upload fails
   - Solution: Use Teams App Validator before publishing

### Validation Checklist
- [ ] manifest.json validates against schema
- [ ] Icons are 192x192 (color) and 32x32 (outline)
- [ ] All environment variables are set
- [ ] HTTPS works locally and in Azure
- [ ] API endpoints are accessible from Teams domain
- [ ] Authentication flow completes successfully

## Next Steps for Hohimer.Pro

1. **Update manifest.json** with production values
2. **Configure Azure AD** for SSO if needed
3. **Run provision command** to create Azure resources
4. **Deploy application** to Azure
5. **Test in Teams** before publishing
6. **Publish to org catalog** for users

## References
- [Teams Tab Documentation](https://docs.microsoft.com/en-us/microsoftteams/platform/tabs/what-are-tabs)
- [Teams Toolkit Overview](https://docs.microsoft.com/en-us/microsoftteams/platform/toolkit/teams-toolkit-fundamentals)
- [Azure Functions with Teams](https://docs.microsoft.com/en-us/azure/azure-functions/functions-bindings-teams)