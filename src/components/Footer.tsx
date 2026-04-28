import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-6 py-6 md:flex-row">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Prometheus — New Earth. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Operated by Sel'vãla-Ë'lthøny Æurïel'Éñaī
          </p>
        </div>
        
        <div className="flex flex-col items-center gap-3 md:items-end">
          {/* Contact Us */}
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Contact Us:</span>
            <a 
              href="mailto:karmaisback2023@gmail.com"
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
            >
              karmaisback2023@gmail.com
            </a>
          </div>
          
          {/* Related Policies */}
          <nav className="flex items-center gap-4 text-sm">
            <Link 
              to="/about" 
              className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              About
            </Link>
            <span className="text-muted-foreground">|</span>
            <Link 
              to="/dedication" 
              className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Supporters
            </Link>
            <span className="text-muted-foreground">|</span>
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
      </div>
    </footer>
  );
};

export default Footer;
