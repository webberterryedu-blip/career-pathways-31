import React, { useState, useEffect } from 'react';
import { Search, MapPin, Users, Globe, Building2, Star, Filter, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Company {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  location: string;
  industry: string;
  size: string;
  description: string;
  rating: number;
  review_count: number;
  open_positions: number;
  benefits: string[];
  culture_tags: string[];
  founded_year?: number;
  headquarters?: string;
  specialties: string[];
}

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Sample company data - will be replaced with Supabase integration
  useEffect(() => {
    const sampleCompanies: Company[] = [
      {
        id: '1',
        name: 'TechCorp Solutions',
        logo: '/placeholder.svg',
        website: 'https://techcorp.com',
        location: 'London, UK',
        industry: 'Technology',
        size: '100-500',
        description: 'Leading software development company specializing in enterprise solutions and digital transformation.',
        rating: 4.5,
        review_count: 128,
        open_positions: 12,
        benefits: ['Health Insurance', 'Remote Work', 'Professional Development', 'Stock Options'],
        culture_tags: ['Innovative', 'Collaborative', 'Fast-paced', 'Learning-focused'],
        founded_year: 2015,
        headquarters: 'London, UK',
        specialties: ['Software Development', 'Cloud Computing', 'AI/ML', 'Consulting']
      },
      {
        id: '2',
        name: 'Digital Marketing Pro',
        logo: '/placeholder.svg',
        website: 'https://digitalmarketingpro.com',
        location: 'Manchester, UK',
        industry: 'Marketing',
        size: '50-100',
        description: 'Full-service digital marketing agency helping businesses grow their online presence.',
        rating: 4.2,
        review_count: 76,
        open_positions: 8,
        benefits: ['Flexible Hours', 'Training Budget', 'Team Events', 'Performance Bonuses'],
        culture_tags: ['Creative', 'Results-driven', 'Client-focused', 'Dynamic'],
        founded_year: 2018,
        headquarters: 'Manchester, UK',
        specialties: ['SEO/SEM', 'Social Media', 'Content Marketing', 'Analytics']
      },
      {
        id: '3',
        name: 'Analytics Inc',
        logo: '/placeholder.svg',
        website: 'https://analytics-inc.com',
        location: 'Birmingham, UK',
        industry: 'Data & Analytics',
        size: '200-1000',
        description: 'Data analytics company providing insights and business intelligence solutions.',
        rating: 4.7,
        review_count: 203,
        open_positions: 15,
        benefits: ['Competitive Salary', 'Remote Option', 'Research Time', 'Conference Budget'],
        culture_tags: ['Data-driven', 'Research-oriented', 'Analytical', 'Innovative'],
        founded_year: 2012,
        headquarters: 'Birmingham, UK',
        specialties: ['Business Intelligence', 'Machine Learning', 'Data Visualization', 'Predictive Analytics']
      },
      {
        id: '4',
        name: 'GreenTech Innovations',
        logo: '/placeholder.svg',
        website: 'https://greentech-innovations.com',
        location: 'Bristol, UK',
        industry: 'Clean Technology',
        size: '50-200',
        description: 'Sustainable technology company developing renewable energy solutions.',
        rating: 4.6,
        review_count: 94,
        open_positions: 6,
        benefits: ['Green Commute', 'Sustainability Bonus', 'Learning Budget', 'Volunteer Days'],
        culture_tags: ['Purpose-driven', 'Environmental', 'Innovative', 'Collaborative'],
        founded_year: 2019,
        headquarters: 'Bristol, UK',
        specialties: ['Renewable Energy', 'Clean Tech', 'Sustainability', 'Engineering']
      }
    ];
    
    setCompanies(sampleCompanies);
    setLoading(false);
  }, []);

  const filteredCompanies = companies.filter(company => {
    return (
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) &&
    (industryFilter === '' || company.industry === industryFilter) &&
    (sizeFilter === '' || company.size === sizeFilter) &&
    (locationFilter === '' || company.location.includes(locationFilter));
  });

  const handleViewCompany = (companyId: string) => {
    navigate(`/companies/${companyId}`);
  };

  const handleViewJobs = (companyId: string) => {
    navigate(`/jobs?company=${companyId}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-400/50 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-gray-300" />);
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Discover Great Companies</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore company cultures, benefits, and opportunities. Find the perfect workplace that aligns with your values and career goals.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies, industries, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12">
                  <SelectValue placeholder="Industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                  <SelectItem value="Clean Technology">Clean Technology</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sizeFilter} onValueChange={setSizeFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12">
                  <SelectValue placeholder="Company Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sizes</SelectItem>
                  <SelectItem value="1-50">Startup (1-50)</SelectItem>
                  <SelectItem value="50-100">Small (50-100)</SelectItem>
                  <SelectItem value="100-500">Medium (100-500)</SelectItem>
                  <SelectItem value="500-1000">Large (500-1000)</SelectItem>
                  <SelectItem value="1000+">Enterprise (1000+)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full sm:w-48 h-12">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Locations</SelectItem>
                  <SelectItem value="London">London</SelectItem>
                  <SelectItem value="Manchester">Manchester</SelectItem>
                  <SelectItem value="Birmingham">Birmingham</SelectItem>
                  <SelectItem value="Bristol">Bristol</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="default" size="lg" className="h-12">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredCompanies.length} of {companies.length} companies
            </p>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p>Loading companies...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No companies found matching your criteria.</p>
            </div>
          ) : (
            filteredCompanies.map((company) => (
              <Card key={company.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <img 
                        src={company.logo} 
                        alt={company.name}
                        className="w-12 h-12 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <span className="hidden text-lg font-bold text-muted-foreground">
                        {company.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
                        {company.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          {company.industry}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {company.size} employees
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {renderStars(company.rating)}
                        <span className="text-sm font-medium ml-1">{company.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({company.review_count} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                    {company.website && (
                      <>
                        <Globe className="h-4 w-4 ml-2" />
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Website
                        </a>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {company.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {company.culture_tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {company.culture_tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{company.culture_tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {company.open_positions}
                      </span>
                      open positions
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewCompany(company.id);
                        }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewJobs(company.id);
                        }}
                      >
                        View Jobs
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Companies;