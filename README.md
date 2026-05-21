# FlowSense - Static Water Anomaly Detection

A static web application for detecting water consumption anomalies using GeoJSON data. This version runs entirely in the browser without requiring a backend database.

## Features

- **Anomaly Detection**: Identifies 3 types of water consumption anomalies:
  - Sudden High (≥30% increase)
  - Sudden Down (≤70% decrease)
  - Zero Consumption (unexpected zero usage)

- **Interactive Dashboard**: Real-time statistics and charts
- **Map Visualization**: Geographic display of anomalies with color coding
- **Data Tables**: Searchable and filterable anomaly records
- **Static Data**: Uses pre-loaded GeoJSON files from `public/data/`

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder, ready for deployment to Vercel, Netlify, or any static hosting service.

## Data Structure

The app expects GeoJSON files in the `public/data/` folder with the following structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "AccountNumber": "ACC001",
        "Name": "John Smith",
        "Address": "123 Main St",
        "CumUsed": 150.5,
        "Month": "2024-01"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-118.2437, 34.0522]
      }
    }
  ]
}
```

### Adding New Data

1. Add new GeoJSON files to `public/data/` (e.g., `2024-04.geojson`)
2. Redeploy the application
3. The new data will automatically appear in the dashboard

## Anomaly Detection Logic

The system compares current month consumption against historical averages:

- **Average Calculation**: Uses previous months' data for each account
- **Sudden High**: Current ≥ Average × 1.30
- **Sudden Down**: Current ≤ Average × 0.70
- **Zero Consumption**: Current = 0 AND Average > 0

Severity levels: Critical, High, Medium, Low

## Tech Stack

- **Frontend**: React 18 + Vite
- **UI**: Tailwind CSS + Radix UI components
- **Charts**: Recharts
- **Maps**: React Leaflet
- **State**: TanStack React Query
- **Animations**: Framer Motion

## Maintainer

- **Dadi_Joe** — developer and maintainer

## Deployment

This app is designed for static hosting platforms:

- **Vercel**: Connect your GitHub repo and deploy automatically
- **Netlify**: Drag & drop the `dist/` folder or connect via Git
- **GitHub Pages**: Use GitHub Actions for automated deployment

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Route components
├── lib/           # Utilities and business logic
├── hooks/         # Custom React hooks
└── api/           # Vercel serverless auth and admin APIs

public/
└── data/          # GeoJSON data files

### Vercel backend configuration

This project uses Vercel KV for account storage and a magic-link email auth flow. Set the following environment variables in Vercel:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE` (optional, `true` or `false`)
- `EMAIL_FROM`
- `ADMIN_EMAIL`
- `SITE_URL` or rely on `VERCEL_URL`

Note: the first real signup request becomes the admin automatically. Subsequent signups require admin approval.
```

## License

This project is open source and available under the MIT License.
