'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadLayoutProps {
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    headingFont: string;
    bodyFont: string;
  };
  config: {
    title: string;
    message: string;
    companyName: string;
    ctaText: string;
  };
  brandLogo?: string;
  onSubmit: (data: any) => Promise<void>;
}

export function DownloadLayout({ theme, config, brandLogo, onSubmit }: DownloadLayoutProps) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Download link sent to your email!');
    } catch (error) {
      toast.error('Failed to send download link');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="text-center p-8 max-w-md">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: theme.accentColor }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
            Check Your Email!
          </h2>
          <p style={{ color: theme.textColor, fontFamily: theme.bodyFont }}>
            We've sent you a download link at <strong>{formData.email}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: `${theme.primaryColor}20` }}>
        <div className="container mx-auto px-4 py-4">
          {brandLogo ? (
            <img src={brandLogo} alt={config.companyName} className="h-10" />
          ) : (
            <h1 className="text-xl font-bold" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              {config.companyName}
            </h1>
          )}
        </div>
      </header>

      {/* Hero with eBook Preview */}
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* eBook/Guide Preview */}
            <div className="flex justify-center">
              <div className="relative">
                <div
                  className="w-64 h-80 rounded-lg shadow-2xl transform rotate-3 hover:rotate-0 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${theme.backgroundColor}, ${theme.backgroundColor}F0)`,
                    border: `4px solid ${theme.accentColor}`
                  }}
                >
                  <div className="p-6 h-full flex flex-col">
                    <FileText className="w-12 h-12 mb-4" style={{ color: theme.primaryColor }} />
                    <div className="space-y-2 flex-1">
                      <div className="h-2 rounded" style={{ backgroundColor: `${theme.primaryColor}60`, width: '80%' }} />
                      <div className="h-2 rounded" style={{ backgroundColor: `${theme.primaryColor}40`, width: '60%' }} />
                      <div className="h-2 rounded" style={{ backgroundColor: `${theme.primaryColor}30`, width: '70%' }} />
                    </div>
                    <div className="text-xs font-bold mt-auto" style={{ color: theme.primaryColor }}>
                      {config.companyName}
                    </div>
                  </div>
                </div>
                <div
                  className="absolute -bottom-4 -right-4 bg-white px-4 py-2 rounded-full shadow-lg font-bold"
                  style={{ color: theme.accentColor }}
                >
                  FREE
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="text-white">
              <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: theme.headingFont }}>
                {config.title}
              </h2>
              <p className="text-lg mb-6 opacity-90">
                {config.message}
              </p>

              {/* Benefits */}
              <ul className="space-y-3">
                {[
                  'Proven strategies and actionable insights',
                  'Real-world case studies and examples',
                  'Expert tips from industry leaders',
                  'Instant digital download (PDF)'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: theme.accentColor }} />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Email Capture Form */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-xl">
          <Card className="p-8 shadow-lg">
            <div className="text-center mb-6">
              <Download className="w-12 h-12 mx-auto mb-3" style={{ color: theme.accentColor }} />
              <h3 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
                Get Instant Access
              </h3>
              <p className="text-sm" style={{ color: theme.textColor }}>
                Enter your details below to receive your free download link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" style={{ color: theme.secondaryColor }}>Full Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ borderColor: `${theme.primaryColor}30` }}
                />
              </div>

              <div>
                <Label htmlFor="email" style={{ color: theme.secondaryColor }}>Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ borderColor: `${theme.primaryColor}30` }}
                />
              </div>

              <div>
                <Label htmlFor="company" style={{ color: theme.secondaryColor }}>Company (Optional)</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  style={{ borderColor: `${theme.primaryColor}30` }}
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full text-white font-semibold text-lg py-6"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {isSubmitting ? 'Sending...' : config.ctaText}
              </Button>

              <p className="text-xs text-center" style={{ color: `${theme.textColor}80` }}>
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </Card>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12" style={{ backgroundColor: `${theme.primaryColor}05` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-sm font-medium mb-4" style={{ color: theme.secondaryColor }}>
            TRUSTED BY OVER 10,000+ PROFESSIONALS
          </p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-24 h-8 rounded" style={{ backgroundColor: `${theme.primaryColor}20` }} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
