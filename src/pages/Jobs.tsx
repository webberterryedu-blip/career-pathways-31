import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import Header from "@/components/layout/Header";
import SearchBar from "@/components/job/SearchBar";
import JobCard from "@/components/job/JobCard";
import { Filter, SlidersHorizontal, MapPin, DollarSign } from "lucide-react";

export default function Jobs() {
  const [salaryRange, setSalaryRange] = useState([50000]);
  
  // Mock data for jobs
  const jobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      type: "Full Time",
      salary: "$120k - $160k",
      description: "Join our dynamic team building next-generation web applications with React, TypeScript, and modern technologies. We're looking for someone passionate about creating exceptional user experiences.",
      postedDate: "2 days ago",
      tags: ["React", "TypeScript", "GraphQL", "AWS"],
      isRemote: true,
    },
    {
      id: "2",
      title: "Product Manager",
      company: "InnovateLabs",
      location: "New York, NY",
      type: "Full Time",
      salary: "$110k - $140k",
      description: "Lead product strategy and roadmap for our AI-powered analytics platform. Work with cross-functional teams to deliver innovative solutions.",
      postedDate: "1 week ago",
      tags: ["Strategy", "Analytics", "AI", "Leadership"],
      isRemote: false,
    },
    {
      id: "3",
      title: "UX Designer",
      company: "DesignStudio",
      location: "Remote",
      type: "Contract",
      salary: "$80k - $100k",
      description: "Create intuitive user experiences for our mobile and web applications. Collaborate with product and engineering teams to solve complex design challenges.",
      postedDate: "3 days ago",
      tags: ["Figma", "User Research", "Prototyping", "Mobile"],
      isRemote: true,
    },
    {
      id: "4",
      title: "DevOps Engineer",
      company: "CloudTech Solutions",
      location: "Austin, TX",
      type: "Full Time",
      salary: "$100k - $130k",
      description: "Build and maintain scalable cloud infrastructure. Work with containerization, CI/CD pipelines, and monitoring systems.",
      postedDate: "5 days ago",
      tags: ["AWS", "Docker", "Kubernetes", "Terraform"],
      isRemote: true,
    },
    {
      id: "5",
      title: "Data Scientist",
      company: "Analytics Pro",
      location: "Boston, MA",
      type: "Full Time",
      salary: "$95k - $125k",
      description: "Analyze large datasets to derive actionable insights. Build machine learning models and work with stakeholders to drive business decisions.",
      postedDate: "1 week ago",
      tags: ["Python", "ML", "Statistics", "SQL"],
      isRemote: false,
    },
    {
      id: "6",
      title: "Mobile Developer",
      company: "AppWorks",
      location: "Seattle, WA",
      type: "Full Time",
      salary: "$105k - $135k",
      description: "Develop native mobile applications for iOS and Android. Work with modern frameworks and contribute to app architecture decisions.",
      postedDate: "4 days ago",
      tags: ["React Native", "iOS", "Android", "TypeScript"],
      isRemote: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Page Header */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold font-heading mb-2">Find Your Perfect Job</h1>
            <p className="text-xl text-muted-foreground">Discover opportunities that match your skills and career goals</p>
          </div>
          <SearchBar />
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 space-y-6">
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <div className="flex items-center mb-4">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Filters</h2>
              </div>
              
              {/* Job Type Filter */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Job Type</h3>
                <div className="space-y-2">
                  {["Full Time", "Part Time", "Contract", "Freelance", "Internship"].map((type) => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Experience Level</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead/Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Range */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Salary Range</h3>
                <div className="space-y-3">
                  <Slider
                    value={salaryRange}
                    onValueChange={setSalaryRange}
                    max={200000}
                    min={30000}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$30k</span>
                    <span className="font-medium text-foreground">${salaryRange[0].toLocaleString()}</span>
                    <span>$200k+</span>
                  </div>
                </div>
              </div>

              {/* Remote Options */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Work Location</h3>
                <div className="space-y-2">
                  {["Remote", "Hybrid", "On-site"].map((location) => (
                    <label key={location} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Company Size */}
              <div className="mb-6">
                <h3 className="font-medium mb-3">Company Size</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-50)</SelectItem>
                    <SelectItem value="small">Small (51-200)</SelectItem>
                    <SelectItem value="medium">Medium (201-1000)</SelectItem>
                    <SelectItem value="large">Large (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="outline" className="w-full">
                Clear All Filters
              </Button>
            </div>
          </aside>

          {/* Jobs List */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">{jobs.length} Jobs Found</h2>
                <p className="text-muted-foreground">Showing results for your search</p>
              </div>
              <Select defaultValue="recent">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="relevant">Most Relevant</SelectItem>
                  <SelectItem value="salary-high">Salary (High to Low)</SelectItem>
                  <SelectItem value="salary-low">Salary (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="animate-slide-up">
                  <JobCard job={job} />
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