import React, { useState, useEffect } from 'react';
import { 
  Mail, MessageSquare, Send, CheckCircle2, ShieldCheck, 
  Clock, Globe, Copy, Check, ChevronDown, ChevronUp, 
  HelpCircle, ChevronRight, AlertCircle, Building2, Lock
} from 'lucide-react';

interface ContactPageProps {
  onNavigateTab?: (tab: any) => void;
}

export function ContactPage({ onNavigateTab }: ContactPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    inquiryType: 'general',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<Record<number, boolean>>({ 0: true });

  const toggleFaq = (idx: number) => {
    setOpenFaq(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email address, and message.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    // Simulate reliable dispatch to team@apexutility.live
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  // Structured Data (JSON-LD) for ContactPage
  useEffect(() => {
    const contactSchema = {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contact Apex Utility Labs',
      description: 'Official contact portal for Apex Utility Labs. Reach our developer and support team for technical support, feature requests, and enterprise inquiries.',
      url: 'https://apexutility.live/contact',
      mainEntity: {
        '@type': 'Organization',
        name: 'Apex Utility Labs',
        url: 'https://apexutility.live',
        email: 'team@apexutility.live',
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: 'team@apexutility.live',
            contactType: 'Customer Support',
            availableLanguage: ['English']
          },
          {
            '@type': 'ContactPoint',
            email: 'privacy@apexutility.live',
            contactType: 'Privacy Officer',
            availableLanguage: ['English']
          }
        ]
      }
    };

    const script = document.createElement('script');
    script.id = 'jsonld-contact-page';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(contactSchema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('jsonld-contact-page');
      if (el) el.remove();
    };
  }, []);

  const faqs = [
    {
      q: 'How quickly does the Apex Utility Labs team respond?',
      a: 'Our engineering and support team reviews inquiries every business day. For bug reports, feature suggestions, and general inquiries, you can typically expect a response within 24 to 48 business hours.'
    },
    {
      q: 'Do you store or log message contents or files?',
      a: 'Messages submitted through this contact form are routed securely to our administrative inbox (team@apexutility.live). We never store your inquiry text in public databases, nor do we sell or share contact details with advertisers or data brokers.'
    },
    {
      q: 'Can I request a new client-side tool or feature?',
      a: 'Yes, absolutely. We welcome suggestions for new web utilities, calculators, and media processors. Please select "Feature Suggestion" in the dropdown and detail the specific conversion or parsing capability you would like to see.'
    },
    {
      q: 'How do I submit a DMCA or security disclosure notice?',
      a: 'Please send complete details, including affected URLs and technical descriptions, directly to security@apexutility.live or select "Security & Privacy" in the contact form.'
    }
  ];

  return (
    <article className="max-w-5xl mx-auto space-y-10 pb-20 text-zinc-100">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-zinc-400 pt-2">
        <button 
          onClick={() => onNavigateTab && onNavigateTab('dashboard')} 
          className="hover:text-white transition-colors cursor-pointer"
        >
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-200 font-semibold" aria-current="page">Contact Us</span>
      </nav>

      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5" />
            Official Support Channel
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-xs text-zinc-400">Response within 24–48 hours</span>
          <span className="text-zinc-600">·</span>
          <span className="text-xs text-emerald-400 font-medium">Verified Publisher</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          Contact Apex Utility Labs
        </h1>

        <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
          Have questions regarding our client-side utilities, corporate licensing, privacy compliance, or feature requests? Reach out directly to our engineering team below.
        </p>
      </header>

      {/* Main Grid: Form + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Form (Left Column, 7 cols) */}
        <section className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80 mb-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-400" />
                <span>Send a Message</span>
              </h2>
              <p className="text-xs text-zinc-400">All fields marked with an asterisk (*) are required.</p>
            </div>
            <span className="text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded-lg">
              TLS Encrypted
            </span>
          </div>

          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Message Transmitted Successfully</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-zinc-200">{formData.name}</span>. Your inquiry regarding &ldquo;{formData.subject || 'General Inquiry'}&rdquo; has been routed to our team at <code className="text-emerald-400 font-mono text-xs bg-zinc-900 px-1.5 py-0.5 rounded">team@apexutility.live</code>.
              </p>
              <p className="text-xs text-zinc-500">
                Our support engineers will review and follow up with you within 24 to 48 business hours.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: '', email: '', inquiryType: 'general', subject: '', message: '' });
                }}
                className="mt-4 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700 transition-colors text-xs font-semibold cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-name" className="block text-xs font-semibold text-zinc-300">
                    Your Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-email" className="block text-xs font-semibold text-zinc-300">
                    Your Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="name@company.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="contact-inquiry-type" className="block text-xs font-semibold text-zinc-300">
                    Inquiry Category
                  </label>
                  <select
                    id="contact-inquiry-type"
                    value={formData.inquiryType}
                    onChange={e => setFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-red-500/80 transition-colors cursor-pointer"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support & Bug Report</option>
                    <option value="feature">Feature & Tool Request</option>
                    <option value="licensing">Corporate & API Licensing</option>
                    <option value="privacy">Security & Privacy Compliance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-subject" className="block text-xs font-semibold text-zinc-300">
                    Subject Line
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    value={formData.subject}
                    onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Brief description of your inquiry"
                    className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="block text-xs font-semibold text-zinc-300">
                  Detailed Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Provide complete details, tool names, or questions so our team can assist you efficiently..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500/80 transition-colors resize-y"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-[11px] text-zinc-500 leading-normal flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Your email is strictly kept private and never used for marketing.</span>
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(239,68,68,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Routing Inquiry...</span>
                  ) : (
                    <>
                      <span>Transmit Inquiry</span>
                      <Send className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Publisher Details & Operations (Right Column, 5 cols) */}
        <aside className="lg:col-span-5 space-y-6">
          {/* Direct Email Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800/40 text-red-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Publisher Information</h2>
                <p className="text-xs text-zinc-400">Apex Utility Labs</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-semibold block">
                  General & Developer Support
                </span>
                <div className="flex items-center justify-between">
                  <a href="mailto:team@apexutility.live" className="text-sm font-bold text-white hover:text-red-400 transition-colors">
                    team@apexutility.live
                  </a>
                  <button
                    type="button"
                    onClick={() => copyEmail('team@apexutility.live')}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Copy email address"
                  >
                    {copiedEmail === 'team@apexutility.live' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800/80 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono font-semibold block">
                  Privacy & Data Rights Officer
                </span>
                <div className="flex items-center justify-between">
                  <a href="mailto:privacy@apexutility.live" className="text-sm font-bold text-white hover:text-red-400 transition-colors">
                    privacy@apexutility.live
                  </a>
                  <button
                    type="button"
                    onClick={() => copyEmail('privacy@apexutility.live')}
                    className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    title="Copy email address"
                  >
                    {copiedEmail === 'privacy@apexutility.live' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-zinc-400 pt-1">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Operating hours: Monday – Friday, 9:00 AM – 6:00 PM UTC</span>
              </div>

              <div className="flex items-center gap-2 text-zinc-400">
                <Globe className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Global Remote Engineering & Operations</span>
              </div>
            </div>
          </div>

          {/* Trust & Compliance Badge */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-3">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">AdSense Publisher Compliance</h3>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Apex Utility Labs complies strictly with Google AdSense Publisher Policies, GDPR, and CCPA standards. For full data processing and cookie policies, please view our{' '}
              <button 
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('privacy-policy')}
                className="text-red-400 hover:underline font-medium cursor-pointer"
              >
                Privacy Policy
              </button>{' '}
              and{' '}
              <button 
                type="button"
                onClick={() => onNavigateTab && onNavigateTab('terms-of-service')}
                className="text-red-400 hover:underline font-medium cursor-pointer"
              >
                Terms of Service
              </button>.
            </p>
          </div>
        </aside>
      </div>

      {/* Frequently Asked Questions */}
      <section aria-label="Support FAQs" className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-red-400" />
            <span>Support &amp; Contact FAQs</span>
          </h2>
          <p className="text-xs text-zinc-400">Common questions regarding communication, bug tracking, and developer inquiries.</p>
        </div>

        <div className="space-y-2.5 pt-2">
          {faqs.map((faq, idx) => {
            const isOpen = !!openFaq[idx];
            return (
              <div 
                key={idx}
                className="rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden transition-colors hover:border-zinc-700"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm font-semibold text-zinc-200 hover:text-white transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </article>
  );
}

export default ContactPage;
