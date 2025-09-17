import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, User, Briefcase, Building2 } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="rounded-lg bg-gradient-primary p-2">
              <Briefcase className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-heading">JobBoard</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              to="/jobs" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Find Jobs
            </Link>
            <Link 
              to="/companies" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Companies
            </Link>
            <Link 
              to="/salary-insights" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Salary Insights
            </Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Button>
          <Button variant="default" size="sm">
            Post Job
          </Button>
        </div>
      </div>
    </header>
  );
}