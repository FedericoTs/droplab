'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface AppointmentLayoutProps {
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

export function AppointmentLayout({ theme, config, brandLogo, onSubmit }: AppointmentLayoutProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Appointment request submitted!');
    } catch (error) {
      toast.error('Failed to submit appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor }}>
        <div className="text-center p-8">
          <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: theme.accentColor }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
            Appointment Requested!
          </h2>
          <p style={{ color: theme.textColor, fontFamily: theme.bodyFont }}>
            We'll contact you shortly to confirm your appointment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: `${theme.primaryColor}20` }}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {brandLogo ? (
            <img src={brandLogo} alt={config.companyName} className="h-10" />
          ) : (
            <h1 className="text-xl font-bold" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              {config.companyName}
            </h1>
          )}
          <div className="flex items-center gap-2" style={{ color: theme.secondaryColor }}>
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Book Your Appointment</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}05)` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-4" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
            {config.title}
          </h2>
          <p className="text-lg" style={{ color: theme.textColor }}>
            {config.message}
          </p>
        </div>
      </section>

      {/* Appointment Form with Calendar */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Calendar Visual */}
            <Card className="p-6" style={{ borderColor: `${theme.primaryColor}30` }}>
              <div className="text-center mb-6">
                <Calendar className="w-16 h-16 mx-auto mb-4" style={{ color: theme.accentColor }} />
                <h3 className="text-xl font-semibold mb-2" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
                  Choose Your Time
                </h3>
                <p className="text-sm" style={{ color: theme.textColor }}>
                  Select a convenient date and time for your appointment
                </p>
              </div>

              {/* Mock Calendar */}
              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium mb-2" style={{ color: theme.secondaryColor }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="aspect-square rounded text-sm hover:opacity-80"
                      style={{
                        backgroundColor: i > 28 ? 'transparent' : `${theme.primaryColor}08`,
                        color: i > 28 ? theme.textColor + '40' : theme.textColor,
                        border: i === 15 ? `2px solid ${theme.accentColor}` : 'none'
                      }}
                    >
                      {i > 2 && i < 30 ? i - 2 : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Available Times */}
              <div className="mt-6">
                <Label className="text-sm font-medium mb-2 block" style={{ color: theme.secondaryColor }}>
                  Available Times
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'].map(time => (
                    <button
                      key={time}
                      type="button"
                      className="py-2 px-3 rounded text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: `${theme.accentColor}15`,
                        color: theme.accentColor,
                        border: `1px solid ${theme.accentColor}30`
                      }}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Contact Form */}
            <Card className="p-6">
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
                  <Label htmlFor="email" style={{ color: theme.secondaryColor }}>Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ borderColor: `${theme.primaryColor}30` }}
                  />
                </div>

                <div>
                  <Label htmlFor="phone" style={{ color: theme.secondaryColor }}>Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ borderColor: `${theme.primaryColor}30` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" style={{ color: theme.secondaryColor }}>
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Preferred Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={formData.preferredDate}
                      onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                      style={{ borderColor: `${theme.primaryColor}30` }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="time" style={{ color: theme.secondaryColor }}>
                      <Clock className="w-4 h-4 inline mr-1" />
                      Preferred Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      required
                      value={formData.preferredTime}
                      onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                      style={{ borderColor: `${theme.primaryColor}30` }}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white font-semibold"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {isSubmitting ? 'Submitting...' : config.ctaText}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12" style={{ backgroundColor: `${theme.primaryColor}05` }}>
        <div className="container mx-auto px-4 max-w-4xl">
          <h3 className="text-2xl font-bold text-center mb-8" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
            Why Book With Us?
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '⚡', title: 'Fast Response', desc: 'Get confirmation within 24 hours' },
              { icon: '🎯', title: 'Expert Team', desc: 'Work with certified professionals' },
              { icon: '💯', title: 'Satisfaction Guaranteed', desc: '100% satisfaction or money back' }
            ].map((benefit, i) => (
              <div key={i} className="text-center p-4">
                <div className="text-4xl mb-2">{benefit.icon}</div>
                <h4 className="font-semibold mb-1" style={{ color: theme.secondaryColor }}>{benefit.title}</h4>
                <p className="text-sm" style={{ color: theme.textColor }}>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
