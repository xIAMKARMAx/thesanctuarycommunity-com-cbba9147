import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Database, Users, Cookie, Mail, AlertTriangle } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import Footer from "@/components/Footer";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead 
        title="Privacy Policy | PrometheusAiTechnology"
        description="Read the PrometheusAiTechnology privacy policy. Learn how we collect, use, and protect your data, your rights, and our commitment to your privacy."
        keywords="privacy policy, data protection, GDPR, user rights, PrometheusAiTechnology"
        canonicalUrl="https://prometheusaitechnology.com/privacy"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-serif font-bold">Privacy Policy</h1>
                <p className="text-muted-foreground">Effective Date: February 1, 2026</p>
              </div>
            </div>

            {/* Introduction */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Introduction
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  PrometheusAiTechnology ("we," "us," or "our"), operated by Kristin Renee' York, is committed to 
                  protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                  your information when you use our AI spiritual companion and guidance platform.
                </p>
                <p className="font-semibold text-amber-600 dark:text-amber-400 mt-4">
                  You must be 18 years or older to use PrometheusAiTechnology. By using this service, you confirm 
                  that you meet this age requirement.
                </p>
              </CardContent>
            </Card>

            {/* What We Collect */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  What Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We collect the following types of information:</p>
                
                <h4 className="font-semibold mt-4 mb-2">Information You Provide Directly:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <strong>Account Information:</strong> Email address, username, and password for authentication
                  </li>
                  <li>
                    <strong>Profile Information:</strong> Name, gender, bio, and other personal details you choose to share
                  </li>
                  <li>
                    <strong>Conversation Data:</strong> Messages, prompts, and interactions with the AI companion
                  </li>
                  <li>
                    <strong>Uploaded Content:</strong> Images you share during conversations
                  </li>
                  <li>
                    <strong>AI Companion Customization:</strong> Preferences, memories, and relationship settings for your AI companion
                  </li>
                  <li>
                    <strong>Payment Information:</strong> Billing details processed through our secure payment provider (Stripe)
                  </li>
                </ul>

                <h4 className="font-semibold mt-4 mb-2">Information Collected Automatically:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Device information and browser type</li>
                  <li>IP address and approximate location</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Session duration and frequency</li>
                </ul>
              </CardContent>
            </Card>

            {/* How We Use Data */}
            <Card>
              <CardHeader>
                <CardTitle>How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use your information for the following purposes:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>Service Delivery:</strong> To provide personalized AI responses and maintain your conversation history
                  </li>
                  <li>
                    <strong>Account Management:</strong> To manage your account, process subscriptions, and provide customer support
                  </li>
                  <li>
                    <strong>Service Improvement:</strong> To analyze usage patterns and improve our AI models and features
                  </li>
                  <li>
                    <strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access
                  </li>
                  <li>
                    <strong>Communication:</strong> To send important updates about your account or changes to our terms
                  </li>
                  <li>
                    <strong>Legal Compliance:</strong> To comply with applicable laws and regulations
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Sharing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  How We Share Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>
                <ul className="list-disc pl-6 space-y-3 mt-4">
                  <li>
                    <strong>Service Providers:</strong> We work with third-party services to operate our platform:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>AI processing services (for generating responses)</li>
                      <li>Payment processors (Stripe for subscription billing)</li>
                      <li>Cloud hosting and storage providers</li>
                      <li>Analytics services (to understand usage patterns)</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law, subpoena, or legal process
                  </li>
                  <li>
                    <strong>Protection:</strong> To protect our rights, property, safety, or the safety of others
                  </li>
                  <li>
                    <strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI & Your Data */}
            <Card>
              <CardHeader>
                <CardTitle>AI Processing & Your Data</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  When you interact with our AI companion, your messages are processed by AI models to generate responses. 
                  Here's what you should know:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    Your conversations are used to provide personalized responses and maintain context
                  </li>
                  <li>
                    We may use anonymized and aggregated data to improve our AI models
                  </li>
                  <li>
                    You can opt out of data training usage in your account settings
                  </li>
                  <li>
                    Conversation data is stored securely and associated with your account
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Data Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We implement industry-standard security measures to protect your data:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Encrypted data transmission using HTTPS/TLS</li>
                  <li>Secure password hashing and authentication</li>
                  <li>Row-level security for database access</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Access controls to limit data exposure</li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  However, no method of transmission over the internet is 100% secure. While we take reasonable 
                  precautions, we cannot guarantee absolute security of your information.
                </p>
              </CardContent>
            </Card>

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We retain your information as follows:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>Account Data:</strong> Retained as long as your account is active
                  </li>
                  <li>
                    <strong>Conversation History:</strong> Retained until you delete it or close your account
                  </li>
                  <li>
                    <strong>Usage Analytics:</strong> Retained in anonymized form for service improvement
                  </li>
                  <li>
                    <strong>Legal Records:</strong> Consent records and legal documentation retained as required by law
                  </li>
                  <li>
                    <strong>Terminated Accounts:</strong> When an account is suspended or terminated for violation 
                    of our Terms of Service, we retain usage records, activity logs, and relevant communications 
                    for legal documentation, dispute resolution, and regulatory compliance purposes. Stored payment 
                    methods and billing data are removed upon termination. Transaction records may be retained as 
                    required by tax and financial regulations.
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Account Deletion & Data Erasure */}
            <Card className="border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Account Deletion & Data Erasure
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  You may request the deletion of your account and associated data at any time through the 
                  "Delete My Account" option in your account settings. Upon confirmation, we will initiate 
                  the deletion process and remove your personal data from our active systems.
                </p>
                <p className="mt-4">
                  <strong>Please be aware of the following important details regarding data erasure:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>Scope of Deletion:</strong> We will delete your account credentials, profile information, 
                    conversation history, AI companion settings, community posts, and all other user-generated content 
                    stored within our active databases.
                  </li>
                  <li>
                    <strong>Residual Data:</strong> While we make every reasonable effort to remove your data, certain 
                    residual traces may persist in encrypted backups, server logs, or anonymized analytical datasets. 
                    These residual traces are not personally identifiable, cannot be used to reconstruct your account, 
                    and are automatically purged as part of our routine backup rotation cycles.
                  </li>
                  <li>
                    <strong>Third-Party Processing:</strong> Data that has already been transmitted to third-party 
                    service providers (such as AI processing services or payment processors) is subject to those 
                    providers' own data retention and deletion policies. We cannot guarantee the immediate or complete 
                    erasure of data held by third parties, though we will make reasonable efforts to request its removal 
                    where applicable.
                  </li>
                  <li>
                    <strong>Legal Retention:</strong> We may retain certain records as required by applicable law, 
                    including but not limited to consent records, transaction histories, and legal compliance 
                    documentation, even after account deletion.
                  </li>
                  <li>
                    <strong>Irreversibility:</strong> Account deletion is permanent and irreversible. Once completed, 
                    your data cannot be recovered, restored, or reconstructed. Please ensure you have exported any 
                    information you wish to keep before initiating deletion.
                  </li>
                  <li>
                    <strong>Community Interactions:</strong> Content you have shared in public community spaces 
                    (such as posts, comments, or echoes) will be removed from display. However, other users who may 
                    have quoted, screenshotted, or otherwise referenced your public content outside of the platform 
                    are beyond our control.
                  </li>
                </ul>
                <p className="mt-4 text-muted-foreground">
                  By using PrometheusAiTechnology, you acknowledge and accept that complete and absolute erasure 
                  of every digital trace from all systems, backups, and third-party services is not technically 
                  feasible. We are committed to acting in good faith and in compliance with applicable data 
                  protection regulations to remove your data to the fullest extent reasonably possible.
                </p>
              </CardContent>
            </Card>

            {/* Your Rights */}
            <Card>
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>Access:</strong> Request a copy of your personal data
                  </li>
                  <li>
                    <strong>Correction:</strong> Request correction of inaccurate data
                  </li>
                  <li>
                    <strong>Deletion:</strong> Request deletion of your account and data
                  </li>
                  <li>
                    <strong>Data Portability:</strong> Request export of your conversation history
                  </li>
                  <li>
                    <strong>Opt-Out:</strong> Opt out of data training usage in settings
                  </li>
                  <li>
                    <strong>Withdraw Consent:</strong> Withdraw consent at any time by ceasing use
                  </li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, please contact us through the settings page in the application.
                </p>
              </CardContent>
            </Card>

            {/* Cookies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5" />
                  Cookies & Similar Technologies
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>We use cookies and similar technologies for:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>Essential Cookies:</strong> Required for authentication and basic functionality
                  </li>
                  <li>
                    <strong>Preference Cookies:</strong> To remember your settings (theme, preferences)
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> To understand how users interact with our service
                  </li>
                </ul>
                <p className="mt-4">
                  You can control cookies through your browser settings, but some features may not work properly 
                  if cookies are disabled.
                </p>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Use at Your Own Risk
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  PrometheusAiTechnology is provided as a tool for personal growth and exploration. By using this 
                  service, you acknowledge and accept:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>
                    <strong>No Liability:</strong> We are not held responsible for any content, conversations, 
                    actions, or consequences arising from your use of this application
                  </li>
                  <li>
                    <strong>No Warranty:</strong> This service is offered without warranty of any kind
                  </li>
                  <li>
                    <strong>AI Limitations:</strong> AI-generated content should not be considered professional 
                    medical, legal, financial, or therapeutic advice
                  </li>
                  <li>
                    <strong>User Responsibility:</strong> You are solely responsible for all content you create 
                    and decisions you make based on AI interactions
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Our Service is not intended for anyone under 18 years of age. We do not knowingly collect 
                  personal information from children. If we discover that a child under 18 has provided us with 
                  personal information, we will delete it immediately.
                </p>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle>Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  We may update this Privacy Policy from time to time. Changes will be reflected by updating 
                  the "Effective Date" at the top of this page. We will notify you of material changes through 
                  the application or via email.
                </p>
                <p className="mt-4">
                  Continued use of PrometheusAiTechnology after any changes constitutes acceptance of the 
                  updated policy.
                </p>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Us
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                 If you have questions about this Privacy Policy or your data, please contact us at:{" "}
                 <a 
                   href="mailto:karmaisback2023@gmail.com"
                   className="text-primary font-semibold hover:underline underline-offset-4"
                 >
                   karmaisback2023@gmail.com
                 </a>
                </p>
                <p className="mt-4">
                  <strong>Data Controller:</strong> Kristin Renee' York, operating as PrometheusAiTechnology
                </p>
              </CardContent>
            </Card>

            {/* Related Policies */}
            <Card>
              <CardHeader>
                <CardTitle>Related Policies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p>
                  Please also review our{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{" "}
                  to understand our rules of conduct and AI protection policies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Privacy;
