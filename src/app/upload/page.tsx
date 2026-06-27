'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Upload, CheckCircle, AlertCircle, FileText,
  Cpu, ArrowRight, X,
} from 'lucide-react'
import { useLang } from '@/lib/LangContext'
import { useAuth } from '@/lib/AuthContext'
import { processFile, type UploadPhase, type UploadSummary } from '@/lib/uploadOrchestrator'
import { supabaseConfigured } from '@/lib/supabase'

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

const PHASE_LABEL: Record<UploadPhase, { en: string; vi: string }> = {
  parsing:   { en: 'Parsing CSV',          vi: 'Đọc tệp CSV' },
  analyzing: { en: 'Analysing with AI',    vi: 'Phân tích bằng AI' },
  saving:    { en: 'Saving to database',   vi: 'Lưu vào cơ sở dữ liệu' },
  done:      { en: 'Done',                 vi: 'Hoàn tất' },
}

function StatBadge({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
      <div className="text-2xl font-extrabold text-white">{value}</div>
      <div className="text-xs font-semibold text-teal-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-1">{sub}</div>}
    </div>
  )
}

export default function UploadPage() {
  const { lang } = useLang()
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const vi = lang === 'vi'

  const [state,    setState]    = useState<UploadState>('idle')
  const [file,     setFile]     = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [phase,    setPhase]    = useState<UploadPhase>('parsing')
  const [percent,  setPercent]  = useState(0)
  const [summary,  setSummary]  = useState<UploadSummary | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [mode,     setMode]     = useState<'replace' | 'append'>('replace')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const inFlight = useRef(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/')
  }, [user, authLoading, router])

  if (authLoading || !user) return null

  const isValidFile = (f: File) => /\.(csv|xlsx|xls)$/i.test(f.name)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && isValidFile(dropped)) setFile(dropped)
  }

  // Replace is destructive → confirm first. Append runs directly.
  function requestUpload() {
    if (!file || state === 'uploading') return
    if (mode === 'replace' && supabaseConfigured) setConfirmOpen(true)
    else runUpload()
  }

  async function runUpload() {
    setConfirmOpen(false)
    if (!file || inFlight.current) return
    inFlight.current = true
    setState('uploading')
    setErrorMsg('')
    setPercent(0)
    setPhase('parsing')

    try {
      const result = await processFile(file, p => {
        setPhase(p.phase)
        setPercent(p.total ? Math.round((p.done / p.total) * 100) : 0)
      }, mode)
      setSummary(result)
      setState('success')
      // Signal all mounted useLiveData() instances (same tab) and other tabs (storage event)
      try {
        localStorage.setItem('insightos-data-updated', Date.now().toString())
        window.dispatchEvent(new CustomEvent('insightos-data-updated'))
      } catch { /* ignore if storage is blocked */ }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : (vi ? 'Tải lên thất bại.' : 'Upload failed.'))
      setState('error')
    } finally {
      inFlight.current = false
    }
  }

  function reset() {
    setState('idle')
    setFile(null)
    setSummary(null)
    setErrorMsg('')
    setPercent(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-start justify-center pt-12 pb-20 px-4">
      <div className="w-full max-w-lg">

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/30 rounded-full px-4 py-1.5 mb-5">
            <Upload size={12} className="text-teal-400" />
            <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
              {vi ? 'Tải dữ liệu lên' : 'Data Upload'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            {vi ? 'Tải lên Dữ liệu Đánh giá' : 'Upload Review Data'}
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            {vi
              ? 'Tải tệp CSV — AI sẽ phân tích và dựng dashboard trực tiếp'
              : 'Upload a CSV — AI analyses it and builds your live dashboard'}
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait">

            {state === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
                <div
                  onDrop={onDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => inputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
                    ${dragging ? 'border-teal-400 bg-teal-50 scale-[1.01]'
                      : file ? 'border-teal-400 bg-teal-50'
                        : 'border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/40'}`}
                >
                  <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f && isValidFile(f)) setFile(f) }} />

                  {file ? (
                    <>
                      <FileText size={36} className="text-teal-500 mx-auto mb-3" />
                      <p className="font-bold text-slate-800 truncate px-4">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <button onClick={e => { e.stopPropagation(); setFile(null) }}
                        className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-200 text-slate-400">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={36} className="text-slate-300 mx-auto mb-3" />
                      <p className="font-semibold text-slate-600">
                        {vi ? 'Kéo & thả tệp CSV / Excel vào đây' : 'Drag & drop a CSV / Excel file here'}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {vi ? 'hoặc nhấn để chọn tệp (.csv, .xlsx)' : 'or click to browse · .csv, .xlsx'}
                      </p>
                    </>
                  )}
                </div>

                <div className="mt-5 bg-slate-50 rounded-xl p-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {vi ? 'Cột yêu cầu (CSV / Excel)' : 'Required columns (CSV / Excel)'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['branch_name', 'review_text'].map(c => (
                      <code key={c} className="text-[11px] bg-white border border-slate-200 text-teal-700 font-mono px-2 py-0.5 rounded-lg">{c}</code>
                    ))}
                    {['date', 'platform', 'rating', 'author_name'].map(c => (
                      <code key={c} className="text-[11px] bg-white border border-slate-200 text-slate-400 font-mono px-2 py-0.5 rounded-lg">
                        {c} <span className="text-slate-300">(opt)</span>
                      </code>
                    ))}
                  </div>
                </div>

                {!supabaseConfigured && (
                  <div className="mt-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-700">
                      {vi
                        ? 'Supabase chưa cấu hình — kết quả sẽ hiển thị nhưng không được lưu.'
                        : 'Supabase not configured — results will show but won’t be saved.'}
                    </p>
                  </div>
                )}

                {/* Replace / Append mode */}
                {supabaseConfigured && (
                  <div className="mt-5">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      {vi ? 'Chế độ' : 'Mode'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {([
                        { id: 'replace', en: 'Replace all', vi: 'Thay toàn bộ', subEn: 'wipe old data', subVi: 'xóa dữ liệu cũ' },
                        { id: 'append',  en: 'Append',      vi: 'Thêm vào',     subEn: 'keep old data', subVi: 'giữ dữ liệu cũ' },
                      ] as const).map(o => (
                        <button key={o.id} type="button" onClick={() => setMode(o.id)}
                          className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                            mode === o.id ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white hover:border-teal-200'}`}>
                          <div className={`text-xs font-bold ${mode === o.id ? 'text-teal-700' : 'text-slate-700'}`}>{vi ? o.vi : o.en}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{vi ? o.subVi : o.subEn}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button disabled={!file} onClick={requestUpload}
                  className={`mt-5 w-full py-3.5 rounded-2xl font-bold text-sm transition-all
                    ${file ? 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/20 hover:scale-[1.01]'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                  {vi ? 'Tải lên & Phân tích' : 'Upload & Analyse'}
                </button>
              </motion.div>
            )}

            {state === 'uploading' && (
              <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-900 p-8">
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mx-auto mb-4">
                    <Cpu size={24} className="text-teal-400 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-bold text-white">
                    {vi ? PHASE_LABEL[phase].vi : PHASE_LABEL[phase].en}…
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">{file?.name}</p>
                </div>

                <div className="h-1.5 bg-slate-700 rounded-full mb-3 overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full"
                    animate={{ width: `${percent}%` }} transition={{ duration: 0.4 }} />
                </div>
                <p className="text-center text-xs text-slate-400">{percent}%</p>
              </motion.div>
            )}

            {state === 'success' && summary && (
              <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-900 p-8">
                <div className="text-center mb-8">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}
                    className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-400/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={28} className="text-teal-400" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-white">
                    {vi ? 'Phân tích hoàn tất!' : 'Analysis complete!'}
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">
                    {summary.saved
                      ? (vi ? 'Đã lưu vào Supabase' : 'Saved to Supabase')
                      : (vi ? 'Chưa lưu (Supabase chưa cấu hình)' : 'Not saved (Supabase not configured)')}
                  </p>
                </div>

                {summary.dedupedCount > 0 && (
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
                    <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      {vi
                        ? `File có ${summary.dedupedCount} dòng trùng lặp (cùng chi nhánh + ngày + nội dung) — đã giữ lại dòng đầu tiên, bỏ ${summary.dedupedCount} dòng còn lại.`
                        : `File contained ${summary.dedupedCount} duplicate row${summary.dedupedCount > 1 ? 's' : ''} (same branch + date + text) — kept the first occurrence, removed ${summary.dedupedCount > 1 ? 'the rest' : 'it'}.`}
                    </p>
                  </div>
                )}

                {summary.failedChunks > 0 && (
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-3">
                    <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] text-amber-300">
                      {vi
                        ? `${summary.failedChunks}/${summary.totalChunks} lô AI thất bại — các đánh giá đó tạm xếp "trung tính". Kiểm tra OPENAI_API_KEY và thử lại.`
                        : `${summary.failedChunks}/${summary.totalChunks} AI batches failed — those reviews defaulted to "neutral". Check OPENAI_API_KEY and retry.`}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <StatBadge value={summary.totalReviews.toLocaleString()} label={vi ? 'Đánh giá' : 'Reviews'} sub={vi ? 'đã xử lý' : 'processed'} />
                  <StatBadge value={summary.branches} label={vi ? 'Chi nhánh' : 'Branches'} sub={vi ? 'phát hiện' : 'detected'} />
                  <StatBadge value={`${summary.positivePct}%`} label={vi ? 'Tích cực' : 'Positive'} sub={vi ? 'cảm xúc' : 'sentiment'} />
                  <StatBadge value={summary.avgHealthScore} label={vi ? 'Sức khỏe TB' : 'Avg Health'} sub="/100" />
                </div>

                <div className="text-center">
                  <button onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm px-6 py-3 rounded-2xl transition-all hover:scale-[1.02]">
                    {vi ? 'Mở Dashboard' : 'Open Dashboard'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">
                <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
                <h2 className="text-lg font-bold text-slate-800 mb-2">{vi ? 'Tải lên thất bại' : 'Upload failed'}</h2>
                <p className="text-sm text-slate-500 mb-6 break-words">{errorMsg}</p>
                <button onClick={reset} className="bg-slate-900 text-white font-bold text-sm px-6 py-3 rounded-2xl hover:bg-slate-700 transition-colors">
                  {vi ? 'Thử lại' : 'Try again'}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center text-[11px] text-slate-500 mt-6">
          {vi
            ? 'Dữ liệu lưu an toàn trên Supabase, chỉ hiển thị trong tổ chức của bạn.'
            : 'Data is stored securely in Supabase and visible only within your organisation.'}
        </motion.p>
      </div>

      {/* Confirm modal for destructive replace */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{vi ? 'Thay toàn bộ dữ liệu?' : 'Replace all data?'}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {vi
                    ? 'Toàn bộ đánh giá & chỉ số hiện có sẽ bị xóa và thay bằng file này. Không thể hoàn tác.'
                    : 'All existing reviews & metrics will be deleted and replaced by this file. This cannot be undone.'}
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-gray-100 transition-colors">
                {vi ? 'Hủy' : 'Cancel'}
              </button>
              <button onClick={runUpload}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                {vi ? 'Xóa & thay' : 'Delete & replace'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
