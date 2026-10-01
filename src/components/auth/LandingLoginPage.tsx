import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PERSONAS_LIST, PERSONA_CREDENTIALS, PRIMARY_TIER_PERSONAS, PersonaCredential } from '../../data/credentials';
import { UserRole } from '../../types';

export const LandingLoginPage: React.FC = () => {
  const { login, quickLoginAsRole } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'personas'>('form');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg('Please enter both your credentials (email/username and password).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      const result = login(identifier, password, rememberMe);
      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.error || 'Authentication rejected. Verify credentials or use quick-fill below.');
      }
    }, 450);
  };

  const handleFillCredentials = (persona: PersonaCredential) => {
    setIdentifier(persona.email);
    setPassword(persona.password);
    setErrorMsg(null);
    setActiveTab('form');
  };

  const handleQuickSignIn = (role: UserRole) => {
    setIsLoading(true);
    setTimeout(() => {
      quickLoginAsRole(role);
      setIsLoading(false);
    }, 350);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Glows & Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <span className="material-symbols-outlined text-white text-xl" data-icon="lock_reset">
              lock_reset
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wider text-white uppercase font-sans">
                APEX FISCAL
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/80 font-semibold">
                SpendGuard L4 Core
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:block">
              Corporate Spend Governance & Real-Time Budget Enforcement
            </span>
          </div>
        </div>

        {/* Live Operational Ticker Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">VAULT: <strong className="text-emerald-400">100% OPERATIONAL</strong></span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">LATENCY: <strong className="text-blue-400">11.8ms</strong></span>
          </div>

          <span className="text-xs font-mono text-slate-400 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-lg">
            SOX 404 / GAAS
          </span>
        </div>
      </header>

      {/* Main Hero & Authentication Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Brand Hero, Value Prop & Live Telemetry (7 Columns on LG) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Deterministic Financial Perimeter Control</span>
            </div>

            {/* Hero Heading */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
                Corporate Spend Control with{' '}
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                  Zero-Latency Governance
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Apex Fiscal enforces sub-15ms deterministic pre-clearance, cryptographic append-only audit ledgers, and strict 5-tier role-based access control across all corporate cost centers.
              </p>
            </div>

            {/* High-Trust Security Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                  <span className="text-[11px] font-mono font-bold uppercase">SOX 404 Ready</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Cryptographic non-repudiation ledger</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <span className="material-symbols-outlined text-base">speed</span>
                  <span className="text-[11px] font-mono font-bold uppercase">&lt; 15ms Latency</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Deterministic pre-clearance gate</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xs col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <span className="material-symbols-outlined text-base">psychology</span>
                  <span className="text-[11px] font-mono font-bold uppercase">Aczen Nova AI</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">Autonomous ledger copilot</p>
              </div>
            </div>

            {/* Live Telemetry Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-slate-800 backdrop-blur-md shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    Live Operational State
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  CONSENSUS REACHED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 text-center sm:text-left">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">ACTIVE ENVELOPES</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-white">372 Cost Centers</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">TREASURY RESERVES</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">₹651.13 Cr</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block">UNHEDGED BREACHES</span>
                  <span className="text-sm sm:text-base font-mono font-bold text-blue-400">0 Critical</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Authentication Portal & Quick-Login Directory (5 Columns on LG) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Navigation Tabs between Standard Login & Persona Directory */}
            <div className="flex items-center gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl max-w-md mx-auto lg:max-w-none">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'form'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-sm">login</span>
                <span>Direct Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('personas')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'personas'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="material-symbols-outlined text-sm">badge</span>
                <span>Demo Personas (5)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  Instant
                </span>
              </button>
            </div>

            {/* TAB 1: Standard Secure Login Card */}
            {activeTab === 'form' && (
              <div className="bg-slate-900/85 border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-white font-sans">
                      Executive Identity Verification
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      TLS 1.3 / AES-256
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Authenticate to access your department's fiscal boundaries and approval workspace.
                  </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                    <span className="material-symbols-outlined text-rose-400 text-lg shrink-0 mt-0.5">
                      error
                    </span>
                    <div className="space-y-1">
                      <span className="font-semibold block">{errorMsg}</span>
                      <span className="text-[11px] text-rose-400 block">
                        Tip: Click the "Demo Personas" tab above to sign in instantly with one click.
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email / Username Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-semibold text-slate-300 block">
                      Executive Email or Username
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                        mail
                      </span>
                      <input
                        type="text"
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="e.g. cfo@apexfiscal.com"
                        className="w-full h-11 bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-xs font-mono pl-10 pr-3 rounded-xl transition-all outline-none placeholder:text-slate-600"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-semibold text-slate-300 block">
                        Authorization Key / Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-mono transition-colors cursor-pointer"
                      >
                        {showPassword ? 'Hide Key' : 'Reveal Key'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                        lock
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrorMsg(null);
                        }}
                        placeholder="e.g. ApexCFO#2026"
                        className="w-full h-11 bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white text-xs font-mono pl-10 pr-10 rounded-xl transition-all outline-none placeholder:text-slate-600"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-400 hover:text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <span>Keep executive session active</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setActiveTab('personas')}
                      className="text-xs text-blue-400 hover:text-blue-300 font-mono hover:underline cursor-pointer"
                    >
                      Need Credentials?
                    </button>
                  </div>

                  {/* Primary CTA Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Security Keys...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-base">verified</span>
                        <span>Sign In to Executive Vault</span>
                      </>
                    )}
                  </button>
                </form>

                {/* 4-Tier Financial Governance Evaluation Shortcut Strip */}
                <div className="pt-3 border-t border-slate-800/80 text-center">
                  <span className="text-[11px] text-slate-400 block mb-2 font-mono font-medium">
                    Financial Governance Hierarchy — 1-Click Persona Access:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {PRIMARY_TIER_PERSONAS.map((p) => (
                      <button
                        key={p.role}
                        type="button"
                        onClick={() => handleQuickSignIn(p.role)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-[10px] font-mono transition-all cursor-pointer border border-slate-700/80 hover:border-slate-500 flex flex-col items-center gap-0.5 active:scale-95 shadow-sm"
                        title={`Sign in immediately as Tier ${p.governanceTier}: ${p.name} (${p.title})`}
                      >
                        <span className="font-bold text-amber-400 text-[10px]">Tier {p.governanceTier}</span>
                        <span className="text-[9px] text-slate-400 truncate max-w-[85px]">{p.title.split('/')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Hackathon & Evaluator Persona Directory */}
            {activeTab === 'personas' && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 backdrop-blur-xl space-y-4 max-h-[580px] overflow-y-auto animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-bold text-white font-sans">
                      Governance Hierarchy & Persona Directory
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Explore the 4 isolated authority boundaries, quota caps, and specialized landing workflows.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono font-bold">
                    4 TIERS READY
                  </span>
                </div>

                <div className="space-y-3">
                  {PERSONAS_LIST.map((p) => (
                    <div
                      key={p.role}
                      className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-white truncate">{p.name}</span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-950 text-blue-400 border border-blue-800">
                                {p.badgeLabel}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">{p.title}</span>
                          </div>
                        </div>

                        {/* Instant One-Click Login CTA */}
                        <button
                          type="button"
                          onClick={() => handleQuickSignIn(p.role)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold font-mono transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">bolt</span>
                          <span>Auto-Sign In</span>
                        </button>
                      </div>

                      {/* Credentials Display & Copy Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                          <span className="text-slate-500 text-[10px]">User:</span>
                          <span className="text-slate-300 truncate font-mono text-[10px]">{p.email}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.email, `email_${p.role}`)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer shrink-0"
                            title="Copy email"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {copiedField === `email_${p.role}` ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                          <span className="text-slate-500 text-[10px]">Key:</span>
                          <span className="text-amber-300 font-mono text-[10px] font-bold">{p.password}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.password, `pass_${p.role}`)}
                            className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer shrink-0"
                            title="Copy password"
                          >
                            <span className="material-symbols-outlined text-[13px]">
                              {copiedField === `pass_${p.role}` ? 'check' : 'content_copy'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Target Workspace & Limit Meta */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-900">
                        <div>
                          <span>Lands on: </span>
                          <strong className="text-slate-200">{p.defaultTabLabel.split('/')[0].trim()}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFillCredentials(p)}
                          className="text-blue-400 hover:text-blue-300 underline cursor-pointer"
                        >
                          Fill Form Fields →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Footer Immutable Security Strip */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-sm">shield</span>
          <span>APEX FISCAL SPENDGUARD PROTOCOL · IMMUTABLE CRYPTOGRAPHIC LEDGER</span>
        </div>
        <div>
          <span>SOX 404 / GAAS AUDIT VERIFIED · SUB-15ms DETERMINISTIC ENFORCEMENT</span>
        </div>
      </footer>
    </div>
  );
};
