# FlowSense Deployment Guide

## Vercel Static Deployment

FlowSense is a fully static web application designed for deployment on Vercel with zero configuration needed.

### Quick Start: 30 Seconds to Production

1. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/flowsense.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Visit https://vercel.com/new
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"
   - Deploy

3. **Done!** 🎉
   - Your app is live at `flowsense.vercel.app` (or custom domain)
   - Updates auto-deploy on git push

---

## Setup Guide

### Prerequisites
- GitHub account (for version control)
- Vercel account (free tier works)
- Node.js 18+ (for local development)

### Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/flowsense.git
cd flowsense

# Install dependencies
npm install

# Start dev server
npm run dev
# Opens http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Output is in dist/ folder (ready to deploy)
```

---

## Data Management

### Current Data Files

The app includes water consumption data for February-May 2026:
- `public/data/2026-02.geojson` — February 2026
- `public/data/2026-03.geojson` — March 2026
- `public/data/2026-04.geojson` — April 2026
- `public/data/2026-05.geojson` — May 2026

Each file contains ~5,000 water accounts with consumption and revenue metrics.

### Adding New Months

To add a new month (e.g., June 2026):

1. **Prepare GeoJSON file** (`2026-06.geojson`):
   - Export from your data source (e.g., PostgreSQL, qgis_main)
   - Format as GeoJSON FeatureCollection
   - Required fields per account:
     - `accountId`: Unique identifier
     - `area`: Service area/zone
     - `bookNo`: Route number
     - `rateCode`: Customer classification (01-21)
     - `status`: ACTIVE or DISCONNECTED
     - `cumUsed`: Monthly consumption (cubic meters)
     - `billAmount`: Billing amount
     - `geometry`: Point [longitude, latitude]

2. **Add to project**:
   ```bash
   cp 2026-06.geojson public/data/
   git add public/data/2026-06.geojson
   git commit -m "data: add June 2026 dataset"
   ```

3. **Update AVAILABLE_DATASETS** (optional):
   - Edit `src/lib/staticDataService.js`
   - Add new month to `AVAILABLE_DATASETS` array
   - App auto-discovers any GeoJSON in `public/data/`

4. **Deploy**:
   ```bash
   git push
   # Vercel auto-builds and deploys
   ```

New data will appear in the app within 2-3 minutes.

---

## Environment Variables

### Local Development

Create `.env.local` in project root (not committed to git):

```env
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_ADMIN_EMAIL=admin@example.com
```

Copy from `.env.example` as template.

### Vercel Production

Set environment variables in Vercel project settings:

1. Go to https://vercel.com/dashboard
2. Select "flowsense" project
3. Click "Settings" → "Environment Variables"
4. Add each variable (same as `.env.local`)
5. Redeploy (or auto-redeploys on next push)

---

## Performance

The app is fully optimized for static hosting:

- **Initial Load**: <2 seconds (lazy-loaded modules)
- **Filter Response**: <300ms (memoized aggregations)
- **Bundle Size**: ~400KB (gzipped)
- **Data Load**: <500ms for all 4 months

### Caching

Vercel automatically caches:
- Static assets (JS, CSS, images) — 365 days
- GeoJSON data files — 60 seconds
- HTML — 60 seconds

---

## GitHub Integration

### Branch Strategy

- **`main`** branch: Production
  - Deploy directly to Vercel
  - All PRs merged here are auto-deployed
  - Requires code review

- **Feature branches**: Development
  - Branch from `main`
  - Create PR when ready
  - Vercel creates preview deployment
  - Test on preview before merging

### Continuous Deployment

```
git push → GitHub → Vercel
                   ↓
         Auto-build & deploy
                   ↓
         Live in 2-3 minutes
```

No additional CI/CD configuration needed!

---

## Troubleshooting

### Build Fails on Vercel

Check the build log:
1. Go to https://vercel.com/dashboard/flowsense
2. Click "Deployments"
3. Select failed deployment
4. Click "View Logs" (from → Vercel)
5. Look for error messages

Common issues:
- Missing npm dependencies → Run `npm install` locally and commit `package-lock.json`
- Environment variables → Check Vercel project settings
- Invalid GeoJSON → Validate at [geojson.io](https://geojson.io)

### App Loads Slowly

Check:
1. Vercel deployment size: https://vercel.com/dashboard/flowsense/analytics
2. Network throttle in browser DevTools
3. GeoJSON file sizes (should be <5MB per month)

### Data Not Updating

If new GeoJSON files don't appear:
1. Check file is in `public/data/YYYY-MM.geojson` format
2. Verify GeoJSON is valid (use [geojson.io](https://geojson.io))
3. Redeploy: `git push` or redeploy in Vercel dashboard
4. Clear browser cache (Ctrl+Shift+Delete)
5. Hard refresh (Ctrl+F5)

---

## Security

### What's NOT in the Repo

The following are protected by `.gitignore` and never committed:

- `.env.local` (local secrets)
- `firebase_auth/` (service accounts)
- `node_modules/` (dependencies)
- `.vercel/` (build cache)
- `dist/` (build output)

### Sensitive Data Handling

- API keys stored in `.env.local` (local) and Vercel (production)
- Never commit `.env.local` or hardcoded credentials
- Use `.env.example` as template for needed variables

---

## Custom Domain

To use your own domain (e.g., `analytics.company.com`):

1. Go to https://vercel.com/dashboard/flowsense/settings/domains
2. Click "Add Domain"
3. Enter your domain
4. Follow DNS instructions for your registrar
5. DNS propagates in 24-48 hours

---

## Monitoring

### Vercel Analytics

Access at https://vercel.com/dashboard/flowsense/analytics:
- Real User Monitoring (RUM)
- Web Vitals
- Deployment history
- Performance metrics

### Error Tracking

Check Vercel logs if errors occur:
- Built-in error logging (free)
- Integrate with external service (optional):
  - Sentry
  - DataDog
  - New Relic

---

## Support

For deployment issues:
- Check Vercel status: https://status.vercel.com
- Review Vercel docs: https://vercel.com/docs
- Open GitHub issue with error logs
- Check `.gsd/` project documentation

---

_Last updated: 2026-06-10_
