import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import SearchBar from "@/components/job/SearchBar";
import JobCard from "@/components/job/JobCard";
import CompanyCard from "@/components/company/CompanyCard";
import { TrendingUp, Users, Star, ArrowRight, Briefcase, Building2, Search } from "lucide-react";
import heroImage from "@/assets/hero-job-board.jpg";

const Index = () => {
  // Mock data for demonstration
  const featuredJobs = [
    {
      id: "1",
      title: "Senior Frontend Developer",
      company: "TechCorp Inc.",
      location: "San Francisco, CA",
      type: "Full Time",
      salary: "$120k - $160k",
      description: "Join our dynamic team building next-generation web applications with React, TypeScript, and modern technologies.",
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
      description: "Lead product strategy and roadmap for our AI-powered analytics platform. Work with cross-functional teams.",
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
      description: "Create intuitive user experiences for our mobile and web applications. Collaborate with product and engineering teams.",
      postedDate: "3 days ago",
      tags: ["Figma", "User Research", "Prototyping", "Mobile"],
      isRemote: true,
    },
  ];

  const topCompanies = [
    {
      id: "1",
      name: "TechCorp Inc.",
      industry: "Software Development",
      location: "San Francisco, CA",
      size: "500-1000",
      description: "Leading technology company building innovative solutions for the future of work.",
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
      description: "Cutting-edge AI research and development company transforming industries worldwide.",
      openPositions: 8,
      rating: 4.6,
      founded: "2018",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gradient-hero opacity-95"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlendMode: 'overlay'
          }}
        />
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold font-heading text-primary-foreground mb-6 animate-fade-in">
              Find Your Dream Job
              <span className="block text-3xl lg:text-5xl mt-2">Build Your Career</span>
            </h1>
            <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8 animate-slide-up">
              Connect with top companies and discover opportunities that match your skills and ambitions
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <Badge variant="secondary" className="text-lg py-2 px-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                <TrendingUp className="h-5 w-5 mr-2" />
                50,000+ Active Jobs
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                <Users className="h-5 w-5 mr-2" />
                10,000+ Companies
              </Badge>
              <Badge variant="secondary" className="text-lg py-2 px-4 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                <Star className="h-5 w-5 mr-2" />
                4.8/5 Success Rate
              </Badge>
            </div>
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-4">Featured Jobs</h2>
            <p className="text-xl text-muted-foreground">Discover opportunities from top companies</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredJobs.map((job) => (
              <div key={job.id} className="animate-slide-up">
                <JobCard job={job} />
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              View All Jobs
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Top Companies Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-4">Top Companies</h2>
            <p className="text-xl text-muted-foreground">Join industry leaders and innovative startups</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {topCompanies.map((company) => (
              <div key={company.id} className="animate-slide-up">
                <CompanyCard company={company} />
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg">
              View All Companies
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold font-heading mb-4">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of professionals who found their perfect job</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="premium" size="xl">
              <Search className="h-5 w-5 mr-2" />
              Find Jobs
            </Button>
            <Button variant="outline" size="xl" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Building2 className="h-5 w-5 mr-2" />
              Post a Job
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="rounded-lg bg-gradient-primary p-2">
                  <Briefcase className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold font-heading">JobBoard</span>
              </div>
              <p className="text-muted-foreground">Connecting talent with opportunity</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Job Seekers</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Browse Jobs</div>
                <div>Salary Insights</div>
                <div>Career Advice</div>
                <div>Resume Builder</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Employers</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>Post Jobs</div>
                <div>Browse Candidates</div>
                <div>Pricing</div>
                <div>Analytics</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <div className="space-y-2 text-muted-foreground">
                <div>About Us</div>
                <div>Contact</div>
                <div>Privacy Policy</div>
                <div>Terms of Service</div>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 JobBoard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
