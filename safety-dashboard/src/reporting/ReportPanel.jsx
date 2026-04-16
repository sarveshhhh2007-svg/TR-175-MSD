import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Upload, MapPin, Crosshair, CheckCircle, Loader2, TriangleAlert } from 'lucide-react';
import { ref as dbRef, set } from 'firebase/database';
import { rtdb } from '../firebase';
import { useReporting } from './ReportingContext';
import { resizeImage, blobToBase64, fileToDataUrl } from './imageUtils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CATEGORIES = [
  'Pothole',
  'No street lighting',
  'Poor visibility',
  'Sharp turn',
  'No reflectors',
  'Unsafe junction',
  'Over-speeding zone',
  'Slippery road',
];

const MAX_WORDS = 50;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function wordCount(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function genId() {
  return `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ReportPanel() {
  const {
    isPanelOpen, closePanel,
    pickedLocation, setPickedLocation,
    startLocationPick,
  } = useReporting();

  // Form state
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories,   setCategories]   = useState([]);
  const [description,  setDescription]  = useState('');
  const [locSource,    setLocSource]    = useState(null); // 'gps' | 'map' | null

  // Submit state
  const [status,  setStatus]  = useState('idle'); // idle | uploading | success | error
  const [errMsg,  setErrMsg]  = useState('');

  const fileInputRef = useRef(null);

  // ── GPS auto-fetch on panel open ────────────────────────────────────────
  useEffect(() => {
    if (!isPanelOpen) return;
    if (pickedLocation) { setLocSource('map'); return; }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPickedLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocSource('gps');
        },
        () => { /* silently fail — user can pick on map */ }
      );
    }
  }, [isPanelOpen]); // eslint-disable-line

  // ── Reset on close ─────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setCategories([]);
    setDescription('');
    setPickedLocation(null);
    setLocSource(null);
    setStatus('idle');
    setErrMsg('');
  }, [setPickedLocation]);

  const handleClose = useCallback(() => {
    reset();
    closePanel();
  }, [reset, closePanel]);

  // Successful submit auto-close after 2 s
  useEffect(() => {
    if (status === 'success') {
      const t = setTimeout(() => { reset(); closePanel(); }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, reset, closePanel]);

  // ── Image pick ─────────────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = await fileToDataUrl(file);
    setImagePreview(preview);
    setImageFile(file);
  };

  // ── Category toggle ────────────────────────────────────────────────────
  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Description word-guard ─────────────────────────────────────────────
  const handleDescChange = (e) => {
    const text = e.target.value;
    if (wordCount(text) <= MAX_WORDS) setDescription(text);
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile)       { setErrMsg('Please attach an image.');         return; }
    if (categories.length === 0) { setErrMsg('Select at least one issue.'); return; }
    if (!pickedLocation)  { setErrMsg('Location is required.');           return; }

    setStatus('uploading');
    setErrMsg('');

    try {
      // 1. Resize image client-side → guaranteed < 1 MB
      const blob = await resizeImage(imageFile);

      // 2. Convert to base64 data-URL (free alternative to Firebase Storage)
      const imageUrl = await blobToBase64(blob);

      // 3. Write everything to RTDB /user_reports
      const reportId  = genId();
      const reportRef = dbRef(rtdb, `user_reports/${reportId}`);
      await set(reportRef, {
        reportId,
        imageUrl,          // base64 data-URL stored directly in RTDB
        description: description.trim(),
        categories,
        lat:         pickedLocation.lat,
        lng:         pickedLocation.lng,
        timestamp:   Date.now(),
        status:      'active',
      });

      setStatus('success');
    } catch (err) {
      console.error('[ReportPanel] submit error:', err);
      setErrMsg(err.message || 'Upload failed. Check Storage rules.');
      setStatus('error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  const words   = wordCount(description);
  const canSubmit = imageFile && categories.length > 0 && pickedLocation && status === 'idle';

  return (
    <>
      {/* Overlay */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`
          fixed top-0 right-0 z-[1000] h-full w-full max-w-md
          bg-slate-900 border-l border-slate-700/60
          shadow-2xl flex flex-col
          transition-transform duration-300 ease-in-out
          ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Panel Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <TriangleAlert className="w-5 h-5 text-orange-400" />
            <h2 className="text-white font-bold text-lg">Report a Hazard</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Success State ── */}
        {status === 'success' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <CheckCircle className="w-16 h-16 text-emerald-400" />
            <p className="text-white font-bold text-xl">Report Submitted!</p>
            <p className="text-slate-400 text-sm text-center">
              Your report is now live on the map. Thank you for making the roads safer.
            </p>
          </div>
        )}

        {/* ── Form ── */}
        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

            {/* Image upload */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                📷 Photo <span className="text-red-400">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              {!imagePreview ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    w-full h-36 rounded-xl border-2 border-dashed border-slate-600
                    hover:border-orange-500/70 bg-slate-800/50 hover:bg-slate-800
                    flex flex-col items-center justify-center gap-2
                    text-slate-400 hover:text-orange-400 transition-all cursor-pointer
                  "
                >
                  <Upload className="w-7 h-7" />
                  <span className="text-sm font-medium">Tap to upload / take photo</span>
                  <span className="text-xs text-slate-500">Auto-resized to &lt; 1 MB</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-slate-700">
                  <img src={imagePreview} alt="Preview" className="w-full object-cover max-h-48" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Issue categories */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                🚨 Issue Type <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => {
                  const active = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`
                        text-left px-3 py-2 rounded-lg border text-xs font-semibold transition-all
                        ${active
                          ? 'bg-orange-500/20 border-orange-500/70 text-orange-300'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                        }
                      `}
                    >
                      {active && <span className="mr-1">✓</span>}{cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                📝 Description
                <span className="ml-2 text-slate-500 font-normal text-xs">({words}/{MAX_WORDS} words)</span>
              </label>
              <textarea
                value={description}
                onChange={handleDescChange}
                rows={3}
                placeholder="Briefly describe the hazard…"
                className="
                  w-full bg-slate-800 border border-slate-700 rounded-lg
                  text-slate-200 placeholder-slate-500 text-sm
                  px-3 py-2 resize-none
                  focus:outline-none focus:border-orange-500/70 focus:ring-1 focus:ring-orange-500/30
                  transition-colors
                "
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2">
                📍 Location <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm">
                  {pickedLocation ? (
                    <span className="text-emerald-400 font-mono text-xs">
                      {locSource === 'gps' ? '🛰 GPS: ' : '🗺 Map: '}
                      {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                    </span>
                  ) : (
                    <span className="text-slate-500 text-xs">Fetching GPS…</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={startLocationPick}
                  title="Pick location on map"
                  className="
                    shrink-0 p-2.5 rounded-lg
                    bg-slate-800 border border-slate-700
                    text-slate-400 hover:text-orange-400 hover:border-orange-500/60
                    transition-colors
                  "
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
              {!pickedLocation && (
                <p className="text-slate-500 text-xs mt-1">
                  Or click the crosshair icon to pick a point on the map.
                </p>
              )}
            </div>

            {/* Error */}
            {errMsg && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-3 py-2 text-red-400 text-sm">
                ⚠ {errMsg}
              </div>
            )}

            {/* Submit */}
            <div className="pb-4 mt-auto shrink-0">
              <button
                type="submit"
                disabled={!canSubmit}
                className="
                  w-full py-3 rounded-xl font-bold text-sm
                  bg-gradient-to-r from-orange-500 to-orange-600
                  text-white shadow-lg
                  hover:from-orange-400 hover:to-orange-500
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all active:scale-98
                  flex items-center justify-center gap-2
                "
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <TriangleAlert className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
