import { useState } from "react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, DollarSign, BarChart3 } from "lucide-react";

const SalaryInsights = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");

  const salaryData = [
    {
      title: "Software Engineer",
      location: "London",
      salary: "£65,000 - £85,000",
      experience: "3-5 years",
      trend: "+8%",
      companies: 245
    },
    {
      title: "Data Scientist",
      location: "Manchester",
      salary: "£55,000 - £75,000",
      experience: "2-4 years",
      trend: "+12%",
      companies: 123
    },
    {
      title: "Product Manager",
      location: "Birmingham",
      salary: "£70,000 - £95,000",
      experience: "5-7 years",
      trend: "+6%",
      companies: 89
    },
    {
      title: "UX Designer",
      location: "Edinburgh",
      salary: "£45,000 - £65,000",
      experience: "2-5 years",
      trend: "+15%",
      companies: 156
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-heading mb-4">
            Salary Insights
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get data-driven salary insights to make informed career decisions
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Salary Data
            </CardTitle>
            <CardDescription>
              Find salary information for specific roles and locations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Job title or keyword"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger>
                  <SelectValue placeholder="Experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entry level (0-2 years)</SelectItem>
                  <SelectItem value="mid">Mid level (3-5 years)</SelectItem>
                  <SelectItem value="senior">Senior level (6+ years)</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">£58,750</div>
              <p className="text-xs text-muted-foreground">+2.5% from last year</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+9.2%</div>
              <p className="text-xs text-muted-foreground">Annual salary increase</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Points</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,450</div>
              <p className="text-xs text-muted-foreground">Salary reports analyzed</p>
            </CardContent>
          </Card>
        </div>

        {/* Salary Data Results */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Roles & Salaries</CardTitle>
            <CardDescription>
              Current salary ranges based on market data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salaryData.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{role.title}</h3>
                    <p className="text-sm text-muted-foreground">{role.location} • {role.experience}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">{role.salary}</p>
                      <p className="text-xs text-muted-foreground">{role.companies} companies</p>
                    </div>
                    <Badge variant={role.trend.startsWith('+') ? 'default' : 'secondary'}>
                      {role.trend}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SalaryInsights;