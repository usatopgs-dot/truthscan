// pages/terms.js
import SEO from "../components/SEO";
import { Page, Section, FooterLinks } from "./about";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms & Conditions — TruthScan"
        description="TruthScan Terms and Conditions. Read our terms of service before using TruthScan."
        url="https://truthscan.frontendin.com/terms"
      />
      <Page title="Terms & Conditions" emoji="📋">
        <Section title="Acceptance of Terms">
          By accessing or using TruthScan at truthscan.frontendin.com, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our service.
        </Section>

        <Section title="Description of Service">
          TruthScan is a free AI-powered fact-checking tool that analyzes news, WhatsApp forwards, URLs, and images to determine whether content is TRUE, FALSE, or MISLEADING. The service is provided as-is, for informational purposes only.
        </Section>

        <Section title="Acceptable Use">
          You agree to use TruthScan only for lawful purposes. You must not use TruthScan to submit illegal, hateful, obscene, or defamatory content. You must not attempt to reverse-engineer, hack, or disrupt the service. You must not use automated tools to make excessive requests to our service. You must not use TruthScan to spread misinformation or manipulate AI results.
        </Section>

        <Section title="Free Service & Limitations">
          TruthScan provides 5 free checks per day per user. This limit may change at any time. We reserve the right to suspend access for users who abuse the service. Users who provide their own API keys use the service at their own expense and responsibility.
        </Section>

        <Section title="Intellectual Property">
          All content, design, code, and branding of TruthScan is the property of frontendin.com. You may not copy, reproduce, or distribute any part of TruthScan without written permission. User-submitted content remains the property of the user.
        </Section>

        <Section title="Disclaimer of Warranties">
          TruthScan is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, or completely accurate. AI analysis results are not guaranteed to be correct.
        </Section>

        <Section title="Limitation of Liability">
          TruthScan, frontendin.com, and its team shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our service. This includes damages from reliance on AI-generated analysis results.
        </Section>

        <Section title="Third-Party Links">
          TruthScan may contain links to third-party websites. We are not responsible for the content, privacy practices, or accuracy of any third-party sites.
        </Section>

        <Section title="Privacy">
          Your use of TruthScan is also governed by our Privacy Policy, which is incorporated into these Terms by reference.
        </Section>

        <Section title="Changes to Terms">
          We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Continued use of TruthScan after changes constitutes acceptance of the new Terms.
        </Section>

        <Section title="Governing Law">
          These Terms shall be governed by the laws of India. Any disputes shall be subject to the jurisdiction of Indian courts.
        </Section>

        <Section title="Contact">
          For questions about these Terms, contact us at: contact@frontendin.com
        </Section>

        <p style={{ color:"#94a3b8", fontSize:13, marginBottom:20 }}>Last updated: March 2026</p>
        <FooterLinks />
      </Page>
    </>
  );
}
