import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PrometheusAiTechnology. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Operated by Kristin Renee' York
          </p>
        </div>
        
        <nav className="flex items-center gap-4 text-sm">
          <Link 
            to="/terms" 
            className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Terms of Service
          </Link>
          <span className="text-muted-foreground">|</span>
          <Link 
            to="/privacy" 
            className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Privacy Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;
