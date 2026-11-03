import { Link } from "react-router";
import type { Route } from "./+types/privacy";
import { BackIcon } from "~/components/icons";
import { FooterLinks } from "~/components/footer-links";
import { seoMeta } from "~/lib/seo";
import { Brand } from "~/components/brand";
import { ThemeToggle } from "~/components/theme-toggle";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "Privacy · Boogle Finance",
    description:
      "What Boogle Finance collects, why, and the choices you have.",
  });
}

const sections = [
  {
    title: "Analytics",
    body: (
      <>
        <p>
          We use Google Analytics to understand how the site is used: which
          pages are visited, how people find us, and what kinds of devices and
          browsers they use. We use this only to improve the site, not to build
          a profile of you or to show you ads.
        </p>
        <p>
          Google Analytics sets cookies in your browser and receives details
          such as the pages you view, your browser and device type, and an
          approximate location based on your IP address. Google processes this
          data under its own{" "}
          <a
            href="https://policies.google.com/technologies/partner-sites"
            target="_blank"
            rel="noreferrer"
            className="text-link hover:underline"
          >
            privacy policy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    title: "Your watchlist",
    body: (
      <p>
        When you save a ticker, its symbol is stored in a cookie on your device
        so we can show your watchlist the next time you visit. It holds ticker
        symbols only, with no name, email, or account, and it stays in your
        browser for up to about 13 months or until you clear it.
      </p>
    ),
  },
  {
    title: "Your theme",
    body: (
      <p>
        If you choose light or dark mode, that choice is saved in your
        browser’s local storage. It never leaves your device.
      </p>
    ),
  },
  {
    title: "Searches and prices",
    body: (
      <p>
        When you search for a stock or open a ticker, the symbol or search term
        is sent to our server, which asks a market data provider for the
        prices. We don’t ask you to sign up or give us your name or email
        address.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="w-full px-[max(4rem,12vw)] py-8 min-[1280px]:px-[22vw]">
        <div className="mb-4">
          <Brand compact />
        </div>
        <Link
          to="/"
          className="-ml-2 inline-flex items-center gap-1 rounded-full py-1 pr-3 pl-1 text-sm font-medium text-link hover:bg-hover"
        >
          <BackIcon className="h-5 w-5" />
          Watchlist
        </Link>

        <h1 className="mt-6 text-2xl font-normal text-ink">Privacy</h1>
        <p className="mt-2 text-sm text-faint">Last updated November 2, 2026</p>

        <div className="mt-6 rounded-2xl border border-line bg-hero p-5 shadow-[var(--shadow)]">
          <p className="text-[15px] leading-relaxed text-ink">
            We keep this simple. We use analytics to see how the site is used,
            and a cookie to remember your watchlist. There are no accounts and
            no ads.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-base font-medium text-ink">
                {section.title}
              </h2>
              <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
          <FooterLinks />
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}
