Add data visualisation charts and graphs to the application.

What to build: $ARGUMENTS

**Install Recharts (recommended for React):**
```bash
npm install recharts
```

**Revenue/metrics chart:**
```tsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', revenue: 400, users: 240 },
  { month: 'Feb', revenue: 800, users: 398 },
  { month: 'Mar', revenue: 1200, users: 500 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7C6AFF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#7C6AFF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="#8E8E96" />
        <YAxis stroke="#8E8E96" />
        <Tooltip
          contentStyle={{ background: '#1A1A1F', border: '1px solid #2E2E35', borderRadius: 8 }}
          labelStyle={{ color: '#E8E8F0' }}
        />
        <Area type="monotone" dataKey="revenue" stroke="#7C6AFF" fill="url(#colorRevenue)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Token usage donut:**
```tsx
import { PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#7C6AFF', '#00FF88', '#FFB800'];

<PieChart width={200} height={200}>
  <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
    {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
  </Pie>
  <Tooltip />
</PieChart>
```

**Other chart types:**
- `<LineChart>` - trends over time
- `<BarChart>` - comparisons
- `<RadarChart>` - feature comparison
- `<Treemap>` - hierarchical data

**Chart.js alternative:**
```bash
npm install chart.js react-chartjs-2
```

Build the specific charts requested with the dark theme matching the project's design system.
