import { useState, useEffect, useRef, useCallback, Component } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CATEGORIES as DEFAULT_CATEGORIES } from '../data/estimatorConfig'
import { INCLUSIONS as DEFAULT_INCLUSIONS } from '../data/inclusionsData'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// ─── Error Boundary ────────────────────────────────────────────────
class EstimatorErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(err, info) {
    console.error('Estimator error:', err, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-dvh bg-[#0a0a0a] items-center justify-center text-white p-6">
          <div className="text-center max-w-md">
            <div className="w-12 h-12 bg-amber-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-sm">NPI</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-white/50 text-sm mb-6">Your data has been saved locally. Try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-amber-500 text-white text-sm font-semibold uppercase tracking-wider hover:bg-amber-400 transition-colors"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('npi-estimator-data')
                localStorage.removeItem('npi-estimator-config')
                localStorage.removeItem('npi-inclusions-config')
                window.location.reload()
              }}
              className="px-6 py-2.5 border border-white/20 text-white/60 text-sm font-semibold uppercase tracking-wider hover:bg-white/5 transition-colors mt-3"
            >
              Clear Data &amp; Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Constants ──────────────────────────────────────────────────────
const STORAGE_KEY = 'npi-estimator-data'
const CONFIG_KEY = 'npi-estimator-config'
const INCLUSIONS_KEY = 'npi-inclusions-config'

let categoriesLoaded = false
let CATEGORIES = [...DEFAULT_CATEGORIES]
let INCLUSIONS = [...DEFAULT_INCLUSIONS]

function getInclusionsStep() { return CATEGORIES.length }
function getReviewStep() { return CATEGORIES.length + 1 }

function isInclusionsData(config) {
  return Array.isArray(config) && config[0]?.id === 'general' && config[0]?.title?.includes('Inclusions')
}

function loadCategoriesFromLocal() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const config = Array.isArray(parsed) ? parsed : (parsed?.steps || null)
      if (config && isInclusionsData(config)) {
        localStorage.removeItem(CONFIG_KEY)
        return null
      }
      return config
    }
  } catch {}
  return null
}

function loadInclusionsFromLocal() {
  try {
    const stored = localStorage.getItem(INCLUSIONS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

// Try local first, then fetch from server
async function loadCategoriesFromServer() {
  try {
    const res = await fetch('/api/config')
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.config) {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(data.config))
      return data.config
    }
  } catch {}
  return null
}

async function loadInclusionsFromServer() {
  try {
    const res = await fetch('/api/inclusions')
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.config) {
      localStorage.setItem(INCLUSIONS_KEY, JSON.stringify(data.config))
      return data.config
    }
  } catch {}
  return null
}

// Init from localStorage synchronously
const localConfig = loadCategoriesFromLocal()
if (localConfig) CATEGORIES = localConfig
const localInclusions = loadInclusionsFromLocal()
if (localInclusions) INCLUSIONS = localInclusions
// Step constants computed dynamically via getInclusionsStep() / getReviewStep()

// ─── Icons (inline SVG components) ─────────────────────────────────
const icons = {
  user: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  ),
  building: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
    </svg>
  ),
  door: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
    </svg>
  ),
  window: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  ),
  kitchen: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    </svg>
  ),
  bath: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
    </svg>
  ),
  laundry: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.893 13.393-1.135-1.135a2.252 2.252 0 0 1-.421-.585l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.212.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.655-.261a2.25 2.25 0 0 1-1.383-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18a.94.94 0 0 0-.662.274.931.931 0 0 1-1.458-1.137l1.411-2.353a2.25 2.25 0 0 0 .286-.76m11.928 9.869A9 9 0 0 0 8.965 3.525m11.928 9.868A9 9 0 1 1 8.965 3.525" />
    </svg>
  ),
  closet: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3" />
    </svg>
  ),
  paint: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
    </svg>
  ),
  floor: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
    </svg>
  ),
  thermometer: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
    </svg>
  ),
  zap: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
    </svg>
  ),
  home: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  truck: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  leaf: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  ),
  clipboard: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  arrowLeft: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </svg>
  ),
  download: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  ),
  save: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
}

function getIcon(name) {
  return icons[name] || icons.note
}

// ─── Slide animation variants ───────────────────────────────────────
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

// ─── Choice Card sub-component ──────────────────────────────────────
function ChoiceCard({ item, categoryId, formData, setFormData, editMode, onUpdateItem, onDeleteItem }) {
  const key = `${categoryId}.${item.id}`
  const writeInKey = `${categoryId}.${item.id}_writeIn`
  const selected = formData[key] || ''
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')

  const handleSelect = (val) => {
    if (editMode) return
    if (selected === val) {
      setFormData(prev => {
        const next = { ...prev }
        delete next[key]
        delete next[writeInKey]
        return next
      })
    } else {
      setFormData(prev => ({ ...prev, [key]: val }))
    }
  }

  const startEdit = (field, value) => {
    setEditingField(field)
    setEditValue(value)
  }

  const finishEdit = () => {
    if (editValue.trim() && onUpdateItem) {
      onUpdateItem(categoryId, item.id, { [editingField]: editValue.trim() })
    }
    setEditingField(null)
  }

  return (
    <div className={`space-y-3 ${editMode ? 'relative border border-dashed border-amber/20 p-4 -mx-1' : ''}`}>
      <div className="flex items-center justify-between">
        {editMode ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {editingField === 'label' ? (
              <div className="flex gap-2 flex-1">
                <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && finishEdit()} autoFocus className="flex-1 px-2 py-1 bg-black/40 border border-amber/40 text-white text-sm outline-none" />
                <button onClick={finishEdit} className="px-2 py-1 bg-amber text-white text-xs font-bold">OK</button>
              </div>
            ) : (
              <button onClick={() => startEdit('label', item.label)} className="text-sm font-medium text-white/70 hover:text-amber truncate text-left">
                {item.label}
                <svg className="w-3 h-3 inline ml-1.5 text-amber/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
              </button>
            )}
          </div>
        ) : (
          <label className="block text-sm font-medium text-white/70">{item.label}</label>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {editMode && onDeleteItem && (
            <button onClick={() => onDeleteItem(categoryId, item.id)} className="text-[10px] font-medium uppercase tracking-wider text-red-400/60 hover:text-red-400 transition-colors px-2 py-0.5 border border-red-400/20 hover:border-red-400/40">
              Delete
            </button>
          )}
          {!editMode && selected && (
            <button type="button" onClick={() => handleSelect(selected)} className="text-[10px] font-medium uppercase tracking-wider text-white/30 hover:text-red-400 transition-colors px-2 py-0.5 border border-white/10 hover:border-red-400/40">
              N/A
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Standard card */}
        <button
          type="button"
          onClick={() => handleSelect('std')}
          className={`relative p-4 text-left transition-all duration-200 border ${
            editMode
              ? 'border-dashed border-emerald-500/30 bg-emerald-500/[0.02]'
              : selected === 'std'
                ? 'border-emerald-500/60 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                : 'border-white/10 bg-void-lighter hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              selected === 'std' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
            }`}>
              Standard
            </span>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
              selected === 'std' ? 'border-emerald-500 bg-emerald-500' : 'border-white/20'
            }`}>
              {selected === 'std' && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </div>
          </div>
          {editMode && editingField === 'standard' ? (
            <div className="flex gap-2">
              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && finishEdit()} autoFocus className="flex-1 px-2 py-1 bg-black/40 border border-emerald-500/40 text-white text-sm outline-none" />
              <button onClick={finishEdit} className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold">OK</button>
            </div>
          ) : (
            <p onClick={editMode ? () => startEdit('standard', item.standard) : undefined} className={`text-sm leading-relaxed ${editMode ? 'cursor-pointer hover:text-amber' : ''} ${selected === 'std' ? 'text-white' : 'text-white/60'}`}>
              {item.standardLabel || item.standard}
              {editMode && <svg className="w-3 h-3 inline ml-1 text-amber/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>}
            </p>
          )}
        </button>

        {/* Upgrade card */}
        <button
          type="button"
          onClick={() => handleSelect('upg')}
          className={`relative p-4 text-left transition-all duration-200 border ${
            editMode
              ? 'border-dashed border-amber/30 bg-amber/[0.02]'
              : selected === 'upg'
                ? 'border-amber/60 bg-amber/5 shadow-lg shadow-amber/5'
                : 'border-white/10 bg-void-lighter hover:border-white/20'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              !editMode && selected === 'upg' ? 'bg-amber/20 text-amber' : 'bg-white/5 text-white/40'
            }`}>
              {item.upgradeLabel || 'Upgrade'}
            </span>
            {!editMode && (
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                selected === 'upg' ? 'border-amber bg-amber' : 'border-white/20'
              }`}>
                {selected === 'upg' && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </div>
            )}
          </div>
          {editMode && editingField === 'upgrade' ? (
            <div className="flex gap-2">
              <input type="text" value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && finishEdit()} autoFocus className="flex-1 px-2 py-1 bg-black/40 border border-amber/40 text-white text-sm outline-none" />
              <button onClick={finishEdit} className="px-2 py-1 bg-amber text-white text-xs font-bold">OK</button>
            </div>
          ) : (
            <p onClick={editMode ? () => startEdit('upgrade', item.upgrade) : undefined} className={`text-sm leading-relaxed ${editMode ? 'cursor-pointer hover:text-amber' : ''} ${selected === 'upg' ? 'text-white' : 'text-white/60'}`}>
              {item.upgrade}
              {editMode && <svg className="w-3 h-3 inline ml-1 text-amber/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>}
            </p>
          )}
        </button>
      </div>

      {/* Write-in input */}
      {item.hasWriteIn && selected === 'upg' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-2"
        >
          <input
            type="text"
            value={formData[writeInKey] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [writeInKey]: e.target.value }))}
            placeholder={item.writeInLabel}
            className="w-full px-4 py-2.5 bg-void border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-amber transition-colors"
          />
        </motion.div>
      )}
    </div>
  )
}

