'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { Play, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useLiveData } from '@/lib/useLiveData'
import { scenarios } from '@/data/simulator'
import type { SimulatorScenario } from '@/data/types'

export default function SimulatorPage() {
  const { t, lang } = useLang()
  const { mode, chainStats } = useLiveData()
  const isLive = mode === 'live'
  const [activeId,   setActiveId]   = useState<string>(scenarios[0].id)
  const [intensity,  setIntensity]  = useState(1)
  const [running,    setRunning]    = useState(false)
  const [simulated,  setSimulated]  = useState(false)

  const scenario = scenarios.find(s => s.id === activeId)!

  async function runSim() {
    setRunning(true)
    setSimulated(false)
    await new Promise(r => setTimeout(r, 1200))
    setSimulated(true)
    setRunning(false)
  }

  const chartData = scenario.metrics.map(m => ({
    name:   m.label.split(' ').slice(0, 2).join(' '),
    before: m.before,
    after:  simulated ? m.after(intensity) : m.before,
    unit:   m.unit,
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('sim.title')}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t('sim.subtitle')}</p>
        </div>
        {isLive && (
          <div className="flex items-center gap-3 text-[11px] font-semibold">
            <span className="text-slate-400">{lang === 'vi' ? 'Sức khỏe hiện tại:' : 'Current chain health:'}</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full">
              {chainStats.avgHealthScore}/100
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scenario selector + controls */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('sim.select')}</p>
            <div className="space-y-2">
              {scenarios.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveId(s.id); setSimulated(false) }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeId === s.id
                      ? 'bg-primary-700 text-white shadow-sm'
                      : 'hover:bg-gray-50 text-slate-700 border border-gray-100'
                  }`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {lang === 'vi' ? s.titleVi : s.title}
                    </div>
                    <div className={`text-[10px] mt-0.5 truncate ${activeId === s.id ? 'text-primary-200' : 'text-slate-400'}`}>
                      {lang === 'vi' ? s.descVi.slice(0, 50) : s.desc.slice(0, 50)}…
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity slider */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">{t('sim.intensity')}</p>
              <span className="text-sm font-bold text-primary-700">{intensity}×</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.5}
              value={intensity}
              onChange={e => { setIntensity(+e.target.value); setSimulated(false) }}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>0.5×</span><span>1×</span><span>1.5×</span><span>2×</span><span>2.5×</span><span>3×</span>
            </div>
          </div>

          {/* Scenario description */}
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4">
            <div className="text-2xl mb-2">{scenario.icon}</div>
            <h3 className="text-sm font-bold text-slate-800 mb-1.5">
              {lang === 'vi' ? scenario.titleVi : scenario.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {lang === 'vi' ? scenario.descVi : scenario.desc}
            </p>
          </div>

          {/* Run button */}
          <button
            onClick={runSim}
            disabled={running}
            className="w-full flex items-center justify-center gap-2 bg-primary-700 text-white font-bold py-3.5 rounded-2xl hover:bg-primary-600 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('sim.running')}
              </>
            ) : (
              <>
                <Play size={16} />
                {t('sim.run')}
              </>
            )}
          </button>
        </div>

        {/* Right: Charts + results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Before / After bar chart */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">
                {simulated
                  ? `${t('sim.results')}: ${lang === 'vi' ? scenario.titleVi : scenario.title}`
                  : t('sim.noResults')
                }
              </h2>
              {simulated && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
                  {t('sim.simulated')}
                </span>
              )}
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: '12px' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="before" name={t('sim.before')} fill="#e2e8f0" radius={[4,4,0,0]} maxBarSize={40} />
                <Bar dataKey="after"  name={t('sim.after')}  fill="#0F766E" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Impact metrics */}
          <AnimatePresence>
            {simulated && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="font-bold text-slate-800 mb-3">{t('sim.impact')}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {scenario.metrics.map(m => {
                    const after   = m.after(intensity)
                    const delta   = after - m.before
                    const pct     = m.before !== 0 ? Math.round((delta / m.before) * 100) : 0
                    const good    = m.higherIsBetter ? delta >= 0 : delta <= 0
                    const neutral = delta === 0

                    return (
                      <div key={m.label} className="bg-white rounded-2xl border border-gray-100 shadow-card p-4">
                        <p className="text-xs text-slate-400 mb-2">{m.label}</p>
                        <div className="flex items-end gap-3">
                          <div>
                            <div className="text-xs text-slate-400 mb-0.5">{t('sim.before')}</div>
                            <div className="text-lg font-bold text-slate-400">{m.before}{m.unit}</div>
                          </div>
                          <div className="flex-1 flex items-center justify-center pb-1">
                            {neutral ? <Minus size={16} className="text-slate-300" /> :
                              good ? <TrendingUp size={20} className="text-emerald-500" /> :
                                <TrendingDown size={20} className="text-red-500" />
                            }
                          </div>
                          <div>
                            <div className="text-xs text-slate-400 mb-0.5">{t('sim.after')}</div>
                            <div className={`text-lg font-extrabold ${good ? 'text-emerald-600' : neutral ? 'text-slate-600' : 'text-red-500'}`}>
                              {after}{m.unit}
                            </div>
                          </div>
                        </div>
                        <div className={`mt-2 text-xs font-semibold ${good ? 'text-emerald-600' : neutral ? 'text-slate-400' : 'text-red-500'}`}>
                          {delta >= 0 ? '+' : ''}{delta}{m.unit} ({pct >= 0 ? '+' : ''}{pct}%)
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!simulated && !running && (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <div className="text-4xl mb-3">⚡</div>
              <p className="text-sm text-slate-400">
                {t('sim.runToSee')}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
