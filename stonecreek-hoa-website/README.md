# Stone Creek Townhomes HOA Website

A modern, responsive community website for Stone Creek Townhomes HOA in Stallings, NC.

## 🚀 Deployment

This site is deployed as an **Azure Static Web App** connected to this GitHub repository.

### Files
```
├── index.html              # Main website (single-page)
├── 32735.jpg               # Hero background image
├── budgetwise-logo-hd.png  # Sponsor logo
├── README.md               # This file
└── .github/
    └── workflows/
        └── azure-static-web-apps.yml  # Auto-deploy on push
```

### Local Development
Simply open `index.html` in any browser. No build tools needed.

### Deployment Steps

#### 1. GitHub Setup
1. Create a new repo: `stonecreek-hoa-website`
2. Push all files to `main` branch

#### 2. Azure Static Web App
1. Go to [Azure Portal](https://portal.azure.com)
2. Create resource → **Static Web App**
3. Connect to your GitHub repo
4. Settings:
   - Build preset: **Custom**
   - App location: `/`
   - Output location: `/`
   - API location: *(leave blank)*
5. Azure auto-creates the GitHub Actions workflow

#### 3. Custom Domain (Optional)
In Azure Portal → Static Web App → Custom domains → Add your domain

## 📋 Features
- Responsive design (mobile hamburger menu)
- Live Google Calendar embed (pavilion booking)
- Automated booking system via n8n + Google Forms
- FAQ accordion
- BudgetWise sponsor section
- Board member directory
- Vendor directory links

## 🔧 To Update Content
Edit `index.html` directly and push to `main`. Azure auto-deploys within ~60 seconds.

## 📧 Contact
Managed by the Stone Creek HOA Board of Directors.
