import React from "react";
import {
  Brain,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Clock,
  MessageSquareHeart,
  ArrowRight,
  ChevronRight,
  Stethoscope
} from "lucide-react";

// ─────────────────────────────────────────────
// CONFIGURABLE VARIABLE — Change this URL to
// point to your preferred AI triage service.
// ─────────────────────────────────────────────
const AI_TRIAGE_URL = "https://www.infermedica.com/";
// ─────────────────────────────────────────────

const featureItems = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Smart Symptom Analysis",
    description: "Describe your symptoms in natural language and receive intelligent health guidance.",
    color: "text-turquoise",
    bg: "bg-teal-50",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Available 24 / 7",
    description: "Get health insights at any time, day or night, from anywhere in the world.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Privacy First",
    description: "Your health data is handled securely and never shared without your consent.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: <Stethoscope className="h-5 w-5" />,
    title: "Clinically Informed",
    description: "AI models trained on medical guidelines to provide responsible suggestions.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

const steps = [
  { step: "01", title: "Click the button below", desc: "You'll be taken to the AI Health Assistant portal." },
  { step: "02", title: "Describe your symptoms", desc: "Tell the AI how you're feeling in your own words." },
  { step: "03", title: "Get guidance", desc: "Receive personalized advice on next steps and care options." },
];

const AISymptomTriage: React.FC = () => {
  const handleOpenAI = () => {
    window.open(AI_TRIAGE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          <span>Patient Dashboard</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-turquoise">AI Symptom Triage</span>
        </div>
        <h1 className="text-2xl font-black text-stormy-teal">AI Symptom Triage</h1>
        <p className="text-slate-500 text-sm mt-1">Describe your symptoms to receive intelligent, AI-powered health guidance.</p>
      </div>

      {/* Hero CTA Card */}
      <div className="relative overflow-hidden rounded-3xl text-white shadow-2xl p-8 md:p-10"
        style={{ background: "linear-gradient(135deg, #086375 0%, #0a8f7a 50%, #1dd3b0 100%)" }}>
        {/* decorative glows */}
        <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* Icon area */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            <div className="h-24 w-24 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div className="flex items-center gap-1.5 bg-green-yellow/20 text-green-yellow px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              AI Powered
            </div>
          </div>

          {/* Text + CTA */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black leading-tight mb-2">
                Talk To AI Health Assistant
              </h2>
              <p className="text-white/75 text-sm leading-relaxed max-w-md">
                Our AI-powered health assistant helps you understand your symptoms, assess severity,
                and suggests whether you need urgent care or home management.
              </p>
            </div>

            <button
              id="ai-triage-open-btn"
              onClick={handleOpenAI}
              className="inline-flex items-center gap-3 bg-white text-stormy-teal font-black text-base px-7 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:bg-green-yellow transition-all duration-200 group"
            >
              <Brain className="h-5 w-5" />
              <span>Talk To AI Health Assistant</span>
              <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <p className="text-white/50 text-xs">
              Opens in a new tab · Powered by{" "}
              <a href={AI_TRIAGE_URL} target="_blank" rel="noopener noreferrer" className="underline text-white/70 hover:text-white">
                {new URL(AI_TRIAGE_URL).hostname}
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
        <div className="p-1.5 bg-amber-100 rounded-lg shrink-0 mt-0.5">
          <MessageSquareHeart className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-black text-amber-700 mb-0.5">Medical Disclaimer</p>
          <p className="text-xs text-amber-600 leading-relaxed">
            The AI health assistant is designed to provide <strong>informational guidance only</strong> and does not replace 
            professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider 
            for medical decisions. If you are experiencing a medical emergency, call emergency services immediately.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div>
        <h2 className="text-lg font-black text-stormy-teal mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-turquoise" />
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div key={s.step} className="relative bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="text-4xl font-black text-slate-100 leading-none mb-3 select-none">{s.step}</div>
              <h3 className="font-black text-stormy-teal text-sm mb-1">{s.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              {s.step !== "03" && (
                <ArrowRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 bg-white rounded-full z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div>
        <h2 className="text-lg font-black text-stormy-teal mb-4">Why Use AI Triage?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featureItems.map((f) => (
            <div key={f.title} className="flex items-start gap-4 bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className={`p-3 rounded-xl ${f.bg} ${f.color} shrink-0`}>{f.icon}</div>
              <div>
                <h3 className="font-bold text-stormy-teal text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom secondary CTA */}
      <div className="bg-gradient-to-r from-stormy-teal to-turquoise rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-white">
          <p className="font-black text-base">Ready to speak with the AI?</p>
          <p className="text-white/70 text-xs">Your personalised health assistant is just one click away.</p>
        </div>
        <button
          onClick={handleOpenAI}
          className="flex items-center gap-2 bg-white text-stormy-teal font-black px-5 py-2.5 rounded-xl text-sm whitespace-nowrap hover:bg-green-yellow transition-colors"
        >
          <Brain className="h-4 w-4" />
          Open AI Assistant
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </button>
      </div>

    </div>
  );
};

export { AISymptomTriage };
export default AISymptomTriage;
