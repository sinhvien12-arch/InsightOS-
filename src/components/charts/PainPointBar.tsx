'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'

interface DataPoint { key: string; label: string; count: number }

interface Props {
  data:    DataPoint[]
  height?: number
  color?:  string
}

const COLORS = ['#0F766E', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#CCFBF1', '#F0FDFA']

export default function PainPointBar({ data, height = 220, color }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data.slice(0, 7)}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 70, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
        <YAxis
          dataKey="label"
          type="category"
          tick={{ fontSize: 11, fill: '#64748b' }}
          axisLine={false}
          tickLine={false}
          width={70}
        />
        <Tooltip
          formatter={(v: number) => [v + ' reviews', 'Count']}
          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: '12px' }}
        />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
          {data.slice(0, 7).map((_, i) => (
            <Cell key={i} fill={color ?? COLORS[i] ?? '#14B8A6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
