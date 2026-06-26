'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  positive: number
  neutral:  number
  negative: number
  size?:    number
}

const COLORS = { Positive: '#10b981', Neutral: '#94a3b8', Negative: '#ef4444' }

export default function SentimentDonut({ positive, neutral, negative, size = 220 }: Props) {
  const total = positive + neutral + negative
  const data  = [
    { name: 'Positive', value: positive, pct: Math.round(positive / total * 100) },
    { name: 'Neutral',  value: neutral,  pct: Math.round(neutral  / total * 100) },
    { name: 'Negative', value: negative, pct: Math.round(negative / total * 100) },
  ]

  return (
    <ResponsiveContainer width="100%" height={size}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={size * 0.27}
          outerRadius={size * 0.38}
          paddingAngle={3}
          dataKey="value"
          strokeWidth={0}
        >
          {data.map(d => (
            <Cell key={d.name} fill={COLORS[d.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number, name: string) => [`${v} reviews (${Math.round(v / total * 100)}%)`, name]}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: '12px' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value, entry) => {
            const d = data.find(x => x.name === value)
            return <span style={{ color: '#64748b', fontSize: '12px' }}>{value} ({d?.pct}%)</span>
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
