const TermsAndConditions = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              1. Acceptance of Terms
            </h2>
            <p>
              By using this site, you agree to these Terms of Service. If you do
              not agree, do not use our site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              2. Account Responsibilities
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                You are responsible for maintaining your account
                confidentiality.
              </li>
              <li>Provide accurate information when registering.</li>
              <li>
                Your account may have roles with special privileges; misuse may
                result in suspension.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              3. Payments and Credits
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Payments are processed via Stripe; we do not store your card
                information.
              </li>
              <li>All payments are final unless stated by Pentyrch Aliens.</li>
              <li>
                Credits earned on the site are tied to your account and may be
                used for services or store items.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              4. Event Participation
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Your participation in events is tracked, including role and
                attendance timestamps.
              </li>
              <li>
                You must follow site rules when attending or participating in
                events.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              5. Transactions and Store Purchases
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                We store transaction history, including type, amount, metadata,
                and payment ID, for record-keeping.
              </li>
              <li>
                Refunds, disputes, or corrections are at Pentyrch Aliens
                discretion.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              6. Account Deletion and Data Requests
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                You may request account deletion or data access by contacting{" "}
                <strong>lukesterry@gmail.com</strong>.
              </li>
              <li>
                We will process requests according to applicable data protection
                laws.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              7. Limitation of Liability
            </h2>
            <ul className="list-disc list-inside space-y-2">
              <li>
                We are not liable for indirect, incidental, or consequential
                damages from using the site.
              </li>
              <li>We do not guarantee uninterrupted access to the site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              8. Changes to the Terms
            </h2>
            <p>
              We may update these Terms from time to time. The latest version
              will be posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Questions about these Terms? Contact us at{" "}
              <strong>lukesterry@gmail.com</strong>.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Last updated: January 2026
          </p>
        </div>
      </div>
    </main>
  );
};

export default TermsAndConditions;
