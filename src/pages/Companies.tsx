import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import CompanyCard from "@/components/company/CompanyCard";
import { Search, Filter, Building2 } from "lucide-react";

export default function Companies() {
  // Mock data for companies
  const companies = [
    {
      id: "1",
      name: "TechCorp Inc.",
      industry: "Software Development",
      location: "San Francisco, CA",
      size: "500-1000",
      description: "Leading technology company building innovative solutions for the future of work. We specialize in cloud computing, AI, and enterprise software.",
      openPositions: 12,
      rating: 4.8,
      founded: "2015",
    },
    {
      id: "2",
      name: "InnovateLabs",
      industry: "AI & Machine Learning",
      location: "New York, NY",
      size: "100-500",
      description: "Cutting-edge AI research and development company transforming industries worldwide with breakthrough machine learning technologies.",
      openPositions: 8,
      rating: 4.6,
      founded: "2018",
    },
    {
      id: "3",
      name: "DesignStudio",
      industry: "Design & Creative",
      location: "Remote",
      size: "50-100",
      description: "Award-winning design agency creating beautiful digital experiences for brands around the world. We focus on user-centered design.",
      openPositions: 5,
      rating: 4.9,
      founded: "2020",
    },
    {
      id: "4",
      name: "CloudTech Solutions",
      industry: "Cloud Infrastructure",
      location: "Austin, TX",
      size: "200-500",
      description: "Cloud infrastructure and DevOps solutions provider helping companies scale their operations with reliable, secure cloud platforms.",
      openPositions: 15,
      rating: 4.7,
      founded: "2016",
    },
    {
      id: "5",
      name: "Analytics Pro",
      industry: "Data Analytics",
      location: "Boston, MA",
      size: "100-200",
      description: "Data analytics and business intelligence company providing insights that drive strategic decision-making for Fortune 500 companies.",
      openPositions: 6,
      rating: 4.5,
      founded: "2017",
    },
    {
      id: "6",
      name: "AppWorks",
      industry: "Mobile Development",
      location: "Seattle, WA",
      size: "150-300",
      description: "Mobile-first development company creating innovative apps for iOS and Android. We specialize in consumer and enterprise mobile solutions.",
      openPositions: 9,
      rating: 4.6,
      founded: "2019",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="py-12 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-4">Discover Amazing Companies</h1>
          <p className="text-xl opacity-90 mb-8">Explore top employers and find your ideal workplace culture</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 p-4 rounded-lg bg-primary-foreground/10 backdrop-blur">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-foreground/70" />
                <Input
                  placeholder="Search companies..."
                  className="pl-10 h-12 bg-primary-foreground text-foreground"
                />
              </div>
              <Select>
                <SelectTrigger className="w-full md:w-48 h-12 bg-primary-foreground text-foreground">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Industries</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="premium" size="lg" className="h-12">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center mb-4">
                <Filter className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              
              {/* Company Size */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Company Size</h3>
                <div className="space-y-2">
                  {["1-50 employees", "51-200 employees", "201-1000 employees", "1000+ employees"].map((size) => (
                    <label key={size} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{size}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Industry</h3>
                <div className="space-y-2">
                  {["Technology", "Finance", "Healthcare", "Education", "E-commerce", "Consulting"].map((industry) => (
                    <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{industry}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Location</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="sf">San Francisco, CA</SelectItem>
                    <SelectItem value="ny">New York, NY</SelectItem>
                    <SelectItem value="austin">Austin, TX</SelectItem>
                    <SelectItem value="seattle">Seattle, WA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Company Rating</h3>
                <div className="space-y-2">
                  {["4.5+ stars", "4.0+ stars", "3.5+ stars", "3.0+ stars"].map((rating) => (
                    <label key={rating} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{rating}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full">
                Clear All Filters
              </Button>
            </div>
          </aside>

          {/* Companies List */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{companies.length} Companies Found</h2>
                <p className="text-muted-foreground">Discover your next workplace</p>
              </div>
              <Select defaultValue="rating">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="positions">Most Positions</SelectItem>
                  <SelectItem value="size">Company Size</SelectItem>
                  <SelectItem value="name">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {companies.map((company) => (
                <div key={company.id} className="animate-slide-up">
                  <CompanyCard company={company} />
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <Button variant="outline">Previous</Button>
                <Button variant="default">1</Button>
                <Button variant="outline">2</Button>
                <Button variant="outline">3</Button>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}