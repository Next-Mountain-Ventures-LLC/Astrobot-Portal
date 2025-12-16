import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div>
          <h1 className="text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            404
          </h1>
          <p className="text-xl font-semibold text-foreground">Page Not Found</p>
        </div>

        <p className="text-muted-foreground">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        <Link to="/login">
          <Button className="gap-2 bg-accent hover:bg-accent/90">
            <Home className="w-4 h-4" />
            Return to Portal
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
