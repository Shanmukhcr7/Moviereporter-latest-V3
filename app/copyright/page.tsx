"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <ShieldAlert className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">Copyright Policy</h1>
            <p className="text-xl text-muted-foreground">
              Our commitment to protecting intellectual property rights
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="p-8 prose dark:prose-invert max-w-none">
              <p><strong>Last Updated:</strong> July 12, 2025</p>

              <p>
                <strong>MovieReporter.in</strong> is committed to respecting the intellectual property rights of others. We comply with the <strong>DMCA (1998, USA)</strong>, the <strong>Copyright Act, 1957 (India)</strong> (as amended in 2012), and the <strong>Information Technology Act, 2000 (India)</strong>, including the <em>Intermediary Guidelines and Digital Media Ethics Code Rules, 2021</em>.
              </p>

              <h3>Submitting a Copyright Takedown Notice</h3>
              <p>If you believe material on our platform infringes your copyright, please submit a written notice to our designated Copyright Agent, including:</p>
              <ul>
                <li><strong>Identification of the Copyrighted Work</strong>: Include sufficient detail such as title, author, or source URL.</li>
                <li><strong>Identification of Infringing Material</strong>: Provide a direct link or detailed reference.</li>
                <li><strong>Your Contact Information</strong>: Name, address, phone, and email.</li>
                <li><strong>Statement of Good Faith</strong>: Assert the usage is unauthorized.</li>
                <li><strong>Statement of Accuracy</strong>: Declare the information is correct under penalty of perjury.</li>
                <li><strong>Your Signature</strong>: Physical or electronic.</li>
              </ul>

              <p>
                Email your notice to: <a href="mailto:admin@moviereporter.in" className="text-primary hover:underline">admin@moviereporter.in</a><br />
                Subject: <strong>Copyright Takedown Notice</strong>
              </p>

              <h3>Response to Takedown Notices</h3>
              <p>Upon receiving a valid notice, we will:</p>
              <ul>
                <li>Remove or disable access within 36 hours.</li>
                <li>Notify the user (if applicable).</li>
                <li>Confirm the action with the complainant.</li>
              </ul>

              <h3>Counter-Notice Procedure</h3>
              <p>If you believe your material was wrongly removed, you may file a counter-notice containing:</p>
              <ul>
                <li>Identification of removed content and its location.</li>
                <li>Statement under penalty of perjury about mistaken removal.</li>
                <li>Your full contact details.</li>
                <li>Consent to jurisdiction in relevant courts.</li>
                <li>Your signature.</li>
              </ul>

              <p>
                Email your counter-notice to: <a href="mailto:admin@moviereporter.in" className="text-primary hover:underline">admin@moviereporter.in</a><br />
                Subject: <strong>Copyright Counter-Notice</strong>
              </p>

              <p>We may restore the material within 10–14 business days unless we receive a legal notice preventing restoration.</p>

              <h3>Repeat Infringer Policy</h3>
              <p>Users with repeat offenses may have their accounts or access terminated, per DMCA and Section 79 of India’s IT Act, 2000.</p>

              <h3>Grievance Officer</h3>
              <p>As per the IT Rules, 2021, our designated Grievance Officer is available at:</p>
              <p>
                <strong>Email:</strong> <a href="mailto:admin@moviereporter.in" className="text-primary hover:underline">admin@moviereporter.in</a><br />
                <strong>Subject Line:</strong> Copyright Grievance
              </p>

              <h3>Our Commitment to Ethical Content Use</h3>
              <p>
                We strive to use all materials ethically and respectfully. Our intent is strictly to inform and engage audiences in movie and entertainment-related discussions, news, and insights. We adhere to both Indian and international copyright laws across our website and social platforms.
              </p>

              <h3>Contact Information</h3>
              <p>For all copyright-related inquiries:</p>
              <p>
                <strong>Email:</strong> <a href="mailto:admin@moviereporter.in" className="text-primary hover:underline">admin@moviereporter.in</a><br />
                <strong>Subject:</strong> Copyright Inquiry
              </p>

              <h3>Additional Notes</h3>
              <ul>
                <li>We are not responsible for third-party content linked from our platform.</li>
                <li>Frivolous claims may result in legal consequences.</li>
                <li>This policy is updated periodically to reflect legal or procedural changes.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
