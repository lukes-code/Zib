const PrivacyPolicy = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-3">
              1. Information We Collect
            </h2>
            <p>
              We collect the following personal information when you use our
              site to enable core functionalities:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Profile info:</strong> Name, email, credits,
                registration status, subscription status, and roles.
              </li>
              <li>
                <strong>Event info:</strong> Events you attend, your position in
                events, and timestamps of participation.
              </li>
              <li>
                <strong>Transactions:</strong> Purchases, transaction type,
                amount, metadata, and payment IDs (processed securely via
                Stripe).
              </li>
              <li>
                <strong>Other activity data:</strong> Any interactions tied to
                your account, such as store purchases.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Manage your account, roles, and event registrations</li>
              <li>Process payments and link transactions to your account</li>
              <li>Track credits and transactions for site functionality</li>
              <li>
                Communicate updates about events, store items, or account
                activity
              </li>
              <li>Ensure compliance with site rules and prevent fraud</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              3. Sharing Your Information
            </h2>
            <p>
              We do not sell your personal data. Your information may be shared
              with trusted third parties only as needed to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                Process payments via Stripe (See Stripe's Privacy Policy{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline"
                >
                  here
                </a>
                )
              </li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. User Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Request export of your data</li>
            </ul>
            <p className="mt-3">
              To exercise your rights or delete your account, contact{" "}
              <strong>lukesterry@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Data Retention</h2>
            <p>
              We keep your data as long as your account is active or as needed
              to provide our services, including transaction records and event
              participation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Security</h2>
            <p>
              We take reasonable measures to protect your data from unauthorised
              access or disclosure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">
              7. Changes to This Policy
            </h2>
            <p>
              We may update this policy from time to time. The latest version
              will always be posted on this page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">Contact</h2>
            <p>
              Questions about this policy or your data? Contact us at{" "}
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

export default PrivacyPolicy;
