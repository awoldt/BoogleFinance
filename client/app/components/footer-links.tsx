import { Link } from "react-router";

export function FooterLinks() {
  return (
    <nav className="flex items-center gap-5 text-sm text-muted">
      <Link to="/about" className="hover:text-link">
        About
      </Link>
      <Link to="/privacy" className="hover:text-link">
        Privacy
      </Link>
    </nav>
  );
}
