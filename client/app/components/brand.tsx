import { Link } from "react-router";

// Stacked wordmark in the style of Google Finance's logo: the large name
// over a lighter "Finance" line, with the site icon beside it. `compact` is
// the one-line version for the inner pages.
export function Brand({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Link
        to="/"
        aria-label="BoogleFinance home"
        className="inline-flex items-center gap-2 text-xl text-muted"
      >
        <img src="/favicon.svg" alt="" className="h-6 w-6" />
        <span className="flex items-baseline gap-1.5">
          <span className="font-medium">Boogle</span>
          <span className="font-light">Finance</span>
        </span>
      </Link>
    );
  }

  return (
    <div className="mb-8 flex items-center justify-center gap-5 text-muted sm:gap-7">
      <div className="leading-none">
        <p className="text-5xl font-medium tracking-tight sm:text-6xl">
          Boogle
        </p>
        {/* w-0 + min-w-full: the row takes its width from "Boogle" above, and
            the letters spread out to fill it, as in Google Finance's logo */}
        <p
          aria-label="Finance"
          className="mt-2 flex w-0 min-w-full justify-between text-[2.5rem] font-light sm:text-5xl"
        >
          {"Finance".split("").map((letter, i) => (
            <span key={i} aria-hidden="true">
              {letter}
            </span>
          ))}
        </p>
      </div>
      <img src="/favicon.svg" alt="" className="h-16 w-16 sm:h-20 sm:w-20" />
    </div>
  );
}
