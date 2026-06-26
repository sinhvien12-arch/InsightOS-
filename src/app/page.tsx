'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ChevronRight, BarChart3, Zap, Shield, Users } from 'lucide-react';
import { useLang } from '@/lib/LangContext';

export default function LandingPage() {
  const router = useRouter();
  const { lang, setLang } = useLang();
  const [mounted, setMounted] = useState(false);
  const vi = lang === 'vi';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-slate-900">InsightOS</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['en', 'vi'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-all ${
                    lang === l ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="text-sm text-slate-600">by Phê La Coffee</div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-full px-4 py-2">
              <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                ✨ AI-Powered Intelligence
              </span>
              <ChevronRight className="w-4 h-4 text-teal-600" />
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              {vi ? 'Phân tích phản hồi,' : 'Customer Feedback,'}
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                {vi ? 'Tức thì & Thông minh' : 'Instantly Analyzed'}
              </span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              {vi
                ? 'Tải lên dữ liệu CSV và nhận phân tích AI về khách hàng của bạn. Phát hiện vấn đề, theo dõi cải thiện, ra quyết định dựa trên dữ liệu.'
                : 'Upload CSV data and get AI-powered insights about your customers. Identify issues, track improvements, and make data-driven decisions.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={() => router.push('/demo')}
                className="group relative px-8 py-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:shadow-teal-600/30 active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <span>{vi ? 'Xem Demo' : 'View Demo'}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              <button
                onClick={() => router.push('/auth/signin')}
                className="px-8 py-4 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:border-teal-600 hover:text-teal-600 hover:bg-teal-50 transition-all active:scale-95"
              >
                {vi ? 'Đăng nhập Google' : 'Sign In with Google'}
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex justify-center items-center gap-2 text-sm text-slate-600">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>{vi ? 'Bảo mật • Không cần thẻ tín dụng' : 'Secure • No credit card required'}</span>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-20 grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: vi ? 'Phân tích tức thì' : 'Instant Analytics',
                description: vi ? 'Phân tích cảm xúc và phát hiện vấn đề tự động từ dữ liệu của bạn' : 'Automatic sentiment analysis and issue detection from your data'
              },
              {
                icon: Zap,
                title: vi ? 'Thiết lập nhanh' : 'Fast Setup',
                description: vi ? 'Tải lên CSV, nhận kết quả trong vài giây. Không cần cấu hình phức tạp.' : 'Upload CSV, get insights in seconds. No complex configuration.'
              },
              {
                icon: Users,
                title: vi ? 'Quyết định dựa dữ liệu' : 'Data Driven',
                description: vi ? 'Ra quyết định tốt hơn dựa trên phân tích phản hồi thực tế của khách hàng' : 'Make better decisions backed by real customer feedback analysis'
              }
            ].map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="group p-8 bg-white rounded-xl border border-slate-200 hover:border-teal-200 hover:shadow-lg transition-all hover:shadow-teal-100"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-600 text-sm">
            © 2026 InsightOS • Customer Experience Intelligence for Phê La Coffee
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Built with modern web technologies • Secure Supabase database
          </p>
        </div>
      </div>
    </div>
  );
}