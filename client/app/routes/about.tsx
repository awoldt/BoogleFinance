import { Link } from "react-router";
import type { Route } from "./+types/about";
import { BackIcon } from "~/components/icons";
import { Brand } from "~/components/brand";
import { FooterLinks } from "~/components/footer-links";
import { ThemeToggle } from "~/components/theme-toggle";
import { seoMeta } from "~/lib/seo";

export function meta({}: Route.MetaArgs) {
  return seoMeta({
    title: "About · Boogle Finance",
    description:
      "Boogle Finance is a tribute to the old Google Finance: the clean stock watchlist you remember, with no account needed.",
  });
}

export default function About() {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="w-full px-4 py-6 sm:px-10 sm:py-8 md:px-[max(4rem,12vw)] min-[1280px]:px-[22vw]">
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

        <h1 className="mt-6 text-2xl font-normal text-ink">About</h1>

        <article className="mt-6 space-y-5 text-[15px] leading-relaxed text-ink">
          <p>
            Google finance was once the best stock watchlist app on the
            internet. It was so clean, so beautiful, so.... perfect.
          </p>
          <p>
            Then out of nowhere, Google decided that it was a great idea to
            replace it with this garbage redesign.
          </p>

          <figure>
            <img
              src="/new%20google%20finance%20ui.webp"
              alt="Screenshot of the new Google Finance: a dark, crowded layout with lists and portfolios on the left, an NVIDIA chart and earnings in the middle, and an AI research panel on the right."
              width={1794}
              height={1090}
              loading="lazy"
              className="w-full rounded-2xl border border-line shadow-[var(--shadow)]"
            />
          </figure>

          <p>
            Look how they massacred my boy. Everytime I visited this new slop
            version of Google Finance I wanted to cry almost. It went from the
            single greatest stock watchlist app on the entire internet to
            something that I don't even recognize anymore. The new ui is
            cluttered, overly complicated, and shoves AI down your throat for
            no reason. Whoever gave the greenlight at Google to replace the old
            design should be fired and investigated.
          </p>
          <p>
            Boogle Finance serves as a site where people who loved the old
            Google Finance and visit and relive the good old days. I created
            this to mimic the old design as close as possible, with the nice
            added feature of not having to sign into any account to save stocks
            to your watchlist. Everything is stored in browser, fast,
            responsive, and with accurate market data.
          </p>
          <p className="pt-4 text-center text-lg text-muted">
            🪦 RIP Google Finance 2006-2026
          </p>
        </article>

        <div className="mt-10 flex items-center justify-between border-t border-line pt-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <FooterLinks />
            <a
              href="https://awoldt.dev"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted hover:text-link"
            >
              Made by awoldt
            </a>
          </div>
          <ThemeToggle />
        </div>
      </main>
    </div>
  );
}
