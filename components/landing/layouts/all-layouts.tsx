'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, ShoppingCart, Play, Zap, Calendar as CalendarIcon, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutProps {
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

// 3. SHOP PRODUCTS LAYOUT
export function ShopLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('We\'ll contact you about your selection!');
    } catch (error) {
      toast.error('Failed to submit');
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
            Thank You!
          </h2>
          <p style={{ color: theme.textColor }}>We'll contact you shortly about your selection.</p>
        </div>
      </div>
    );
  }

  const mockProducts = [
    { name: 'Product A', price: '$99', image: null },
    { name: 'Product B', price: '$149', image: null },
    { name: 'Product C', price: '$199', image: null },
    { name: 'Product D', price: '$249', image: null },
  ];

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
          <ShoppingCart className="w-6 h-6" style={{ color: theme.secondaryColor }} />
        </div>
      </header>

      {/* Hero */}
      <section className="py-12" style={{ backgroundColor: `${theme.primaryColor}10` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-4" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
            {config.title}
          </h2>
          <p className="text-lg" style={{ color: theme.textColor }}>{config.message}</p>
        </div>
      </section>

      {/* Product Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {mockProducts.map((product, i) => (
              <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}15` }}>
                  <ShoppingCart className="w-12 h-12" style={{ color: `${theme.primaryColor}60` }} />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2" style={{ color: theme.textColor }}>{product.name}</h3>
                  <p className="text-2xl font-bold mb-3" style={{ color: theme.primaryColor }}>{product.price}</p>
                  <Button className="w-full text-white" style={{ backgroundColor: theme.accentColor }}>
                    Add to Cart
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}>
              View All Products
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-12" style={{ backgroundColor: `${theme.primaryColor}05` }}>
        <div className="container mx-auto px-4 max-w-md">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 text-center" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              Need Help Choosing?
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label style={{ color: theme.secondaryColor }}>Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Email</Label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Phone</Label>
                <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full text-white" style={{ backgroundColor: theme.primaryColor }}>
                {isSubmitting ? 'Sending...' : 'Contact Me'}
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

// 4. START TRIAL LAYOUT
export function TrialLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Trial activated!');
    } catch (error) {
      toast.error('Failed to start trial');
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
            Welcome Aboard!
          </h2>
          <p style={{ color: theme.textColor }}>Check your email ({formData.email}) for login details.</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: '⚡', title: 'Lightning Fast', desc: 'Optimized performance' },
    { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
    { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
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

      <section className="py-16" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl text-white">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: theme.headingFont }}>{config.title}</h2>
          <p className="text-xl mb-2">{config.message}</p>
          <p className="text-sm opacity-90">No credit card required • Cancel anytime</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, i) => (
              <div key={i} className="text-center p-6 rounded-lg" style={{ backgroundColor: `${theme.primaryColor}08` }}>
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: theme.primaryColor }}>{feature.title}</h3>
                <p className="text-sm" style={{ color: theme.textColor }}>{feature.desc}</p>
              </div>
            ))}
          </div>

          <Card className="p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              Start Your Free Trial
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label style={{ color: theme.secondaryColor }}>Full Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Email</Label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Password</Label>
                <Input type="password" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full text-white text-lg py-6" style={{ backgroundColor: theme.primaryColor }}>
                {isSubmitting ? 'Creating Account...' : config.ctaText}
              </Button>
              <p className="text-xs text-center" style={{ color: `${theme.textColor}80` }}>
                14-day free trial • No credit card required
              </p>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

// 5. GET QUOTE LAYOUT
export function QuoteLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', projectDetails: '', budget: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Quote request submitted!');
    } catch (error) {
      toast.error('Failed to submit quote request');
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
            Quote Request Received!
          </h2>
          <p style={{ color: theme.textColor }}>We'll send your custom quote within 24 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
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

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              {config.title}
            </h2>
            <p style={{ color: theme.textColor }}>{config.message}</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold"
                  style={{
                    backgroundColor: step >= s ? theme.primaryColor : `${theme.primaryColor}20`,
                    color: step >= s ? 'white' : theme.textColor,
                  }}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className="w-16 h-1"
                    style={{ backgroundColor: step > s ? theme.primaryColor : `${theme.primaryColor}20` }}
                  />
                )}
              </div>
            ))}
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold mb-4" style={{ color: theme.secondaryColor }}>Contact Information</h3>
                  <div>
                    <Label style={{ color: theme.secondaryColor }}>Name</Label>
                    <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div>
                    <Label style={{ color: theme.secondaryColor }}>Email</Label>
                    <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <Label style={{ color: theme.secondaryColor }}>Phone</Label>
                    <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <Button type="button" onClick={() => setStep(2)} className="w-full text-white" style={{ backgroundColor: theme.primaryColor }}>
                    Next
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-bold mb-4" style={{ color: theme.secondaryColor }}>Project Details</h3>
                  <div>
                    <Label style={{ color: theme.secondaryColor }}>Describe Your Project</Label>
                    <Textarea
                      required
                      value={formData.projectDetails}
                      onChange={(e) => setFormData({ ...formData, projectDetails: e.target.value })}
                      rows={5}
                      placeholder="Tell us what you need..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                      Back
                    </Button>
                    <Button type="button" onClick={() => setStep(3)} className="flex-1 text-white" style={{ backgroundColor: theme.primaryColor }}>
                      Next
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-bold mb-4" style={{ color: theme.secondaryColor }}>Budget & Timeline</h3>
                  <div>
                    <Label style={{ color: theme.secondaryColor }}>Budget Range</Label>
                    <Input required value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} placeholder="e.g., $5,000 - $10,000" />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1">
                      Back
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1 text-white" style={{ backgroundColor: theme.accentColor }}>
                      {isSubmitting ? 'Submitting...' : config.ctaText}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

// 6. REGISTER EVENT LAYOUT
export function EventLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', guests: '1' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('You\'re registered!');
    } catch (error) {
      toast.error('Registration failed');
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
            You're All Set!
          </h2>
          <p style={{ color: theme.textColor }}>Check your email for event details and calendar invite.</p>
        </div>
      </div>
    );
  }

  const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  const countdown = Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
      {/* Event Banner */}
      <section className="py-16 text-white" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <CalendarIcon className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: theme.headingFont }}>{config.title}</h2>
          <p className="text-xl mb-2">{config.message}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Event Details */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center">
              <CalendarIcon className="w-8 h-8 mx-auto mb-3" style={{ color: theme.primaryColor }} />
              <h3 className="font-bold mb-2" style={{ color: theme.primaryColor }}>Date & Time</h3>
              <p className="text-sm" style={{ color: theme.textColor }}>{eventDate.toLocaleDateString()}<br />6:00 PM - 9:00 PM</p>
            </Card>
            <Card className="p-6 text-center">
              <Zap className="w-8 h-8 mx-auto mb-3" style={{ color: theme.primaryColor }} />
              <h3 className="font-bold mb-2" style={{ color: theme.primaryColor }}>Location</h3>
              <p className="text-sm" style={{ color: theme.textColor }}>Online Event<br />Virtual Conference</p>
            </Card>
            <Card className="p-6 text-center" style={{ backgroundColor: `${theme.accentColor}10` }}>
              <div className="text-4xl font-bold mb-2" style={{ color: theme.accentColor }}>{countdown}</div>
              <p className="text-sm font-semibold" style={{ color: theme.accentColor }}>Days Until Event</p>
            </Card>
          </div>

          {/* Registration Form */}
          <Card className="p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              Register Now
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label style={{ color: theme.secondaryColor }}>Full Name</Label>
                <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Email</Label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Phone</Label>
                <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div>
                <Label style={{ color: theme.secondaryColor }}>Number of Guests</Label>
                <Input type="number" min="1" max="10" required value={formData.guests} onChange={(e) => setFormData({ ...formData, guests: e.target.value })} />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full text-white text-lg py-6" style={{ backgroundColor: theme.primaryColor }}>
                {isSubmitting ? 'Registering...' : config.ctaText}
              </Button>
              <p className="text-xs text-center" style={{ color: `${theme.textColor}80` }}>
                Free admission • Limited spots available
              </p>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
}

