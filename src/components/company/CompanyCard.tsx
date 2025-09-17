import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapPin, Users, TrendingUp, Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface CompanyCardProps {
  company: {
    id: string;
    name: string;
    industry: string;
    location: string;
    size: string;
    description: string;
    openPositions: number;
    rating?: number;
    logo?: string;
    founded?: string;
  };
}

export default function CompanyCard({ company }: CompanyCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 bg-gradient-card">
      <CardHeader>
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
              {company.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
              <span className="font-medium text-primary">{company.industry}</span>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {company.location}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
          <div className="flex items-center text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            {company.size} employees
          </div>
          {company.founded && (
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-1" />
              Founded {company.founded}
            </div>
          )}
          {company.rating && (
            <Badge variant="secondary" className="bg-success-light text-success">
              ★ {company.rating}/5
            </Badge>
          )}
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2">
          {company.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-primary border-primary">
              {company.openPositions} open positions
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Profile
            </Button>
            <Button size="sm">
              View Jobs
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}