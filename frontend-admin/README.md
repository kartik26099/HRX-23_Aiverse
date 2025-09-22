# DoLab Admin Dashboard

A modern, AI-powered admin dashboard for the DoLab learning platform. This dashboard provides comprehensive analytics and insights for managing the platform's community engagement and learning metrics.

## Features

- **Real-time Analytics**: Monitor community engagement, sentiment analysis, and user activity
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **AI Insights**: Get actionable recommendations based on data analysis

## Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Charts**: Recharts for data visualization
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Theme**: DoLab brand colors and gradients

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

4. Open [http://localhost:3002](http://localhost:3002) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Dashboard Sections

### Overview Stats
- Total Posts and Comments
- Sentiment Analysis
- Active Users
- Growth Metrics

### Analytics Charts
- **Posts Sentiment Distribution**: Pie chart showing positive, neutral, and negative posts
- **Comments Sentiment Distribution**: Pie chart for comment sentiment analysis
- **Topic Analysis**: Bar chart showing engagement by topic categories
- **Sentiment Trend**: Area chart displaying sentiment over time

### AI Recommendations
- Actionable insights for platform improvement
- Data-driven suggestions for content strategy

## Customization

### Colors and Theme
The dashboard uses DoLab's brand colors:
- Primary: Blue (#6366f1)
- Secondary: Purple (#8b5cf6)
- Success: Green (#10b981)
- Warning: Orange (#f59e0b)
- Error: Red (#ef4444)

### Adding New Charts
1. Import the required chart components from Recharts
2. Create a new Card component with the chart
3. Add it to the dashboard layout

## API Integration

The dashboard is designed to work with the DoLab backend sentiment analysis API. When the API is not available, it displays mock data for demonstration purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is part of the DoLab learning platform. 