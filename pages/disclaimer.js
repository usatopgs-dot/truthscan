// pages/disclaimer.js
import SEO from "../components/SEO";
import { Page, Section, FooterLinks } from "./about";

export default function Disclaimer() {
  return (
    <>
      <SEO
        title="Disclaimer — TruthScan"
        description="Read the TruthScan disclaimer. AI results are for informational purposes only and should not be considered as absolute truth."
        url="https://truthscan.frontendin.com/disclaimer"
      />
      <Page title="Disclaimer" emoji="⚠️">
        <Section title="AI Accuracy">
          TruthScan uses artificial intelligence to analyze news and information. While our AI strives for accuracy, it is not perfect. Results provided by TruthScan are for informational purposes only and should not be considered as absolute, definitive judgments of truth or falsehood.
        </Section>
        <Section title="Not Legal or Professional Advice">
          The information and results provided by TruthScan do not constitute legal, journalistic, medical, or any other professional advice. Always consult qualified professionals for important decisions.
        </Section>
        <Section title="No Guarantee of Accuracy">
          We do not guarantee that TruthScan's analysis is 100% accurate. News and information landscapes change rapidly. A verdict given today may not reflect future developments. Always verify important information through multiple trusted sources.
        </Section>
        <Section title="Third-Party Content">
          TruthScan analyzes content provided by users. We are not responsible for the accuracy, legality, or appropriateness of any user-submitted content. We do not store user-submitted content on our servers.
        </Section>
        <Section title="AI Limitations">
          AI models have a knowledge cutoff date and may not be aware of very recent events. Our AI attempts to account for this but may occasionally flag recent news as potentially outdated or uncertain.
        </Section>
        <Section title="Use at Your Own Risk">
          By using TruthScan, you agree that you are doing so at your own risk. TruthScan, frontendin.com, and its team are not liable for any decisions made based on our AI analysis.
        </Section>
        <Section title="Corrections">
          If you believe a TruthScan result is incorrect, please contact us. We are always working to improve our AI models and analysis.
        </Section>
        <p style={{ color:"#94a3b8", fontSize:13, marginBottom:20 }}>Last updated: March 2026</p>
        <FooterLinks />
      </Page>
    </>
  );
}