// ─── Options Card sub-component (multi-option selector) ─────────────
function OptionsCard({ item, categoryId, formData, setFormData, editMode, onAddOption, onDeleteOption, onUpdateOption }) {
  const key = `${categoryId}.${item.id}`
  const selected = formData[key] || ''
  const [editingOpt, setEditingOpt] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const options = item.options || []

  const selectedArr = item.multiSelect ? selected.split(',').filter(Boolean) : []

  const handleSelect = (optId) => {
    if (editMode) return
    if (item.multiSelect) {
      const has = selectedArr.includes(optId)
      const next = has ? selectedArr.filter(id => id !== optId) : [...selectedArr, optId]
      setFormData(prev => {
        if (next.length === 0) {
          const n = { ...prev }
          delete n[key]
          return n
        }
        return { ...prev, [key]: next.join(',') }
      })
    } else {
      if (selected === optId) {
        setFormData(prev => {
          const next = { ...prev }
          delete next[key]
          return next
        })
      } else {
        setFormData(prev => ({ ...prev, [key]: optId }))
      }
    }
  }

  const startEdit = (opt) => {
    setEditingOpt(opt.id)
    setEditLabel(opt.label)
  }

  const finishEdit = (optId) => {
    if (editLabel.trim() && onUpdateOption) {
      onUpdateOption(categoryId, item.id, optId, editLabel.trim())
    }
    setEditingOpt(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-white/70">{item.label}</label>
        {!editMode && selected && (
          <button
            type="button"
            onClick={() => {
              if (item.multiSelect) {
                setFormData(prev => { const n = { ...prev }; delete n[key]; return n })
              } else {
                handleSelect(selected)
              }
            }}
            className="text-[10px] font-medium uppercase tracking-wider text-white/30 hover:text-red-400 transition-colors px-2 py-0.5 border border-white/10 hover:border-red-400/40"
          >
            N/A
          </button>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-3 ${
        options.length === 2 ? 'sm:grid-cols-2' : options.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
      }`}>
        {options.map((opt) => {
          const isSelected = item.multiSelect ? selectedArr.includes(opt.id) : selected === opt.id
          const isEditing = editingOpt === opt.id

          return (
            <div
              key={opt.id}
              className={`relative p-4 text-left transition-all duration-200 border ${
                editMode
                  ? 'border-dashed border-amber/30 bg-amber/[0.02]'
                  : isSelected
                    ? 'border-amber/60 bg-amber/5 shadow-lg shadow-amber/5'
                    : 'border-white/10 bg-void-lighter hover:border-white/20'
              }`}
            >
              {!editMode && (
                <button
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  className="absolute inset-0"
                />
              )}
              <div className="relative pointer-events-none">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    !editMode && isSelected ? 'bg-amber/20 text-amber' : 'bg-white/5 text-white/40'
                  }`}>
                    {opt.tag || opt.label}
                  </span>
                  {editMode ? (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(opt)} className="p-1 text-amber/60 hover:text-amber" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                      </button>
                      <button onClick={() => onDeleteOption?.(categoryId, item.id, opt.id)} className="p-1 text-red-400/60 hover:text-red-400" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-amber bg-amber' : 'border-white/20'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && finishEdit(opt.id)}
                      autoFocus
                      className="flex-1 px-2 py-1 bg-black/40 border border-amber/40 text-white text-sm outline-none"
                    />
                    <button onClick={() => finishEdit(opt.id)} className="px-2 py-1 bg-amber text-white text-xs font-bold">OK</button>
                  </div>
                ) : (
                  <p className={`text-sm leading-relaxed ${!editMode && isSelected ? 'text-white' : 'text-white/60'}`}>
                    {opt.label}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Write-in input for options */}
      {item.hasWriteIn && !editMode && selected && (!item.writeInFor || item.writeInFor.includes(selected)) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <input
            type="text"
            value={formData[`${key}_writeIn`] || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [`${key}_writeIn`]: e.target.value }))}
            placeholder={item.writeInLabel || 'Specify details...'}
            className="w-full px-4 py-3 bg-void-lighter border border-white/10 text-white text-sm outline-none placeholder:text-white/20 focus:border-amber/40 transition-colors"
          />
        </motion.div>
      )}

      {/* Add option button in edit mode */}
      {editMode && (
        <button
          type="button"
          onClick={() => onAddOption?.(categoryId, item.id)}
          className="w-full py-3 border border-dashed border-amber/20 text-amber/40 hover:text-amber hover:border-amber/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Option
        </button>
      )}
    </div>
  )
}

// ─── Text Input sub-component ───────────────────────────────────────
function TextInput({ item, categoryId, formData, setFormData }) {
  const key = `${categoryId}.${item.id}`
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-2">
        {item.label}
        {item.required && <span className="text-amber ml-1">*</span>}
      </label>
      <input
        type={item.type === 'date' ? 'date' : 'text'}
        value={formData[key] || ''}
        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={item.placeholder || ''}
        className="w-full px-4 py-2.5 bg-void border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-amber transition-colors"
      />
    </div>
  )
}

// ─── Textarea sub-component ─────────────────────────────────────────
function TextareaInput({ item, categoryId, formData, setFormData }) {
  const key = `${categoryId}.${item.id}`
  const value = formData[key] !== undefined ? formData[key] : (item.defaultValue || '')
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-1">{item.label}</label>
      {item.helperText && (
        <p className="text-xs text-amber/70 mb-2 italic">{item.helperText}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
        placeholder={item.placeholder || ''}
        rows={5}
        className="w-full px-4 py-3 bg-void border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-amber transition-colors resize-none"
      />
    </div>
  )
}

// ─── Currency Input sub-component ───────────────────────────────────
function CurrencyInput({ item, categoryId, formData, setFormData }) {
  const key = `${categoryId}.${item.id}`
  const raw = formData[key] || ''
  const formatDisplay = (val) => {
    const num = parseFloat(val)
    if (isNaN(num)) return ''
    return num.toLocaleString('en-AU')
  }
  return (
    <div>
      <label className="block text-sm font-medium text-white/70 mb-2">{item.label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
        <input
          type="text"
          inputMode="numeric"
          value={raw}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, '')
            setFormData(prev => ({ ...prev, [key]: v }))
          }}
          placeholder={item.placeholder || ''}
          className="w-full pl-8 pr-4 py-2.5 bg-void border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-amber transition-colors"
        />
      </div>
      {raw && !isNaN(parseFloat(raw)) && (
        <p className="mt-1 text-xs text-white/40">${formatDisplay(raw)}</p>
      )}
    </div>
  )
}

