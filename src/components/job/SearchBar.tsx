import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Filter } from "lucide-react";

interface SearchBarProps {
  variant?: "hero" | "compact";
  onSearch?: (query: string, location: string, type: string) => void;
}

export default function SearchBar({ variant = "compact", onSearch }: SearchBarProps) {
  const isHero = variant === "hero";
  
  return (
    <div className={`w-full ${isHero ? "max-w-4xl mx-auto" : ""}`}>
      <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-lg border bg-card shadow-md ${isHero ? "md:p-6 shadow-lg" : ""}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Job title, keywords, or company"
            className={`pl-10 ${isHero ? "h-12 text-base" : ""}`}
          />
        </div>
        
        <div className="flex-1 relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="City, state, or zip code"
            className={`pl-10 ${isHero ? "h-12 text-base" : ""}`}
          />
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className={`w-full md:w-48 ${isHero ? "h-12" : ""}`}>
            <SelectValue placeholder="Job type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Job Types</SelectItem>
            <SelectItem value="full-time">Full Time</SelectItem>
            <SelectItem value="part-time">Part Time</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="remote">Remote</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant={isHero ? "hero" : "default"} 
          size={isHero ? "lg" : "default"}
          className="w-full md:w-auto"
        >
          <Search className="h-4 w-4 mr-2" />
          Search Jobs
        </Button>
      </div>
    </div>
  );
}