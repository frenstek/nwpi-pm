import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollReveal from '../components/ScrollReveal'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { INCLUSIONS } from '../data/inclusionsData'

const checkIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.251 2.251 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
  </svg>
)

// ─── PDF Inclusions Data (for hidden render) ─────────────────────────
function InclusionsPDF({ pdfRef }) {
  return (
    <div
      ref={pdfRef}
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '794px',
        background: '#fff',
        color: '#1a1a2e',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1a1a2e 100%)',
        padding: '40px 50px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ color: '#E8850C', fontSize: '11px', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Nationwide Projects & Investments
          </div>
          <div style={{ color: '#fff', fontSize: '28px', fontWeight: '300', fontFamily: 'Playfair Display, Georgia, serif' }}>
            Base Inclusion Schedule
          </div>
        </div>
        <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
          <div>Section A</div>
          <div style={{ marginTop: '4px' }}>Standard Inclusions</div>
        </div>
      </div>

      <div style={{ padding: '20px 50px', background: '#f8f8fa', borderBottom: '1px solid #e5e5e5', fontSize: '11px', color: '#666', lineHeight: '1.6' }}>
        This document outlines the standard inclusions provided with your new home build by Nationwide Projects Investments.
        Items listed as <strong style={{ color: '#1a1a2e' }}>"Included"</strong> are part of the base package.
        Items listed under <strong style={{ color: '#E8850C' }}>"Notes"</strong> are not included and may be available as upgrades.
      </div>

      {INCLUSIONS.map((section) => (
        <div key={section.id} style={{ padding: '24px 50px', borderBottom: '1px solid #e5e5e5' }}>
          <h2 style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '15px', color: '#1a1a2e', marginBottom: '14px', paddingBottom: '6px', borderBottom: '2px solid #E8850C', display: 'inline-block' }}>
            {section.title}
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <tbody>
              {section.items.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 0', width: '24px', verticalAlign: 'top' }}>
                    <span style={{ color: '#22c55e', fontSize: '13px' }}>{'\u2713'}</span>
                  </td>
                  <td style={{ padding: '6px 0', color: '#333' }}>{item}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {section.notes && section.notes.length > 0 && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: '#fff8f0', border: '1px solid #fde8cc' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: '#E8850C', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '6px' }}>Notes & Exclusions</div>
              {section.notes.map((note, i) => (
                <div key={i} style={{ fontSize: '10px', color: '#888', lineHeight: '1.5', paddingLeft: '12px', position: 'relative', marginBottom: '3px' }}>
                  <span style={{ position: 'absolute', left: 0, color: '#E8850C' }}>{'\u2022'}</span>
                  {note}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ padding: '24px 50px', borderTop: '2px solid #e5e5e5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '9px', color: '#aaa' }}>Nationwide Projects Investments Pty Ltd | ABN XX XXX XXX XXX</div>
        <div style={{ fontSize: '9px', color: '#E8850C' }}>Confidential</div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────
export default function Inclusions() {
  const [activeSection, setActiveSection] = useState(null)
  const [generating, setGenerating] = useState(false)
  const pdfRef = useRef(null)

  const toggleSection = (id) => setActiveSection(activeSection === id ? null : id)
  const expandAll = () => setActiveSection('__all__')
  const collapseAll = () => setActiveSection(null)
  const isSectionOpen = (id) => activeSection === '__all__' || activeSection === id

  const downloadPDF = async () => {
    if (!pdfRef.current) return
    setGenerating(true)
    try {
      const element = pdfRef.current
      element.style.left = '0'
      element.style.position = 'fixed'
      element.style.top = '0'
      element.style.zIndex = '-1'
      await new Promise(r => setTimeout(r, 200))
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 794 })
      element.style.position = 'absolute'
      element.style.left = '-9999px'
      element.style.zIndex = ''
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const ratio = pdfWidth / (canvas.width / 2)
      const totalPdfHeight = (canvas.height / 2) * ratio
      let heightLeft = totalPdfHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight)
      heightLeft -= pdfHeight
      while (heightLeft > 0) {
        position = -(totalPdfHeight - heightLeft)
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalPdfHeight)
        heightLeft -= pdfHeight
      }
      pdf.save('NPI-Base-Inclusion-Schedule.pdf')
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="bg-void">
      <InclusionsPDF pdfRef={pdfRef} />

      {/* Hero */}
      <section className="relative min-h-[50vh] md:min-h-[60vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&h=1080&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/70 to-void/30" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 pb-16 pt-28 md:pb-20 md:pt-40">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-amber" />
            <span className="text-amber text-xs font-semibold tracking-[0.3em] uppercase">Section A</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95] mb-6">
            Base Inclusion<br /><span className="text-amber">Schedule</span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mb-8">
            A comprehensive overview of all standard inclusions provided with your new home build by Nationwide Projects Investments.
          </p>
          <button onClick={downloadPDF} disabled={generating} className="inline-flex items-center gap-3 px-8 py-4 bg-amber text-white font-semibold tracking-wider uppercase text-sm hover:bg-amber-light transition-all duration-300 hover:shadow-lg hover:shadow-amber/20 disabled:opacity-50">
            {generating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Generating PDF...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>Download PDF</>
            )}
          </button>
        </div>
      </section>

      {/* Controls */}
      <section className="border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            <span className="text-amber font-semibold">{INCLUSIONS.length}</span> sections &middot;{' '}
            <span className="text-amber font-semibold">{INCLUSIONS.reduce((sum, s) => sum + s.items.length, 0)}</span> included items
          </p>
          <div className="flex gap-3">
            <button onClick={expandAll} className="px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white/50 border border-white/10 hover:border-amber/30 hover:text-amber transition-all duration-300">Expand All</button>
            <button onClick={collapseAll} className="px-4 py-2 text-xs font-semibold tracking-wider uppercase text-white/50 border border-white/10 hover:border-amber/30 hover:text-amber transition-all duration-300">Collapse All</button>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="space-y-4">
            {INCLUSIONS.map((section, index) => (
              <ScrollReveal key={section.id} delay={index * 0.03}>
                <div className="border border-white/5 hover:border-white/10 transition-all duration-300">
                  <button onClick={() => toggleSection(section.id)} className="w-full flex items-center gap-4 px-6 lg:px-8 py-5 text-left group">
                    <div className={`flex items-center justify-center w-10 h-10 transition-colors duration-300 ${isSectionOpen(section.id) ? 'bg-amber text-white' : 'bg-white/5 text-white/40 group-hover:text-amber'}`}>
                      {checkIcon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-lg md:text-xl text-white group-hover:text-amber transition-colors duration-300">{section.title}</h3>
                      <p className="text-white/30 text-xs mt-0.5">
                        {section.items.length} items included
                        {section.notes && section.notes.length > 0 && <span> &middot; {section.notes.length} notes</span>}
                      </p>
                    </div>
                    <div className={`text-white/30 transition-transform duration-300 ${isSectionOpen(section.id) ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
                    </div>
                  </button>
                  <AnimatePresence>
                    {isSectionOpen(section.id) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
                        <div className="px-6 lg:px-8 pb-6 lg:pb-8 border-t border-white/5">
                          <div className="mt-6">
                            <div className="flex items-center gap-2 mb-4">
                              <div className="w-2 h-2 bg-green-500 rounded-full" />
                              <span className="text-green-400 text-xs font-semibold tracking-[0.15em] uppercase">Included</span>
                            </div>
                            <div className="grid gap-2">
                              {section.items.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-white/[0.02] border border-white/5">
                                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                  <span className="text-white/70 text-sm leading-relaxed">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {section.notes && section.notes.length > 0 && (
                            <div className="mt-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-2 h-2 bg-amber rounded-full" />
                                <span className="text-amber text-xs font-semibold tracking-[0.15em] uppercase">Notes & Exclusions</span>
                              </div>
                              <div className="bg-amber/5 border border-amber/10 p-5">
                                <div className="grid gap-2">
                                  {section.notes.map((note, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                      <svg className="w-3.5 h-3.5 text-amber shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                      <span className="text-white/40 text-sm leading-relaxed">{note}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Terms */}
      <section className="border-t border-white/5 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <ScrollReveal>
            <div className="border border-amber/20 bg-amber/5 p-8 lg:p-12">
              <div className="flex items-center gap-3 mb-6"><div className="w-12 h-px bg-amber" /><span className="text-amber text-xs font-semibold tracking-[0.3em] uppercase">Important</span></div>
              <h2 className="font-display text-2xl md:text-3xl text-white mb-6">Terms & Conditions</h2>
              <div className="grid md:grid-cols-2 gap-6 text-white/40 text-sm leading-relaxed">
                <div className="space-y-4">
                  <p>By accepting this quote by email, printout or any other medium, the owner/client acknowledges the acceptance of the Terms & Conditions of this quote.</p>
                  <p>All communication must be done through email without any exception. Verbal, SMS, WhatsApp, Messenger, telephonic or any other communication is not accepted.</p>
                </div>
                <div className="space-y-4">
                  <p>All invoices are subject to be payable in 7 working days from date of invoice.</p>
                  <p>Any additional feature or change required by the developer will be raised as a variation, which may include corner lot treatments, added eaves, increased roof pitch, facade features, and landscaping requirements.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display text-3xl md:text-4xl text-white mb-4">Ready to Customise <span className="text-amber">Your Build?</span></h2>
            <p className="text-white/40 text-lg mb-8 max-w-xl mx-auto">Use our interactive estimator to select your upgrades and generate a detailed specification sheet.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/estimator" className="px-10 py-4 bg-amber text-white font-semibold tracking-wider uppercase text-sm hover:bg-amber-light transition-all duration-300 hover:shadow-lg hover:shadow-amber/20">Open Estimator</a>
              <a href="/contact" className="px-10 py-4 border border-white/20 text-white/70 font-semibold tracking-wider uppercase text-sm hover:border-amber hover:text-amber transition-all duration-300">Contact Us</a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
