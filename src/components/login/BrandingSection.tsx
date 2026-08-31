import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { ShieldCheck, Cpu, Layers, CheckCircle2, Zap } from 'lucide-react';

export const BrandingSection: React.FC = () => {
  return (
    <aside
      className="hidden lg:flex lg:w-1/2 xl:w-7/12 relative flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#0f1014] to-[#0a0a0b] text-slate-200 overflow-hidden select-none border-r border-white/5"
      aria-label="Alfa Digi ERP Branding & Information"
      id="branding-section"
    >
      {/* Abstract Background Element - Glowing Rings */}
      <div className="abstract-ring w-[600px] h-[600px] -top-20 -left-40" aria-hidden="true" />
      <div className="abstract-ring w-[400px] h-[400px] top-48 -left-20 opacity-50" aria-hidden="true" />
      <div className="abstract-ring w-[800px] h-[800px] -bottom-48 -right-48 opacity-30" aria-hidden="true" />

      {/* Subtle Ambient Radial Glows */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header: Enterprise Logo & Security Badge */}
      <div className="relative z-10 flex items-center justify-between">
        <BrandLogo size="lg" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-medium backdrop-blur-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Enterprise Secure v2.4</span>
        </div>
      </div>

      {/* Center Body: Headline, Tagline, & Clean CSS/SVG Abstract Enterprise Architecture Graphic */}
      <div className="relative z-10 my-auto py-8">
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Next-Gen Enterprise Suite</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-tight text-white">
            Smart Business<br />
            <span className="text-indigo-500">Management.</span>
          </h1>

          <p className="text-base xl:text-lg text-slate-400 max-w-md leading-relaxed">
            Streamlining workforce automation, human capital workflows, and enterprise resources for the modern era.
          </p>
        </div>

        {/* Abstract Business / Technology Visual Graphic (Pure CSS & Glass Shapes) */}
        <div className="mt-8 relative max-w-lg" id="enterprise-abstract-visual">
          <div className="relative rounded-2xl bg-white/[0.02] border border-white/10 p-5 shadow-2xl backdrop-blur-md">
            {/* Header of Simulated Live Operations Card */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5 text-xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold text-slate-200">Enterprise Engine Active</span>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">SOC-2 Type II Verified</span>
            </div>

            {/* Geometric Node Flow & Metric Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Workforce</span>
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-white">99.98%</div>
                  <div className="text-[10px] text-emerald-400 font-medium">Continuous Uptime</div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Domains</span>
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-white">4 Leads</div>
                  <div className="text-[10px] text-sky-300 font-medium">Synchronized</div>
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-medium">Latency</span>
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="mt-2">
                  <div className="text-base font-bold text-white">&lt; 15ms</div>
                  <div className="text-[10px] text-indigo-300 font-medium">Zero-Trust RBAC</div>
                </div>
              </div>
            </div>

            {/* Abstract System Architecture Vector Nodes */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span>Unified Ecosystem Security</span>
                <span className="text-indigo-400 font-medium">Protected State</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden flex">
                <div className="bg-indigo-500 h-full w-2/5" />
                <div className="bg-sky-400 h-full w-1/4" />
                <div className="bg-emerald-400 h-full w-1/3" />
                <div className="bg-purple-400 h-full w-1/12" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Checkpoints */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Multi-Role Access Control</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Audited SSO &amp; Auth</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>256-bit AES Encryption</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer: Social Proof & Legal Notice */}
      <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
        <div className="flex items-center space-x-3">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full border-2 border-[#0a0a0b] bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200">
              AW
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-[#0a0a0b] bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-200">
              EV
            </div>
            <div className="w-7 h-7 rounded-full border-2 border-[#0a0a0b] bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              500+
            </div>
          </div>
          <span className="text-slate-400 font-medium">Trusted by 500+ global enterprises</span>
        </div>

        <div>&copy; {new Date().getFullYear()} Alfa Digi Corp.</div>
      </div>
    </aside>
  );
};