// ─── Pricing Total sub-component ────────────────────────────────────
function PricingTotal({ formData }) {
  const fields = ['dwellingOnePrice', 'dwellingTwoPrice', 'siteWorksPrice', 'demolitionPrice', 'upgradesPrice', 'otherPrice']
  const isDual = formData['pricing.dwellingTwoEnabled'] === 'upg'
  const gstIncluded = formData['pricing.gstIncluded'] === 'upg'

  const getVal = (id) => parseFloat(formData[`pricing.${id}`]) || 0
  const d1 = getVal('dwellingOnePrice')
  const d2 = isDual ? getVal('dwellingTwoPrice') : 0
  const site = getVal('siteWorksPrice')
  const demo = getVal('demolitionPrice')
  const upgrades = getVal('upgradesPrice')
  const other = getVal('otherPrice')
  const subtotal = d1 + d2 + site + demo + upgrades + other
  const gst = gstIncluded ? 0 : subtotal * 0.1
  const total = subtotal + gst

  const fmt = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  if (subtotal === 0) return null

  return (
    <div className="mt-6 bg-void-light border border-white/10 p-5 space-y-2">
      <h3 className="text-sm font-semibold text-amber uppercase tracking-wider mb-3">Price Summary</h3>
      {d1 > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Dwelling One{formData['pricing.dwellingOneLandSize'] ? ` (${formData['pricing.dwellingOneLandSize']}m\u00B2)` : ''}</span><span className="text-white">{fmt(d1)}</span></div>}
      {isDual && d2 > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Dwelling Two{formData['pricing.dwellingTwoLandSize'] ? ` (${formData['pricing.dwellingTwoLandSize']}m\u00B2)` : ''}</span><span className="text-white">{fmt(d2)}</span></div>}
      {site > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Site Works</span><span className="text-white">{fmt(site)}</span></div>}
      {demo > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Demolition</span><span className="text-white">{fmt(demo)}</span></div>}
      {upgrades > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">Upgrades / Extras</span><span className="text-white">{fmt(upgrades)}</span></div>}
      {other > 0 && <div className="flex justify-between text-sm"><span className="text-white/60">{formData['pricing.otherLabel'] || 'Other'}</span><span className="text-white">{fmt(other)}</span></div>}
      <div className="border-t border-white/10 pt-2 mt-2">
        {!gstIncluded && <>
          <div className="flex justify-between text-sm"><span className="text-white/60">Subtotal</span><span className="text-white">{fmt(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-white/60">GST (10%)</span><span className="text-white">{fmt(gst)}</span></div>
        </>}
        <div className="flex justify-between text-base font-bold mt-1"><span className="text-amber">Total {gstIncluded ? '(incl. GST)' : '(excl. GST + GST)'}</span><span className="text-amber">{fmt(total)}</span></div>
      </div>
    </div>
  )
}

// ─── Floor Plan Upload sub-component ────────────────────────────────
function FloorPlanUpload({ draftId, formData, setFormData }) {
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Load existing files
  useEffect(() => {
    if (!draftId) return
    fetch(`/api/floor-plans?draftId=${draftId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFiles(data) })
      .catch(() => {})
  }, [draftId])

  const handleUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0 || !draftId) return

    setUploading(true)
    for (const file of selectedFiles) {
      try {
        const reader = new FileReader()
        const base64 = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.readAsDataURL(file)
        })

        const res = await fetch('/api/floor-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftId,
            fileName: file.name,
            fileData: base64,
            contentType: file.type,
          }),
        })
        const data = await res.json()
        if (data.url) {
          setFiles(prev => [...prev, { name: file.name, path: data.path, url: data.url }])
        }
      } catch (err) {
        console.error('Upload error:', err)
      }
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (path, idx) => {
    try {
      await fetch('/api/floor-plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      setFiles(prev => prev.filter((_, i) => i !== idx))
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  if (!draftId) {
    return (
      <div className="mt-4 p-4 border border-white/10 bg-void-light">
        <p className="text-sm text-white/50">Save the quote first to enable floor plan uploads.</p>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-medium text-white/70 mb-2">Floor Plans / Building Plans</label>
      <div className="border border-dashed border-white/20 p-4 bg-void-light hover:border-amber/40 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleUpload}
          className="hidden"
          id="floor-plan-upload"
        />
        <label
          htmlFor="floor-plan-upload"
          className="flex flex-col items-center justify-center cursor-pointer py-4"
        >
          <svg className="w-8 h-8 text-white/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
          <span className="text-sm text-white/40">
            {uploading ? 'Uploading...' : 'Click to upload floor plans (JPG, PNG, PDF)'}
          </span>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {files.map((file, idx) => (
            <div key={idx} className="relative group border border-white/10 bg-void overflow-hidden">
              {file.url?.endsWith('.pdf') ? (
                <div className="h-32 flex items-center justify-center bg-void-light">
                  <span className="text-white/50 text-sm">PDF: {file.name}</span>
                </div>
              ) : (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-32 object-cover"
                />
              )}
              <div className="p-2 flex items-center justify-between">
                <span className="text-xs text-white/50 truncate flex-1">{file.name}</span>
                <button
                  onClick={() => handleDelete(file.path, idx)}
                  className="text-red-400/60 hover:text-red-400 text-xs ml-2 shrink-0"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mobile sidebar menu ────────────────────────────────────────────
function MobileMenu({ currentStep, setCurrentStep, completedSteps, formData, isOpen, setIsOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 w-72 bg-void-light border-r border-white/5 z-50 overflow-y-auto lg:hidden"
          >
            <SidebarContent
              currentStep={currentStep}
              setCurrentStep={(step) => { setCurrentStep(step); setIsOpen(false) }}
              completedSteps={completedSteps}
              formData={formData}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── Sidebar content (shared between desktop sidebar and mobile menu) ──
function SidebarContent({ currentStep, setCurrentStep, completedSteps }) {
  const progress = Math.round((completedSteps.size / CATEGORIES.length) * 100)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-3 mb-4 group">
          <div className="w-10 h-10 bg-amber flex items-center justify-center">
            <span className="text-white font-bold text-sm tracking-wider">NPI</span>
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-wider uppercase block leading-tight">
              Nationwide
            </span>
            <span className="text-amber text-[10px] font-medium tracking-[0.2em] uppercase">
              Projects & Investments
            </span>
          </div>
        </Link>
        <h2 className="font-display text-lg text-white/90">New Home Estimate Builder</h2>
      </div>

      {/* Step list */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="space-y-0.5 px-3">
          {CATEGORIES.map((cat, i) => {
            const isActive = i === currentStep
            const isCompleted = completedSteps.has(i)
            const btn = (
              <button
                key={cat.id}
                onClick={() => setCurrentStep(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-all duration-200 relative group ${
                  isActive
                    ? 'text-amber bg-amber/5'
                    : isCompleted
                    ? 'text-white/40 hover:text-white/60'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Step icon */}
                <span className={`shrink-0 ${isActive ? 'text-amber' : isCompleted ? 'text-emerald-500/50' : 'text-white/30'}`}>
                  {isCompleted && !isActive ? icons.check : getIcon(cat.icon)}
                </span>

                {/* Step label */}
                <span className="truncate">{cat.title}</span>

                {/* Step number */}
                <span className={`ml-auto text-[10px] font-mono shrink-0 ${
                  isActive ? 'text-amber/60' : 'text-white/20'
                }`}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </button>
            )

            return btn
          })}

          {/* Review step */}
          <button
            onClick={() => setCurrentStep(getReviewStep())}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-all duration-200 relative ${
              currentStep === getReviewStep()
                ? 'text-amber bg-amber/5'
                : 'text-white/50 hover:text-white/70'
            }`}
          >
            {currentStep === getReviewStep() && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            <span className={currentStep === getReviewStep() ? 'text-amber' : 'text-white/30'}>{icons.clipboard}</span>
            <span>Review & Export</span>
          </button>
        </nav>
      </div>

      {/* Progress bar */}
      <div className="p-6 border-t border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Progress</span>
          <span className="text-[10px] font-mono text-amber">{progress}%</span>
        </div>
        <div className="h-1 bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-amber"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Review Section sub-component ───────────────────────────────────
function isItemIncluded(item, value) {
  if (!value) return false
  // Filter out "Not included" standard selections
  if (item.type === 'choice' && value === 'std') {
    const stdText = (item.standardLabel || item.standard || '').toLowerCase()
    if (stdText.startsWith('not included')) return false
  }
  // Filter out "none" options selections
  if (item.type === 'options' && value === 'none') return false
  // Currency fields handled separately in pricing summary
  if (item.type === 'currency') return false
  return true
}

function getOptionsLabel(item, value) {
  if (!item.options) return value
  if (item.multiSelect && value.includes(',')) {
    return value.split(',').map(v => {
      const opt = item.options.find(o => o.id === v)
      return opt ? opt.label : v
    }).join(', ')
  }
  const opt = item.options.find(o => o.id === value)
  return opt ? opt.label : value
}

function ReviewSection({ category, formData }) {
  const visibleItems = category.items.filter(item => {
    const key = `${category.id}.${item.id}`
    return isItemIncluded(item, formData[key])
  })

  if (visibleItems.length === 0) return null

  return (
    <div className="mb-8">
      <h3 className="font-display text-lg text-amber mb-4 flex items-center gap-2">
        <span className="text-amber/60">{getIcon(category.icon)}</span>
        {category.title}
      </h3>
      <div className="border border-white/10 overflow-hidden">
        <table className="w-full">
          <tbody>
            {visibleItems.map((item) => {
              const key = `${category.id}.${item.id}`
              const value = formData[key]
              const writeIn = formData[`${category.id}.${item.id}_writeIn`]

              let displayValue = value
              let badge = null
              if (item.type === 'choice') {
                const isUpgrade = value === 'upg'
                if (value === 'std') {
                  displayValue = item.standardLabel || item.standard
                } else if (value === 'upg') {
                  displayValue = item.upgrade
                  if (writeIn) displayValue += ` - ${writeIn}`
                }
                badge = (
                  <span className={`inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    isUpgrade ? 'bg-amber/15 text-amber' : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {isUpgrade ? 'UPG' : 'STD'}
                  </span>
                )
              } else if (item.type === 'options') {
                displayValue = getOptionsLabel(item, value)
                badge = (
                  <span className="inline-flex px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber/15 text-amber">
                    {getOptionsLabel(item, value).toUpperCase()}
                  </span>
                )
              }

              return (
                <tr key={item.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3 text-sm text-white/60 w-1/3">{item.label}</td>
                  <td className="px-4 py-3 text-sm text-white">
                    <div className="flex items-center gap-2">
                      {badge}
                      {displayValue}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── PDF Content (hidden, for capture) ──────────────────────────────
function PDFContent({ formData, draftId }) {
  const [floorPlans, setFloorPlans] = useState([])
  useEffect(() => {
    if (!draftId) return
    fetch(`/api/floor-plans?draftId=${draftId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setFloorPlans(data.filter(f => !f.url?.endsWith('.pdf'))) })
      .catch(() => {})
  }, [draftId])

  const clientName = formData['client.clientName'] || 'Client'
  const email = formData['client.email'] || ''
  const mobile = formData['client.mobile'] || ''
  const siteAddress = formData['client.siteAddress'] || ''
  const quoteStage = formData['client.quoteStage'] || ''
  const validUntil = formData['client.validUntil'] || ''
  const salesExec = formData['client.salesExec'] || ''
  const execMobile = formData['client.execMobile'] || ''
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div
      id="pdf-content"
      style={{
        width: '794px',
        fontFamily: 'Inter, Arial, sans-serif',
        background: '#FFFFFF',
        color: '#1a1a2e',
        padding: '0',
        position: 'absolute',
        left: '-9999px',
        top: '0',
        pointerEvents: 'none',
      }}
    >
      {/* Cover Page */}
      <div style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
        color: '#fff',
        padding: '60px 50px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Gold accent line */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#E8850C' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '48px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#E8850C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px',
              letterSpacing: '0.1em',
              color: '#fff',
            }}>
              NPI
            </div>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                Nationwide
              </div>
              <div style={{ color: '#E8850C', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                Projects & Investments
              </div>
            </div>
          </div>

          <h1 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '36px',
            fontWeight: '400',
            marginBottom: '8px',
            lineHeight: '1.2',
          }}>
            New Home Estimate
          </h1>
          <div style={{ width: '60px', height: '2px', background: '#E8850C' }} />
        </div>

        <div style={{ marginTop: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Client', clientName],
                ['Email', email],
                ['Mobile', mobile],
                ['Site Address', siteAddress],
                ['Quote Stage', quoteStage],
                ['Valid Until', validUntil],
                ['Sales Executive', salesExec],
                ['Executive Mobile', execMobile],
                ['Date Prepared', today],
              ].filter(([, v]) => v).map(([label, value]) => (
                <tr key={label}>
                  <td style={{
                    padding: '6px 0',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    width: '140px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}>
                    {label}
                  </td>
                  <td style={{
                    padding: '6px 0',
                    fontSize: '13px',
                    color: '#fff',
                  }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section A: Base Inclusions */}
      <div style={{
        padding: '24px 50px',
        background: '#f8f8fa',
        borderBottom: '1px solid #e5e5e5',
      }}>
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '20px',
          color: '#1a1a2e',
          marginBottom: '4px',
        }}>
          Section A — Inclusion Schedule
        </h2>
        <p style={{ fontSize: '11px', color: '#888' }}>Inclusions to do for your new home build</p>
      </div>

      {INCLUSIONS.map((section) => (
        <div key={section.id} data-pdf-section style={{ padding: '20px 50px', borderBottom: '1px solid #e5e5e5' }}>
          <h3 style={{
            fontFamily: 'Playfair Display, Georgia, serif',
            fontSize: '14px',
            color: '#1a1a2e',
            marginBottom: '10px',
            paddingBottom: '4px',
            borderBottom: '2px solid #22c55e',
            display: 'inline-block',
          }}>
            {section.title}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '4px 0', width: '20px', verticalAlign: 'top' }}>
                    <span style={{ color: '#22c55e', fontSize: '12px' }}>{'\u2713'}</span>
                  </td>
                  <td style={{ padding: '4px 0', color: '#444' }}>{item}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {section.notes && section.notes.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fff8f0', border: '1px solid #fde8cc' }}>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#E8850C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
              {section.notes.map((note, i) => (
                <div key={i} style={{ fontSize: '9px', color: '#888', lineHeight: '1.4', paddingLeft: '10px', position: 'relative', marginBottom: '2px' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#E8850C' }}>{'\u2022'}</span>
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Section B header */}
      <div style={{
        padding: '24px 50px',
        background: '#f8f8fa',
        borderBottom: '1px solid #e5e5e5',
      }}>
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '20px',
          color: '#1a1a2e',
          marginBottom: '4px',
        }}>
          Section B — According to Plan or Client Upgrades
        </h2>
        <p style={{ fontSize: '11px', color: '#888' }}>Client's selected upgrades and specifications</p>
      </div>

      {/* Selection sections */}
      {CATEGORIES.filter(cat => cat.id !== 'client' && cat.id !== 'pricing').map((cat) => {
        const visibleItems = cat.items.filter(item => {
          // Skip currency fields
          if (item.type === 'currency') return false
          // Check dependsOn visibility
          if (item.dependsOn) {
            const depKey = `${cat.id}.${item.dependsOn.field}`
            if (formData[depKey] !== item.dependsOn.value) return false
          }
          return isItemIncluded(item, formData[`${cat.id}.${item.id}`])
        })
        if (visibleItems.length === 0) return null

        const textareaItems = visibleItems.filter(item => item.type === 'textarea')
        const tableItems = visibleItems.filter(item => item.type !== 'textarea')
        const isAllTextarea = tableItems.length === 0

        return (
          <div key={cat.id} data-pdf-section style={{ padding: '24px 50px', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{
              fontFamily: 'Playfair Display, Georgia, serif',
              fontSize: '16px',
              color: '#1a1a2e',
              marginBottom: '16px',
              paddingBottom: '8px',
              borderBottom: '2px solid #E8850C',
              display: 'inline-block',
            }}>
              {cat.title}
            </h2>

            {tableItems.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <th style={{ padding: '8px 0', textAlign: 'left', color: '#888', fontWeight: '500', width: '30%', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Item</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', color: '#888', fontWeight: '500', width: '15%', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Selection</th>
                  <th style={{ padding: '8px 0', textAlign: 'left', color: '#888', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map((item) => {
                  const key = `${cat.id}.${item.id}`
                  const value = formData[key]
                  const writeIn = formData[`${cat.id}.${item.id}_writeIn`]

                  let selectionType = ''
                  let description = value
                  let isUpgrade = false

                  if (item.type === 'choice') {
                    isUpgrade = value === 'upg'
                    selectionType = value === 'upg' ? 'UPGRADE' : 'STANDARD'
                    description = value === 'upg' ? item.upgrade : (item.standardLabel || item.standard)
                    if (value === 'upg' && writeIn) description += ` - ${writeIn}`
                  } else if (item.type === 'options') {
                    selectionType = getOptionsLabel(item, value).toUpperCase()
                    description = getOptionsLabel(item, value)
                    if (writeIn) description += ` - ${writeIn}`
                  } else if (item.type === 'text' || item.type === 'date') {
                    description = value
                  }

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '8px 0', color: '#444' }}>{item.label}</td>
                      <td style={{ padding: '8px 0' }}>
                        {(item.type === 'choice' || item.type === 'options') && (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            fontSize: '9px',
                            fontWeight: '700',
                            letterSpacing: '0.05em',
                            background: isUpgrade ? 'rgba(232,133,12,0.1)' : 'rgba(34,197,94,0.1)',
                            color: isUpgrade ? '#E8850C' : '#22c55e',
                          }}>
                            {selectionType}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '8px 0', color: '#1a1a2e', fontWeight: isUpgrade ? '500' : '400', whiteSpace: 'pre-line' }}>
                        {description}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            )}

            {textareaItems.map((item) => {
              const value = formData[`${cat.id}.${item.id}`]
              if (!value) return null
              return (
                <div key={item.id} style={{
                  marginTop: tableItems.length > 0 || !isAllTextarea ? '16px' : '0',
                  marginBottom: '16px',
                  padding: '14px 18px',
                  background: '#fafafa',
                  border: '1px solid #eee',
                  borderLeft: '3px solid #E8850C',
                }}>
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '700',
                    color: '#888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#1a1a2e',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line',
                  }}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}

      {/* Floor Plans */}
      {floorPlans.length > 0 && (
        <div data-pdf-section style={{ padding: '30px 50px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '16px', color: '#1a1a2e', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E8850C', display: 'inline-block' }}>
            Floor Plans
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            {floorPlans.map((file, idx) => (
              <div key={idx} style={{ flex: '1 1 45%', maxWidth: '48%' }}>
                <img src={file.url} alt={file.name} style={{ width: '100%', border: '1px solid #e5e5e5' }} crossOrigin="anonymous" />
                <p style={{ fontSize: '9px', color: '#888', marginTop: '4px', textAlign: 'center' }}>{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      {(() => {
        const getVal = (id) => parseFloat(formData[`pricing.${id}`]) || 0
        const isDual = formData['pricing.dwellingTwoEnabled'] === 'upg'
        const gstIncluded = formData['pricing.gstIncluded'] === 'upg'
        const d1 = getVal('dwellingOnePrice')
        const d2 = isDual ? getVal('dwellingTwoPrice') : 0
        const site = getVal('siteWorksPrice')
        const demo = getVal('demolitionPrice')
        const upgrades = getVal('upgradesPrice')
        const other = getVal('otherPrice')
        const subtotal = d1 + d2 + site + demo + upgrades + other
        if (subtotal === 0) return null
        const gst = gstIncluded ? 0 : subtotal * 0.1
        const total = subtotal + gst
        const fmt = (n) => '$' + n.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
        const d1Land = formData['pricing.dwellingOneLandSize']
        const d2Land = formData['pricing.dwellingTwoLandSize']
        const rows = []
        if (d1 > 0) rows.push(['Dwelling One' + (d1Land ? ` (${d1Land}m\u00B2)` : ''), fmt(d1)])
        if (isDual && d2 > 0) rows.push(['Dwelling Two' + (d2Land ? ` (${d2Land}m\u00B2)` : ''), fmt(d2)])
        if (site > 0) rows.push(['Site Works', fmt(site)])
        if (demo > 0) rows.push(['Demolition', fmt(demo)])
        if (upgrades > 0) rows.push(['Upgrades / Extras', fmt(upgrades)])
        if (other > 0) rows.push([formData['pricing.otherLabel'] || 'Other', fmt(other)])
        return (
          <div data-pdf-section style={{ padding: '30px 50px', borderBottom: '1px solid #e5e5e5' }}>
            <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '16px', color: '#1a1a2e', marginBottom: '16px', paddingBottom: '8px', borderBottom: '2px solid #E8850C', display: 'inline-block' }}>
              Pricing Summary
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {rows.map(([label, val], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 0', color: '#444' }}>{label}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', color: '#1a1a2e', fontWeight: '500' }}>{val}</td>
                  </tr>
                ))}
                {!gstIncluded && (
                  <>
                    <tr style={{ borderTop: '2px solid #e5e5e5' }}>
                      <td style={{ padding: '10px 0', color: '#888', fontWeight: '600' }}>Subtotal</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#1a1a2e', fontWeight: '600' }}>{fmt(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '10px 0', color: '#888' }}>GST (10%)</td>
                      <td style={{ padding: '10px 0', textAlign: 'right', color: '#1a1a2e' }}>{fmt(gst)}</td>
                    </tr>
                  </>
                )}
                <tr style={{ borderTop: '2px solid #1a1a2e' }}>
                  <td style={{ padding: '12px 0', color: '#1a1a2e', fontWeight: '700', fontSize: '15px' }}>Total {gstIncluded ? '(incl. GST)' : '(incl. GST)'}</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#E8850C', fontWeight: '700', fontSize: '15px' }}>{fmt(total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })()}

      {/* Signature area — always on its own page */}
      <div data-pdf-section data-pdf-ack style={{ padding: '30px 50px', borderTop: '2px solid #e5e5e5' }}>
        <h2 style={{
          fontFamily: 'Playfair Display, Georgia, serif',
          fontSize: '16px',
          color: '#1a1a2e',
          marginBottom: '16px',
        }}>
          Acknowledgement
        </h2>
        <p style={{ fontSize: '11px', color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
          By signing below, both parties acknowledge and agree to the selections and specifications
          outlined in this document. Any changes to these selections after signing may incur additional
          costs and may affect the construction timeline.
        </p>

        <div style={{ display: 'flex', gap: '60px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '32px' }}>
              Client Signature
            </div>
            <div style={{ borderBottom: '1px solid #ccc', marginBottom: '8px', height: '1px' }} />
            <div style={{ fontSize: '11px', color: '#888' }}>{clientName}</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Date: _______________</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '32px' }}>
              NPI Representative
            </div>
            <div style={{ borderBottom: '1px solid #ccc', marginBottom: '8px', height: '1px' }} />
            <div style={{ fontSize: '11px', color: '#888' }}>{salesExec || 'Authorised Representative'}</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Date: _______________</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '12px',
          borderTop: '1px solid #e5e5e5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '9px', color: '#aaa' }}>
            Nationwide Projects Investments Pty Ltd | ABN XX XXX XXX XXX
          </div>
          <div style={{ fontSize: '9px', color: '#E8850C' }}>
            Confidential
          </div>
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════════════
// ─── Main Estimator Component ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export default function Estimator() {
  return (
    <EstimatorErrorBoundary>
      <EstimatorInner />
    </EstimatorErrorBoundary>
  )
}

function EstimatorInner() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState({})
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [errors, setErrors] = useState({})
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [configDirty, setConfigDirty] = useState(false)
  const [configVersion, setConfigVersion] = useState(0)
  const mainRef = useRef(null)
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [draftSaving, setDraftSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [saveStatus, setSaveStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | 'offline'

  // Update config item (for edit mode)
  const updateConfigItem = useCallback((catId, itemId, updates) => {
    const catIdx = CATEGORIES.findIndex(c => c.id === catId)
    if (catIdx === -1) return
    const itemIdx = CATEGORIES[catIdx].items.findIndex(i => i.id === itemId)
    if (itemIdx === -1) return
    Object.assign(CATEGORIES[catIdx].items[itemIdx], updates)
    setConfigDirty(true); setConfigVersion(v => v + 1)
  }, [])

  // Add option to an options item
  const addConfigOption = useCallback((catId, itemId) => {
    const catIdx = CATEGORIES.findIndex(c => c.id === catId)
    if (catIdx === -1) return
    const item = CATEGORIES[catIdx].items.find(i => i.id === itemId)
    if (!item || !item.options) return
    const newId = `opt_${Math.random().toString(36).substring(2, 8)}`
    item.options.push({ id: newId, label: 'New Option' })
    setConfigDirty(true); setConfigVersion(v => v + 1)
  }, [])

  // Delete option from an options item
  const deleteConfigOption = useCallback((catId, itemId, optId) => {
    const catIdx = CATEGORIES.findIndex(c => c.id === catId)
    if (catIdx === -1) return
    const item = CATEGORIES[catIdx].items.find(i => i.id === itemId)
    if (!item || !item.options) return
    item.options = item.options.filter(o => o.id !== optId)
    setConfigDirty(true); setConfigVersion(v => v + 1)
  }, [])

  // Update option label
  const updateConfigOption = useCallback((catId, itemId, optId, label) => {
    const catIdx = CATEGORIES.findIndex(c => c.id === catId)
    if (catIdx === -1) return
    const item = CATEGORIES[catIdx].items.find(i => i.id === itemId)
    if (!item || !item.options) return
    const opt = item.options.find(o => o.id === optId)
    if (opt) opt.label = label
    setConfigDirty(true); setConfigVersion(v => v + 1)
  }, [])

  // Delete an item from config
  const deleteConfigItem = useCallback((catId, itemId) => {
    const catIdx = CATEGORIES.findIndex(c => c.id === catId)
    if (catIdx === -1) return
    CATEGORIES[catIdx].items = CATEGORIES[catIdx].items.filter(i => i.id !== itemId)
    setConfigDirty(true); setConfigVersion(v => v + 1)
  }, [])

  // Save config changes (local + server)
  const saveConfig = useCallback(() => {
    const configData = JSON.parse(JSON.stringify(CATEGORIES))
    localStorage.setItem(CONFIG_KEY, JSON.stringify(configData))
    // Save inclusions too
    const inclusionsData = JSON.parse(JSON.stringify(INCLUSIONS))
    localStorage.setItem(INCLUSIONS_KEY, JSON.stringify(inclusionsData))
    setConfigDirty(false)
    // Sync to server
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: configData, updated_by: 'client' }),
    }).catch(() => {})
    fetch('/api/inclusions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: inclusionsData }),
    }).catch(() => {})
  }, [])

  // Load form data from localStorage + config from server
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.formData && typeof parsed.formData === 'object') setFormData(parsed.formData)
        if (parsed.completedSteps) setCompletedSteps(new Set(parsed.completedSteps))
        if (typeof parsed.currentStep === 'number') setCurrentStep(Math.min(parsed.currentStep, getReviewStep()))
      }
    } catch {}

    // Fetch latest config from server (in background)
    if (!categoriesLoaded) {
      categoriesLoaded = true
      loadCategoriesFromServer().then(serverConfig => {
        if (serverConfig) {
          CATEGORIES.length = 0
          CATEGORIES.push(...serverConfig)
          setConfigVersion(v => v + 1)
        }
      })
      loadInclusionsFromServer().then(serverInclusions => {
        if (serverInclusions) {
          INCLUSIONS.length = 0
          INCLUSIONS.push(...serverInclusions)
          setConfigVersion(v => v + 1)
        }
      })
    }
  }, [])

  // Load draft from Quotes page (if redirected)
  useEffect(() => {
    const draftId = localStorage.getItem('npi-load-draft-id')
    if (draftId) {
      localStorage.removeItem('npi-load-draft-id')
      ;(async () => {
        try {
          const res = await fetch(`/api/drafts?action=get&id=${draftId}`)
          if (!res.ok) return
          const draft = await res.json()
          if (!draft) return
          setFormData(draft.form_data || {})
          setCompletedSteps(new Set(draft.completed_steps || []))
          setCurrentStep(draft.current_step || 0)
          setCurrentDraftId(draft.id)
          setErrors({})
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            formData: draft.form_data,
            completedSteps: draft.completed_steps,
            currentStep: draft.current_step,
          }))
        } catch {
          alert('Failed to load saved quote. Starting fresh.')
        }
      })()
    }
  }, [])

  // Instant localStorage save on every change (never lose data)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData,
        completedSteps: [...completedSteps],
        currentStep,
      }))
    } catch {
      // quota exceeded — still have server backup
    }
  }, [formData, completedSteps, currentStep])

  // Debounced server save (2s after last change)
  useEffect(() => {
    if (!currentDraftId || Object.keys(formData).length === 0) return
    setSaveStatus('saving')
    const timer = setTimeout(() => {
      const clientName = formData['client.clientName'] || 'Untitled Quote'
      const siteAddress = formData['client.siteAddress'] || ''
      const lastCat = currentStep < CATEGORIES.length ? CATEGORIES[currentStep]?.title : 'Review'
      fetch('/api/drafts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentDraftId,
          client_name: clientName,
          site_address: siteAddress,
          form_data: formData,
          completed_steps: [...completedSteps],
          current_step: currentStep,
          last_category: lastCat,
        }),
      }).then(res => {
        if (res.ok) {
          setSaveStatus('saved')
          setLastSavedAt(new Date())
        } else {
          setSaveStatus('offline')
        }
      }).catch(() => {
        setSaveStatus('offline')
      })
    }, 2000)
    return () => clearTimeout(timer)
  }, [formData, completedSteps, currentStep, currentDraftId])

  // Save immediately when user switches tabs, locks phone, or closes browser
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Immediate localStorage save
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            formData,
            completedSteps: [...completedSteps],
            currentStep,
            currentDraftId,
          }))
        } catch {}
        // Fire-and-forget server save
        if (currentDraftId) {
          fetch('/api/drafts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: currentDraftId,
              form_data: formData,
              current_step: currentStep,
              completed_steps: [...completedSteps],
            }),
            keepalive: true, // allows request to outlive the page
          }).catch(() => {})
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [formData, completedSteps, currentStep, currentDraftId])

  // Warn before closing tab with unsaved data
  useEffect(() => {
    const handler = (e) => {
      if (Object.keys(formData).length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [formData])

  const handleSave = useCallback(async () => {
    setDraftSaving(true)
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData,
        completedSteps: [...completedSteps],
        currentStep,
      }))

      // Save to Supabase
      const clientName = formData['client.clientName'] || 'Untitled Quote'
      const siteAddress = formData['client.siteAddress'] || ''
      const lastCat = currentStep < CATEGORIES.length ? CATEGORIES[currentStep]?.title : 'Review'
      const payload = {
        client_name: clientName,
        site_address: siteAddress,
        form_data: formData,
        completed_steps: [...completedSteps],
        current_step: currentStep,
        last_category: lastCat,
        updated_at: new Date().toISOString(),
      }

      if (currentDraftId) {
        const res = await fetch('/api/drafts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentDraftId, ...payload }),
        })
        if (!res.ok) throw new Error('Failed to update quote')
      } else {
        payload.status = 'draft'
        const res = await fetch('/api/drafts?action=create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to save quote')
        const draft = await res.json()
        setCurrentDraftId(draft.id)
      }

      setSaveFlash(true)
      setTimeout(() => setSaveFlash(false), 2000)
    } catch (err) {
      console.error('Save error:', err)
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    }
    setDraftSaving(false)
  }, [formData, completedSteps, currentStep, currentDraftId])

  const validateClientStep = useCallback(() => {
    const cat = CATEGORIES[0]
    if (!cat) return true
    const newErrors = {}
    cat.items.forEach(item => {
      if (item.required) {
        const key = `${cat.id}.${item.id}`
        if (!formData[key]?.trim()) {
          newErrors[key] = 'Required'
        }
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const goToStep = useCallback((step) => {
    setDirection(step > currentStep ? 1 : -1)
    // Mark current step as completed (except review)
    if (currentStep < CATEGORIES.length) {
      setCompletedSteps(prev => new Set([...prev, currentStep]))
    }
    setCurrentStep(step)
    if (mainRef.current) mainRef.current.scrollTop = 0
    // Immediate localStorage save on step change
    try {
      const newCompleted = currentStep < CATEGORIES.length
        ? [...completedSteps, currentStep]
        : [...completedSteps]
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        formData,
        completedSteps: newCompleted,
        currentStep: step,
      }))
    } catch {}
  }, [currentStep, formData, completedSteps])

  // Create draft on server (called on step 0 and retried on later steps if needed)
  const ensureDraftOnServer = useCallback(async () => {
    if (currentDraftId) return // already created
    try {
      const clientName = formData['client.clientName'] || 'Untitled Quote'
      const siteAddress = formData['client.siteAddress'] || ''
      const res = await fetch('/api/drafts?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: clientName,
          site_address: siteAddress,
          form_data: formData,
          completed_steps: [...completedSteps],
          current_step: currentStep,
          last_category: CATEGORIES[currentStep]?.title || 'Client',
          status: 'draft',
        }),
      })
      if (res.ok) {
        const draft = await res.json()
        setCurrentDraftId(draft.id)
      }
    } catch {
      // Non-blocking — localStorage still has the data
    }
  }, [currentDraftId, formData, completedSteps, currentStep])

  const handleNext = useCallback(async () => {
    // Validate client step
    if (currentStep === 0 && !validateClientStep()) return
    // Create or retry server draft on every step if we don't have one yet
    if (!currentDraftId && Object.keys(formData).length > 0) {
      await ensureDraftOnServer()
    }
    if (currentStep < getReviewStep()) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, goToStep, validateClientStep, currentDraftId, formData, ensureDraftOnServer])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  const handleGeneratePDF = useCallback(async () => {
    setGenerating(true)
    try {
      // Wait for DOM to render hidden content
      await new Promise(r => setTimeout(r, 200))

      const element = document.getElementById('pdf-content')
      if (!element) {
        setGenerating(false)
        return
      }

      // Temporarily make visible for capture
      element.style.position = 'absolute'
      element.style.left = '0'
      element.style.top = '0'
      element.style.zIndex = '-1'

      // ── Smart page break: add spacers so no section straddles a page boundary ──
      const A4_HEIGHT_PX = 1123 // A4 at 96dpi ≈ 1123px, scaled by 1.5 → use raw px
      const sections = element.querySelectorAll('[data-pdf-section]')
      // Remove any previous spacers
      element.querySelectorAll('.pdf-page-spacer').forEach(s => s.remove())

      // Pass 0: Force Acknowledgement section to always start on a new page
      const ackSection = element.querySelector('[data-pdf-ack]')
      if (ackSection) {
        const ackTop = ackSection.offsetTop
        const ackPageStart = Math.floor(ackTop / A4_HEIGHT_PX) * A4_HEIGHT_PX
        if (ackTop > ackPageStart) {
          const spacer = document.createElement('div')
          spacer.className = 'pdf-page-spacer'
          spacer.style.height = (ackPageStart + A4_HEIGHT_PX - ackTop) + 'px'
          ackSection.parentNode.insertBefore(spacer, ackSection)
        }
      }

      // Pass 1: Push small sections that straddle pages to the next page
      let attempts = 0
      while (attempts < 5) {
        let inserted = false
        const sects = element.querySelectorAll('[data-pdf-section]')
        for (const sect of sects) {
          const top = sect.offsetTop
          const height = sect.offsetHeight
          const pageStart = Math.floor(top / A4_HEIGHT_PX) * A4_HEIGHT_PX
          const pageEnd = pageStart + A4_HEIGHT_PX
          if (top > pageStart && (top + height) > pageEnd && height < A4_HEIGHT_PX) {
            const spacer = document.createElement('div')
            spacer.className = 'pdf-page-spacer'
            spacer.style.height = (pageEnd - top) + 'px'
            sect.parentNode.insertBefore(spacer, sect)
            inserted = true
            break
          }
        }
        if (!inserted) break
        attempts++
      }

      // Pass 2: Fix individual table rows that straddle page boundaries
      // Also check notes boxes and section headings
      const elTop = element.getBoundingClientRect().top
      let rowAttempts = 0
      while (rowAttempts < 15) {
        let inserted = false
        const rows = element.querySelectorAll('#pdf-content tr:not(.pdf-page-spacer)')
        for (const row of rows) {
          const rowTop = row.getBoundingClientRect().top - elTop
          const rowHeight = row.offsetHeight
          const rowPageStart = Math.floor(rowTop / A4_HEIGHT_PX) * A4_HEIGHT_PX
          const rowPageEnd = rowPageStart + A4_HEIGHT_PX
          if (rowTop > rowPageStart + 10 && (rowTop + rowHeight) > rowPageEnd && rowHeight < 120) {
            const spacer = document.createElement('tr')
            spacer.className = 'pdf-page-spacer'
            const td = document.createElement('td')
            td.colSpan = 3
            td.style.height = (rowPageEnd - rowTop + 4) + 'px'
            td.style.padding = '0'
            td.style.border = 'none'
            spacer.appendChild(td)
            row.parentNode.insertBefore(spacer, row)
            inserted = true
            break // re-measure after each insertion
          }
        }
        if (!inserted) {
          // Also check notes boxes (divs with notes styling)
          const noteBoxes = element.querySelectorAll('[data-pdf-section] > div:last-child')
          for (const box of noteBoxes) {
            const boxTop = box.getBoundingClientRect().top - elTop
            const boxHeight = box.offsetHeight
            const boxPageStart = Math.floor(boxTop / A4_HEIGHT_PX) * A4_HEIGHT_PX
            const boxPageEnd = boxPageStart + A4_HEIGHT_PX
            if (boxTop > boxPageStart + 10 && (boxTop + boxHeight) > boxPageEnd && boxHeight < A4_HEIGHT_PX * 0.5) {
              const spacer = document.createElement('div')
              spacer.className = 'pdf-page-spacer'
              spacer.style.height = (boxPageEnd - boxTop + 4) + 'px'
              box.parentNode.insertBefore(spacer, box)
              inserted = true
              break
            }
          }
        }
        if (!inserted) break
        rowAttempts++
      }

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 794,
        windowWidth: 794,
      })

      // Reset position & clean up spacers (both div and tr spacers)
      element.querySelectorAll('.pdf-page-spacer').forEach(s => s.remove())
      element.style.position = 'absolute'
      element.style.left = '-9999px'

      const imgData = canvas.toDataURL('image/jpeg', 0.85)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      // First page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
      heightLeft -= pageHeight

      // Additional pages
      while (heightLeft > 0) {
        position = position - pageHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST')
        heightLeft -= pageHeight
      }

      const clientName = (formData['client.clientName'] || 'Client').replace(/[^a-zA-Z0-9]/g, '-')
      const dateStr = new Date().toISOString().split('T')[0]

      // On mobile Safari, use blob URL + window.open for reliable download
      const isMobileSafari = /iPhone|iPad/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent)
      if (isMobileSafari) {
        const blob = pdf.output('blob')
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        setTimeout(() => URL.revokeObjectURL(url), 10000)
      } else {
        pdf.save(`NPI-Estimate-${clientName}-${dateStr}.pdf`)
      }

      // Mark draft as exported on server
      if (currentDraftId) {
        fetch('/api/drafts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentDraftId, status: 'exported' }),
        }).catch(() => {})
      }
    } catch (err) {
      console.error('PDF generation error:', err)
      const el = document.getElementById('pdf-content')
      if (el) el.style.left = '-9999px'
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [formData, currentDraftId])

  const handleClearAll = useCallback(async () => {
    const hasData = Object.keys(formData).length > 0

    if (hasData) {
      if (!window.confirm('⚠️ Start a new quote?\n\nAny unsaved progress will be lost. Make sure you have saved your current quote before continuing.')) {
        return
      }
    }

    setFormData({})
    setCompletedSteps(new Set())
    setCurrentStep(0)
    setCurrentDraftId(null)
    setErrors({})
    setSaveStatus('idle')
    localStorage.removeItem(STORAGE_KEY)
  }, [formData])

  // Current category
  const currentCategory = currentStep < CATEGORIES.length ? CATEGORIES[currentStep] : null
  const isInclusions = currentStep === getInclusionsStep()
  const isReview = currentStep === getReviewStep()
  const isLastCategory = currentStep === CATEGORIES.length - 1

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] -m-4 lg:-m-6 bg-void text-white overflow-hidden">
      {/* ─── Desktop Sidebar ──────────────────────────────── */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-void-light border-r border-white/5 flex-col">
        <SidebarContent
          currentStep={currentStep}
          setCurrentStep={goToStep}
          completedSteps={completedSteps}
          formData={formData}
        />
      </aside>

      {/* ─── Mobile Menu ──────────────────────────────────── */}
      <MobileMenu
        currentStep={currentStep}
        setCurrentStep={goToStep}
        completedSteps={completedSteps}
        formData={formData}
        isOpen={mobileMenuOpen}
        setIsOpen={setMobileMenuOpen}
      />

      {/* ─── Main Content ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden relative flex items-center justify-between px-4 py-3 border-b border-white/5 bg-void-light">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span className="text-sm">Menu</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-amber flex items-center justify-center">
              <span className="text-white font-bold text-[8px]">NPI</span>
            </div>
            <span className="text-xs text-white/50">
              Step {Math.min(currentStep + 1, CATEGORIES.length)} / {CATEGORIES.length}
            </span>
          </div>
          {/* Mobile progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
            <div
              className="h-full bg-amber transition-all duration-500"
              style={{ width: `${(completedSteps.size / CATEGORIES.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="bg-amber/10 border-b border-amber/20 px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <svg className="w-4 h-4 text-amber shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
              <span className="text-xs font-medium text-amber truncate">Edit Mode — tap to rename, add, or delete</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/estimator/admin"
                className="px-3 py-1 text-[10px] font-medium border border-amber/30 text-amber/70 hover:text-amber hover:border-amber/60 uppercase tracking-wider transition-colors"
              >
                Advanced
              </Link>
              {configDirty && (
                <button onClick={saveConfig} className="px-3 py-1 text-[10px] font-bold bg-amber text-white uppercase tracking-wider">
                  Save
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable main area */}
        <main ref={mainRef} className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-32">
            <AnimatePresence mode="wait" custom={direction}>
              {/* ─── Category Form Steps ──────────────── */}
              {currentCategory && (
                <motion.div
                  key={currentCategory.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Step header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber/60">{getIcon(currentCategory.icon)}</span>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                        Step {currentStep + 1} of {CATEGORIES.length}
                      </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
                      {currentCategory.title}
                    </h1>
                    <div className="w-12 h-0.5 bg-amber" />
                  </div>

                  {/* Form fields */}
                  <div className="space-y-6">
                    {currentCategory.items.map((item) => {
                      const key = `${currentCategory.id}.${item.id}`

                      // Conditional visibility: skip items whose dependency isn't met
                      if (item.dependsOn && !editMode) {
                        const depKey = `${currentCategory.id}.${item.dependsOn.field}`
                        if (formData[depKey] !== item.dependsOn.value) return null
                      }

                      if (item.type === 'choice') {
                        return (
                          <ChoiceCard
                            key={item.id}
                            item={item}
                            categoryId={currentCategory.id}
                            formData={formData}
                            setFormData={setFormData}
                            editMode={editMode}
                            onUpdateItem={updateConfigItem}
                            onDeleteItem={deleteConfigItem}
                          />
                        )
                      }

                      if (item.type === 'options') {
                        return (
                          <OptionsCard
                            key={item.id}
                            item={item}
                            categoryId={currentCategory.id}
                            formData={formData}
                            setFormData={setFormData}
                            editMode={editMode}
                            onAddOption={addConfigOption}
                            onDeleteOption={deleteConfigOption}
                            onUpdateOption={updateConfigOption}
                          />
                        )
                      }

                      if (item.type === 'textarea') {
                        return (
                          <TextareaInput
                            key={item.id}
                            item={item}
                            categoryId={currentCategory.id}
                            formData={formData}
                            setFormData={setFormData}
                          />
                        )
                      }

                      if (item.type === 'currency') {
                        return (
                          <CurrencyInput
                            key={item.id}
                            item={item}
                            categoryId={currentCategory.id}
                            formData={formData}
                            setFormData={setFormData}
                          />
                        )
                      }

                      return (
                        <div key={item.id}>
                          <TextInput
                            item={item}
                            categoryId={currentCategory.id}
                            formData={formData}
                            setFormData={setFormData}
                          />
                          {errors[key] && (
                            <p className="mt-1 text-xs text-red-400">{errors[key]}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Show Pricing Total on Pricing page */}
                  {/* Floor plan upload on Project Details step */}
                  {currentCategory?.id === 'project' && (
                    <FloorPlanUpload draftId={currentDraftId} formData={formData} setFormData={setFormData} />
                  )}

                  {currentCategory?.id === 'pricing' && (
                    <PricingTotal formData={formData} />
                  )}

                  {/* Show Inclusions inline on Preliminaries page */}
                  {currentCategory?.id === 'preliminaries' && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                      <div className="space-y-8">
                        {INCLUSIONS.map(section => (
                          <div key={section.id} className="bg-void-light border border-white/[0.06] rounded-xl overflow-hidden">
                            <div className="divide-y divide-white/[0.04]">
                              {section.items.map((item, i) => (
                                <div key={i} className="px-5 py-3 flex items-start gap-3">
                                  <span className="text-emerald-500 mt-0.5 shrink-0">{icons.check}</span>
                                  <span className="text-sm text-white/70">{item}</span>
                                </div>
                              ))}
                            </div>
                            {section.notes && section.notes.length > 0 && (
                              <div className="px-5 py-3 border-t border-amber/10 bg-amber/[0.03]">
                                <p className="text-[10px] font-bold text-amber/70 uppercase tracking-wider mb-2">Notes & Exclusions</p>
                                <ul className="space-y-1.5">
                                  {section.notes.map((note, i) => (
                                    <li key={i} className="text-xs text-white/40 flex items-start gap-2">
                                      <span className="text-amber/40 mt-0.5">•</span>
                                      <span>{note}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── Inclusions Step ──────────────────── */}
              {currentStep === getInclusionsStep() && (
                <motion.div
                  key="inclusions"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  {editMode && (
                    <div className="mb-8">
                      <p className="text-white/50 text-sm">
                        Edit mode — click any text to rename, use buttons to add or remove items.
                      </p>
                    </div>
                  )}

                  {/* Add Section button (edit mode) */}
                  {editMode && (
                    <button
                      onClick={() => {
                        const newId = `section_${Math.random().toString(36).substring(2, 8)}`
                        INCLUSIONS.push({ id: newId, title: 'New Section', items: ['New item'], notes: [] })
                        setConfigDirty(true); setConfigVersion(v => v + 1)
                      }}
                      className="w-full mb-6 py-3 border border-dashed border-amber/20 text-amber/40 hover:text-amber hover:border-amber/50 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      Add Section
                    </button>
                  )}

                  <div className="space-y-6">
                    {INCLUSIONS.map((section, sIdx) => (
                      <div key={section.id} className={`border overflow-hidden ${editMode ? 'border-dashed border-amber/20' : 'border-white/10'}`}>
                        {/* Section header — only visible in edit mode */}
                        {editMode && (
                          <div className="px-5 py-3 bg-void-lighter border-b border-white/5 flex items-center justify-between">
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => {
                                INCLUSIONS[sIdx].title = e.target.value
                                setConfigDirty(true); setConfigVersion(v => v + 1)
                              }}
                              className="font-display text-base text-amber bg-transparent border-b border-amber/30 outline-none w-full"
                            />
                            <button
                              onClick={() => {
                                if (confirm(`Delete section "${section.title}"?`)) {
                                  INCLUSIONS.splice(sIdx, 1)
                                  setConfigDirty(true); setConfigVersion(v => v + 1)
                                }
                              }}
                              className="ml-3 text-[10px] font-medium uppercase tracking-wider text-red-400/60 hover:text-red-400 px-2 py-0.5 border border-red-400/20 hover:border-red-400/40 shrink-0"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        {/* Items */}
                        <div className="divide-y divide-white/5">
                          {section.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-3 px-5 py-2.5">
                              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              {editMode ? (
                                <input
                                  type="text"
                                  value={item}
                                  onChange={(e) => {
                                    INCLUSIONS[sIdx].items[i] = e.target.value
                                    setConfigDirty(true); setConfigVersion(v => v + 1)
                                  }}
                                  className="flex-1 text-white/70 text-sm bg-transparent border-b border-white/10 outline-none focus:border-amber/40"
                                />
                              ) : (
                                <span className="text-white/70 text-sm">{item}</span>
                              )}
                              {editMode && (
                                <button
                                  onClick={() => {
                                    INCLUSIONS[sIdx].items.splice(i, 1)
                                    setConfigDirty(true); setConfigVersion(v => v + 1)
                                  }}
                                  className="text-red-400/40 hover:text-red-400 shrink-0"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                </button>
                              )}
                            </div>
                          ))}
                          {editMode && (
                            <button
                              onClick={() => {
                                INCLUSIONS[sIdx].items.push('New item')
                                setConfigDirty(true); setConfigVersion(v => v + 1)
                              }}
                              className="w-full py-2.5 text-amber/30 hover:text-amber text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                              Add Item
                            </button>
                          )}
                        </div>

                        {/* Notes */}
                        {(section.notes?.length > 0 || editMode) && (
                          <div className="px-5 py-3 bg-amber/5 border-t border-amber/10">
                            <div className="text-[10px] font-bold text-amber uppercase tracking-wider mb-2">Notes & Exclusions</div>
                            {(section.notes || []).map((note, i) => (
                              <div key={i} className="flex items-start gap-2 mb-1">
                                <span className="text-amber text-xs mt-0.5">{'\u2022'}</span>
                                {editMode ? (
                                  <input
                                    type="text"
                                    value={note}
                                    onChange={(e) => {
                                      INCLUSIONS[sIdx].notes[i] = e.target.value
                                      setConfigDirty(true); setConfigVersion(v => v + 1)
                                    }}
                                    className="flex-1 text-white/40 text-xs bg-transparent border-b border-white/10 outline-none focus:border-amber/40"
                                  />
                                ) : (
                                  <span className="text-white/40 text-xs leading-relaxed">{note}</span>
                                )}
                                {editMode && (
                                  <button
                                    onClick={() => {
                                      INCLUSIONS[sIdx].notes.splice(i, 1)
                                      setConfigDirty(true); setConfigVersion(v => v + 1)
                                    }}
                                    className="text-red-400/40 hover:text-red-400 shrink-0"
                                  >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                  </button>
                                )}
                              </div>
                            ))}
                            {editMode && (
                              <button
                                onClick={() => {
                                  if (!INCLUSIONS[sIdx].notes) INCLUSIONS[sIdx].notes = []
                                  INCLUSIONS[sIdx].notes.push('New note')
                                  setConfigDirty(true); setConfigVersion(v => v + 1)
                                }}
                                className="mt-2 text-amber/30 hover:text-amber text-xs font-medium flex items-center gap-1.5 transition-colors"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Add Note
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ─── Review Step ──────────────────────── */}
              {isReview && (
                <motion.div
                  key="review"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-amber/60">{icons.clipboard}</span>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                        Final Review
                      </span>
                    </div>
                    <h1 className="font-display text-3xl sm:text-4xl text-white mb-2">
                      Review & Export
                    </h1>
                    <div className="w-12 h-0.5 bg-amber mb-4" />
                    <p className="text-white/50 text-sm">
                      Review all selections below. Click any section in the sidebar to make changes.
                    </p>
                  </div>

                  {/* Client info summary */}
                  <div className="mb-8 p-6 bg-void-lighter border border-white/10">
                    <h3 className="font-display text-lg text-amber mb-4 flex items-center gap-2">
                      <span className="text-amber/60">{icons.user}</span>
                      Client Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                      {(CATEGORIES[0]?.items || []).map(item => {
                        const val = formData[`client.${item.id}`]
                        if (!val) return null
                        return (
                          <div key={item.id} className="flex items-baseline gap-2 py-1">
                            <span className="text-xs text-white/40 shrink-0">{item.label}:</span>
                            <span className="text-sm text-white">{val}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* All other sections */}
                  {CATEGORIES.filter(c => c.id !== 'client').map(cat => (
                    <ReviewSection key={cat.id} category={cat} formData={formData} />
                  ))}

                  {/* Pricing Total on Review */}
                  <PricingTotal formData={formData} />

                  {/* Export actions */}
                  <div className="mt-12 p-6 bg-void-lighter border border-amber/20">
                    <h3 className="font-display text-lg text-white mb-2">Export Document</h3>
                    <p className="text-sm text-white/50 mb-6">
                      Generate a professional PDF document with all client selections and specifications.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleGeneratePDF}
                        disabled={generating}
                        className="flex items-center gap-2 px-8 py-3 bg-amber text-white font-semibold text-sm uppercase tracking-wider hover:bg-amber-light transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generating ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            {icons.download}
                            Download PDF
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/60 text-sm uppercase tracking-wider hover:border-red-500/30 hover:text-red-400 transition-all duration-300"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ─── Bottom Navigation Bar ──────────────────────── */}
        <div className="shrink-0 border-t border-white/5 bg-void-light px-4 sm:px-6 lg:px-10 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 border border-white/10 text-white/60 text-sm font-medium hover:border-white/20 hover:text-white transition-all duration-200"
                >
                  {icons.arrowLeft}
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/30 text-sm font-medium hover:border-red-500/30 hover:text-red-400 transition-all duration-200"
                title="Start a new quote"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                <span className="hidden sm:inline">New Quote</span>
              </button>
              {/* Edit Mode Toggle */}
              <button
                onClick={() => {
                  if (editMode && configDirty) saveConfig()
                  setEditMode(!editMode)
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
                  editMode
                    ? 'border-amber/50 bg-amber/10 text-amber'
                    : 'border-white/10 text-white/30 hover:border-white/20 hover:text-white/60'
                }`}
                title={editMode ? 'Exit edit mode & save' : 'Edit questionnaire options'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                <span className="hidden sm:inline">{editMode ? 'Done Editing' : 'Edit'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Auto-save status */}
              {Object.keys(formData).length > 0 && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium transition-all duration-300 ${
                  saveStatus === 'saved' ? 'text-emerald-400' :
                  saveStatus === 'saving' ? 'text-white/40' :
                  saveStatus === 'offline' ? 'text-amber-400' :
                  'text-white/20'
                }`}>
                  {saveStatus === 'saved' && (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg><span className="hidden sm:inline">Saved</span></>
                  )}
                  {saveStatus === 'saving' && (
                    <><svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg><span className="hidden sm:inline">Saving...</span></>
                  )}
                  {saveStatus === 'offline' && (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg><span className="hidden sm:inline">Saved locally</span></>
                  )}
                </div>
              )}

              {/* Quotes link */}
              <Link
                to="/quotes"
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 border border-white/10 text-white/40 text-sm font-medium hover:border-white/20 hover:text-white/60 transition-all duration-200"
              >
                {icons.clipboard}
                <span className="hidden sm:inline">Quotes</span>
              </Link>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={draftSaving}
                className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium transition-all duration-200 ${
                  saveFlash
                    ? 'border-emerald-500/30 text-emerald-400'
                    : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                } disabled:opacity-50`}
              >
                {saveFlash ? icons.check : icons.save}
                <span className="hidden sm:inline">{saveFlash ? 'Saved' : draftSaving ? 'Saving...' : 'Save'}</span>
              </button>

              {/* Next / Inclusions / Review */}
              {!isReview && (
                <button
                  onClick={
                    isInclusions ? () => goToStep(getReviewStep()) :
                    isLastCategory ? () => goToStep(getInclusionsStep()) :
                    handleNext
                  }
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-amber text-white text-sm font-semibold uppercase tracking-wider hover:bg-amber-light transition-all duration-300"
                >
                  {isInclusions ? (
                    <>
                      {icons.clipboard}
                      <span className="hidden sm:inline">Review & Generate</span>
                      <span className="sm:hidden">Review</span>
                    </>
                  ) : isLastCategory ? (
                    <>
                      {icons.check}
                      <span className="hidden sm:inline">View Inclusions</span>
                      <span className="sm:hidden">Inclusions</span>
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      {icons.arrowRight}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Hidden PDF Content ───────────────────────────── */}
      <PDFContent formData={formData} draftId={currentDraftId} />
    </div>
  )
}
