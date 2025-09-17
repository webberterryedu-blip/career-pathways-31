import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MapPin, Clock, DollarSign, Building2, Bookmark, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

interface JobCardProps {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary?: string;
    description: string;
    postedDate: string;
    tags: string[];
    isRemote?: boolean;
    companyLogo?: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-primary/20 bg-gradient-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="text-muted-foreground font-medium">{job.company}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {job.location}
            {job.isRemote && <Badge variant="secondary" className="ml-2">Remote</Badge>}
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {job.postedDate}
          </div>
          {job.salary && (
            <div className="flex items-center text-success font-medium">
              <DollarSign className="h-4 w-4 mr-1" />
              {job.salary}
            </div>
          )}
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-2">
          {job.description}
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{job.type}</Badge>
          {job.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
          {job.tags.length > 3 && (
            <Badge variant="outline">+{job.tags.length - 3} more</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Details
          </Button>
          <Button className="flex-1">
            Apply Now
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}