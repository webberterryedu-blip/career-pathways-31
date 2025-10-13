import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/NavigationContext';
import { Button } from '@/components/ui/button';

/**
 * UnifiedBreadcrumbs - Provides navigation context and hierarchy
 * Uses NavigationContext for consistent breadcrumb management
 */
export default function UnifiedBreadcrumbs() {
  const { breadcrumbs, canGoBack, goBack } = useNavigation();


  return (
    <div className="flex items-center gap-4">
      {/* Back button */}
      {canGoBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      )}

      {/* Breadcrumb navigation */}
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-1">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
                )}
                
                {isLast ? (
                  <span className="text-sm font-medium text-foreground flex items-center">
                    {item.icon && (
                      <span className="h-4 w-4 mr-1">
                        {React.createElement(item.icon as any, { className: "h-4 w-4" })}
                      </span>
                    )}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className={cn(
                      'text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center hover:bg-accent px-2 py-1 rounded-md'
                    )}
                  >
                    {item.icon && (
                      <span className="h-4 w-4 mr-1">
                        {React.createElement(item.icon as any, { className: "h-4 w-4" })}
                      </span>
                    )}
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}