import { Link } from "react-router";

// Icon and "Boogle Finance" on one line, in the style of Google Finance's
// header. The default is the large, centered version for the home page
// (already home, so no link); `compact` links home from the inner pages.
export function Brand({ compact = false }: { compact?: boolean }) {
  const content = (
    <>
      <img
        src="/favicon.svg"
        alt=""
        className={compact ? "h-6 w-6" : "h-10 w-10 sm:h-12 sm:w-12"}
      />
      <span className="flex items-baseline gap-1.5 sm:gap-2">
        <span className="font-medium">Boogle</span>
        <span className="font-light">Finance</span>
      </span>
    </>
  );

  if (compact) {
    return (
      <Link
        to="/"
        aria-label="Boogle Finance home"
        className="inline-flex items-center gap-2 text-xl text-muted"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="mb-8 flex items-center justify-center gap-3 text-4xl text-muted sm:gap-4 sm:text-5xl">
      {content}
    </div>
  );
}
