// pages/privacy-policy.js
import SEO from "../components/SEO";
import { Page, Section, FooterLinks } from "./about";

export default function PrivacyPolicy() {
  return (
    <>
      <SEO
        title="Privacy Policy — TruthScan"
        description="TruthScan Privacy Policy. Learn how we handle your data, what we collect, and how we protect your privacy."
        url="https://truthscan.frontendin.com/privacy-policy"
      />
      <Page title="Privacy Policy" emoji="🔒">
        <Section title="Overview">
          At TruthScan, we take your privacy seriously. This Privacy Policy explains what information we collect, how we use it, and how we protect it. By using TruthScan, you agree to this policy.
        </Section>

        <Section title="Information We DO NOT Collect">
          We do not collect, store, or share any personally identifiable information (PII). We do not require you to create an account. We do not store the news text, URLs, or images you submit for checking. Your submitted content is processed in real-time and discarded immediately after analysis.
        </Section>

        <Section title="Information We Collect">
          We may collect basic, anonymous usage data including page views, browser type, device type, country/region, and which features are used. This data is collected in aggregate form only and cannot be used to identify individual users. We use Google Analytics for this purpose.
        </Section>

        <Section title="API Keys">
          If you choose to add your own Gemini API key, it is stored exclusively in your browser's local storage. Your API key is never transmitted to our servers. We cannot see, access, or use your API key.
        </Section>

        <Section title="Cookies">
          TruthScan uses minimal cookies for basic functionality (such as remembering your daily free check count). We do not use tracking cookies or advertising cookies beyond standard Google Analytics and Google AdSense. You can disable cookies in your browser settings at any time.
        </Section>

        <Section title="Google AdSense">
          We use Google AdSense to display advertisements. Google may use cookies to show relevant ads based on your browsing history. You can opt out of personalized ads by visiting Google's Ad Settings. We do not control which ads are shown by Google.
        </Section>

        <Section title="Third-Party Services">
          TruthScan uses the following third-party services: Groq API (AI analysis), Google Gemini API (AI analysis for users with their own keys), Google Analytics (anonymous usage statistics), Google AdSense (advertisements), Vercel (hosting). Each of these services has their own privacy policies.
        </Section>

        <Section title="Data Security">
          We implement industry-standard security measures. All data is transmitted over HTTPS. We do not store sensitive user data on our servers.
        </Section>

        <Section title="Children's Privacy">
          TruthScan is not directed at children under the age of 13. We do not knowingly collect personal information from children.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the date below. Continued use of TruthScan after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact Us">
          If you have any questions about this Privacy Policy, please contact us at: contact@frontendin.com
        </Section>

        <p style={{ color:"#94a3b8", fontSize:13, marginBottom:20 }}>Last updated: March 2026</p>
        <FooterLinks />
      </Page>
    </>
  );
}