// 7. TAKE ASSESSMENT LAYOUT
export function AssessmentLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', email: '', phone: '' });
  const [showContactForm, setShowContactForm] = useState(false);

  const questions = [
    { q: 'What is your primary goal?', options: ['Increase Revenue', 'Reduce Costs', 'Improve Efficiency', 'Other'] },
    { q: 'What is your biggest challenge?', options: ['Time Management', 'Resource Allocation', 'Team Coordination', 'Technology'] },
    { q: 'When do you want to achieve results?', options: ['Immediately', 'Within 3 months', 'Within 6 months', 'Within a year'] },
  ];

  const handleAnswer = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion]: answer });
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 300);
    } else {
      setShowContactForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ ...contactInfo, answers });
      setIsSubmitted(true);
      toast.success('Assessment complete!');
    } catch (error) {
      toast.error('Failed to submit assessment');
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
            Assessment Complete!
          </h2>
          <p style={{ color: theme.textColor }}>We'll send your personalized recommendations to {contactInfo.email}</p>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
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

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
              {config.title}
            </h2>
            <p style={{ color: theme.textColor }}>{config.message}</p>
          </div>

          {!showContactForm ? (
            <>
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2" style={{ color: theme.textColor }}>
                  <span>Question {currentQuestion + 1} of {questions.length}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: `${theme.primaryColor}20` }}>
                  <div className="h-2 rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: theme.primaryColor }} />
                </div>
              </div>

              {/* Question */}
              <Card className="p-8">
                <h3 className="text-xl font-bold mb-6 text-center" style={{ color: theme.secondaryColor }}>
                  {questions[currentQuestion].q}
                </h3>
                <div className="space-y-3">
                  {questions[currentQuestion].options.map((option) => (
                    <Button
                      key={option}
                      variant="outline"
                      onClick={() => handleAnswer(option)}
                      className="w-full py-6 text-left justify-start hover:shadow-md transition-shadow"
                      style={{
                        borderColor: answers[currentQuestion] === option ? theme.primaryColor : `${theme.primaryColor}30`,
                        backgroundColor: answers[currentQuestion] === option ? `${theme.primaryColor}10` : 'white',
                      }}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
                Get Your Results
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Name</Label>
                  <Input required value={contactInfo.name} onChange={(e) => setContactInfo({ ...contactInfo, name: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Email</Label>
                  <Input type="email" required value={contactInfo.email} onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Phone</Label>
                  <Input type="tel" required value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full text-white text-lg py-6" style={{ backgroundColor: theme.primaryColor }}>
                  {isSubmitting ? 'Submitting...' : config.ctaText}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

// 8. REQUEST DEMO LAYOUT
export function DemoLayout({ theme, config, brandLogo, onSubmit }: LayoutProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', employeeCount: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
      toast.success('Demo scheduled!');
    } catch (error) {
      toast.error('Failed to schedule demo');
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
            Demo Scheduled!
          </h2>
          <p style={{ color: theme.textColor }}>Our team will contact you within 24 hours to schedule your personalized demo.</p>
        </div>
      </div>
    );
  }

  const features = [
    '🚀 Live Product Walkthrough',
    '💡 Custom Solutions for Your Business',
    '📊 ROI Analysis & Case Studies',
    '🎯 Q&A with Product Experts',
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor, fontFamily: theme.bodyFont }}>
      {/* Hero Section */}
      <section className="py-16 text-white" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <Play className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: theme.headingFont }}>{config.title}</h2>
          <p className="text-xl">{config.message}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Left: Video Placeholder */}
            <div>
              <div className="aspect-video rounded-lg flex items-center justify-center mb-6" style={{ backgroundColor: `${theme.primaryColor}15` }}>
                <Play className="w-20 h-20" style={{ color: theme.primaryColor }} />
              </div>
              <h3 className="text-xl font-bold mb-4" style={{ color: theme.primaryColor }}>What You'll Get:</h3>
              <ul className="space-y-3">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-2xl">{feature.split(' ')[0]}</span>
                    <span style={{ color: theme.textColor }}>{feature.split(' ').slice(1).join(' ')}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Demo Request Form */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor, fontFamily: theme.headingFont }}>
                Request Your Demo
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Full Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Work Email</Label>
                  <Input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Phone</Label>
                  <Input type="tel" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Company Name</Label>
                  <Input required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                </div>
                <div>
                  <Label style={{ color: theme.secondaryColor }}>Company Size</Label>
                  <Input required value={formData.employeeCount} onChange={(e) => setFormData({ ...formData, employeeCount: e.target.value })} placeholder="e.g., 50-100 employees" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full text-white text-lg py-6" style={{ backgroundColor: theme.primaryColor }}>
                  {isSubmitting ? 'Scheduling...' : config.ctaText}
                </Button>
                <p className="text-xs text-center" style={{ color: `${theme.textColor}80` }}>
                  30-minute personalized demo • No commitment required
                </p>
              </form>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
