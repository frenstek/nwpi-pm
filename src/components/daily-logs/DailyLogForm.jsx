import { useState, useEffect } from 'react'
import { WEATHER_OPTIONS } from '../../lib/constants'
import Button from '../ui/Button'

const weatherIcons = {
  sunny: '\u2600\uFE0F',
  cloudy: '\u2601\uFE0F',
  rain: '\uD83C\uDF27\uFE0F',
  storm: '\u26C8\uFE0F',
  hot: '\uD83C\uDF21\uFE0F',
  cold: '\u2744\uFE0F',
}

function getTodayString() {
  const d = new Date()
  return d.toISOString().split('T')[0]
}

export default function DailyLogForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    log_date: getTodayString(),
    weather: 'sunny',
    temperature: '',
    workers_on_site: '',
    hours_worked: '',
    work_completed: '',
    issues: '',
    notes: '',
  })

  useEffect(() => {
    if (initialData) {
      setForm({
        log_date: initialData.log_date || getTodayString(),
        weather: initialData.weather || 'sunny',
        temperature: initialData.temperature ?? '',
        workers_on_site: initialData.workers_on_site ?? '',
        hours_worked: initialData.hours_worked ?? '',
        work_completed: initialData.work_completed || '',
        issues: initialData.issues || '',
        notes: initialData.notes || '',
      })
    }
  }, [initialData])

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      log_date: form.log_date,
      weather: form.weather,
      temperature: form.temperature ? Number(form.temperature) : null,
      workers_on_site: form.workers_on_site ? Number(form.workers_on_site) : null,
      hours_worked: form.hours_worked ? Number(form.hours_worked) : null,
      work_completed: form.work_completed,
      issues: form.issues || null,
      notes: form.notes || null,
    })
  }

  const inputClass =
    'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber'
  const labelClass = 'block text-xs font-medium text-white/50 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Date *</label>
          <input
            type="date"
            name="log_date"
            value={form.log_date}
            onChange={handleChange}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Weather</label>
          <select
            name="weather"
            value={form.weather}
            onChange={handleChange}
            className={inputClass}
          >
            {WEATHER_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {weatherIcons[opt.value]} {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Temperature (&deg;C)</label>
          <input
            type="number"
            name="temperature"
            value={form.temperature}
            onChange={handleChange}
            placeholder="25"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Workers on Site</label>
          <input
            type="number"
            name="workers_on_site"
            value={form.workers_on_site}
            onChange={handleChange}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Hours Worked</label>
          <input
            type="number"
            name="hours_worked"
            value={form.hours_worked}
            onChange={handleChange}
            placeholder="8"
            min="0"
            step="0.5"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Work Completed *</label>
        <textarea
          name="work_completed"
          value={form.work_completed}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Describe work completed today..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Issues</label>
        <textarea
          name="issues"
          value={form.issues}
          onChange={handleChange}
          rows={2}
          placeholder="Any issues or delays..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          placeholder="Additional notes..."
          className={inputClass}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" loading={loading} disabled={!form.work_completed.trim()}>
          {initialData ? 'Update Log' : 'Add Log'}
        </Button>
      </div>
    </form>
  )
}
