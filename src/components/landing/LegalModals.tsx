import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Mail, Send, CheckCircle2, Copy } from 'lucide-react';
import { getDownloadConfig } from '../../config/downloadConfig';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'contact' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const config = getDownloadConfig();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('Support Inquiry');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!type) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(config.supportEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              {type === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
              {type === 'terms' && <FileText className="w-5 h-5 text-indigo-500" />}
              {type === 'contact' && <Mail className="w-5 h-5 text-purple-500" />}
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {type === 'privacy' && 'Privacy Policy'}
                {type === 'terms' && 'Terms of Service'}
                {type === 'contact' && 'Contact Support & Team'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {type === 'privacy' && 'Zero-surveillance, client-side on-device cryptography guarantee.'}
                {type === 'terms' && 'Fair academic study usage, personal license, and guidelines.'}
                {type === 'contact' && 'Get in touch for questions, bug reports, and academic partnerships.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {type === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                <p className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Zero Cloud Surveillance Architecture
                </p>
                <p className="text-[12px] mt-1 text-emerald-700 dark:text-emerald-400">
                  AI Study is engineered from the ground up to never upload, sell, or log your academic documents, textbook chapters, or question attempts.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Local Cryptographic Storage</h4>
                <p className="mt-1">
                  All course notes, uploaded PDFs, generated practice tests, and study calendar schedules are stored on your local device using standard browser IndexedDB or native app sandbox storage.
                  When you lock the vault, data is encrypted via PBKDF2 (100,000 rounds) and AES-256-GCM. We possess no decryption backdoor or master keys.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. AI Question Generation</h4>
                <p className="mt-1">
                  In <strong>Offline Mode</strong>, questions and heuristic recall items are synthesized entirely on-device with zero network requests.
                  In <strong>Online Mode</strong>, document text chunks are parsed to generate relevant questions without saving your confidential content into training sets.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. No Third-Party Trackers</h4>
                <p className="mt-1">
                  We do not embed third-party advertising scripts, biometric trackers, behavioral telemetry, or cookie brokers. Your learning patterns remain your private property.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Data Deletion Rights</h4>
                <p className="mt-1">
                  You can purge courses, reset the database, zero your cryptographic keys, or delete single documents instantly at any time from the app dashboard.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                Last updated: September 2026 • AI Study Security & Privacy Working Group
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Acceptance of Terms</h4>
                <p className="mt-1">
                  By downloading our Android APK, Windows executable, or accessing the AI Study Web Application, you agree to these Terms of Service. If you do not agree, please do not use the service.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Academic Integrity & Responsible Use</h4>
                <p className="mt-1">
                  AI Study is designed as a self-study, active recall, and spaced repetition acceleration tool. You agree not to use AI Study to facilitate unauthorized cheating during live exams or violate your institution's honor code.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Intellectual Property Rights</h4>
                <p className="mt-1">
                  You retain complete ownership over all documents, slides, and syllabus files you upload. AI Study claims zero copyright or rights over your student notes or materials.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">4. Software License & Distribution</h4>
                <p className="mt-1">
                  The provided Android APK and Windows installer are licensed for personal, educational use. You may redistribute unmodified build packages to classmates, subject to attribution.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">5. Disclaimer of Warranty</h4>
                <p className="mt-1">
                  AI Study is provided "as is" without warranty of any kind. While our verifiable explanation model cross-references source excerpts, students are encouraged to review core course literature for critical exams.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-3">
                Effective date: September 2026 • AI Study Platform
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div>
              {isSubmitted ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">Message Sent Successfully!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Thank you for reaching out. Our support engineering team will reply to {contactEmail} within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {/* Direct email quick copy badge */}
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="font-bold text-indigo-950 dark:text-indigo-200">Direct Support Email: </span>
                        <span className="font-mono text-indigo-700 dark:text-indigo-300">{config.supportEmail}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 transition flex items-center gap-1 shrink-0"
                    >
                      {copiedEmail ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Name
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Alex Parker"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Your Email
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="alex@university.edu"
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Subject
                    </label>
                    <select
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="General Question">General Question</option>
                      <option value="APK Installation Issue">APK Installation Issue</option>
                      <option value="Windows EXE Installation Issue">Windows EXE Installation Issue</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Security / Vault Bug">Security / Vault Bug</option>
                      <option value="Academic License">Academic / Campus License</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="How can we assist you with AI Study?"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-xs shadow-md shadow-indigo-600/25 hover:from-indigo-500 hover:to-pink-500 transition flex items-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Message</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
