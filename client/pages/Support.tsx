import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Layout } from "@/components/Layout";
import { ChevronDown, Mail, HelpCircle } from "lucide-react";

export default function Support() {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "How long does a website build typically take?",
      answer:
        "Most website projects take 4-8 weeks from start to finish, depending on complexity and your feedback turnaround. We'll provide a specific timeline during your initial consultation.",
    },
    {
      question: "Can I request changes after my website launches?",
      answer:
        "Absolutely! You can submit change requests anytime through the portal. We'll prioritize and schedule updates based on the complexity and your priority level.",
    },
    {
      question: "What technologies do you use to build websites?",
      answer:
        "We specialize in the Astro framework for building lightweight, high-performance websites. Astro enables us to create sites that are 75% faster while maintaining full control over design and functionality.",
    },
    {
      question: "Will my website be mobile-responsive?",
      answer:
        "Yes! All websites we build are fully responsive and optimized for mobile, tablet, and desktop devices. Mobile-first design is our standard approach.",
    },
    {
      question: "Do you provide ongoing support?",
      answer:
        "Yes, we provide ongoing support through this portal. You can submit change requests, and our team will handle updates. For critical issues, contact our support team directly.",
    },
  ];

  const handleContactChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    alert("Thank you for your message. Our support team will get back to you soon!");
    setContactForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Support & Help</h1>
          <p className="text-muted-foreground mt-2">Get answers to common questions and contact our support team</p>
        </div>

        {/* FAQ Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-primary" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 hover:bg-secondary transition-colors text-left"
                >
                  <h3 className="font-semibold">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-primary transition-transform ${
                      expandedFaq === index ? "transform rotate-180" : ""
                    }`}
                  />
                </button>
                {expandedFaq === index && (
                  <div className="px-4 py-3 border-t border-border bg-secondary/50">
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-6">
            <Mail className="w-6 h-6 text-accent" />
            Contact Support
          </h2>

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your name"
                  value={contactForm.name}
                  onChange={handleContactChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your@example.com"
                  value={contactForm.email}
                  onChange={handleContactChange}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="What can we help with?"
                value={contactForm.subject}
                onChange={handleContactChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                name="message"
                placeholder="Tell us more..."
                value={contactForm.message}
                onChange={handleContactChange}
                required
                rows={6}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90">
              Send Message
            </Button>
          </form>
        </Card>

        {/* Quick Links */}
        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10">
          <h3 className="text-lg font-semibold mb-4">Need immediate assistance?</h3>
          <p className="text-muted-foreground mb-4">
            For urgent issues or complex questions, reach out to our support team directly.
          </p>
          <Button className="bg-accent hover:bg-accent/90">
            Email Support: support@astrobot.design
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
