# FlowSense - Advanced Water Analytics Dashboard

A modern, fully static web application for analyzing water consumption, revenue, and anomalies. Runs entirely in the browser with pre-loaded GeoJSON data—no backend required. Built with React, Vite, and Leaflet.

## Features

### 📊 **Advanced Analytics**
- **Temporal Analysis**: Month-over-month and year-over-year metrics
- **Multi-Dimensional Breakdown**: Analyze by area, route, classification, and status
- **Smart Insights**: Dynamic observations (rank-based, trends, anomalies, comparisons)
- **Advanced Filtering**: Multi-dimensional AND logic with real-time aggregations
- **7 KPI Cards**: Total consumption, revenue, account counts, averages

### 🗺️ **Interactive Maps**
- Leaflet map with clustered markers
- Account locations with clickable details
- Anomaly highlighting and search
- Zoom-to-location functionality
- Mobile-responsive map view

### 🔍 **Anomaly Detection**
- Identifies 3 types of consumption anomalies:
  - Sudden High (≥30% increase from previous month)
  - Sudden Down (≤70% decrease from previous month)
  - Zero Consumption (unexpected zero usage)
- Real-time anomaly dashboard with severity indicators
- Exportable anomaly records

### 📈 **5 Analytics Modules**
1. **Consumption Analytics**: Water consumption by area, route, status, classification
2. **Revenue Analytics**: Billing revenue patterns by dimension
3. **Area Performance**: Zone-based efficiency and status breakdown
4. **Route Efficiency**: Route utilization and performance metrics
5. **Status & Classification**: Account type analysis and ratios

### ⚡ **Performance**
- Sub-300ms filter response time with memoization
- Lazy-loaded analytics modules (code-splitting)
- Optimized chart rendering
- Mobile-responsive design across all breakpoints

### 🔐 **Static & Secure**
- No backend required—runs entirely in browser
- Pre-loaded GeoJSON data files (Feb-May 2026)
- Responsive authentication (demo mode included)
- Static hosting on Vercel

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone and install**:
   ```bash
   git clone https://github.com/yourusername/flowsense.git
   cd flowsense
   npm install
   ```

2. **Start dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser

3. **Build for production**:
   ```bash
   npm run build
   npm run preview
   ```

### Deployment to Vercel

**1. Push to GitHub**:
```bash
git remote add origin https://github.com/yourusername/flowsense.git
git branch -M main
git push -u origin main
```

**2. Connect to Vercel**:
- Visit [vercel.com](https://vercel.com) and sign in
- Click "Add New Project"
- Import your GitHub repository
- Vercel detects Vite automatically
- Deploy with one click

**3. Automatic builds**:
- Push to `main` branch triggers auto-deployment
- Preview deployments for pull requests
- No additional configuration needed

### Adding New Data Files

Data files are stored in `public/data/` as GeoJSON. To add new months:

1. **Generate/export GeoJSON**:
   - Format: `YYYY-MM.geojson` (e.g., `2026-06.geojson`)
   - Fields: `accountId`, `area`, `bookNo`, `rateCode`, `status`, `cumUsed`, `billAmount`, `geometry`

2. **Place in public/data/**:
   ```bash
   cp your-data/2026-06.geojson public/data/
   ```

3. **Update AVAILABLE_DATASETS** (optional):
   - Edit `src/lib/staticDataService.js`
   - Add new month to `AVAILABLE_DATASETS` array
   - App auto-discovers files in public/data

4. **Commit and push**:
   ```bash
   git add public/data/2026-06.geojson
   git commit -m "data: add June 2026 dataset"
   git push
   ```
   Vercel auto-deploys with new data

### GeoJSON Structure

Required properties per feature:
