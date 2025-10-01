import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Building2, GraduationCap } from "lucide-react";
import fdpBannerNAAC from "@/assets/fdp-banner-naac.jpg";
import fdpBannerNBA from "@/assets/fdp-banner-nba.jpg";

const FDPDetail = () => {
  const { id } = useParams();

  // Mock data - will be replaced with API call
  const fdpData: Record<string, any> = {
    "naac-2025": {
      title: "NAAC Accreditation Workshop 2025",
      banner: fdpBannerNAAC,
      startDate: "Jan 15, 2025",
      endDate: "Jan 17, 2025",
      timing: "9:00 AM - 5:00 PM IST",
      location: "Online (Zoom)",
      categories: ["NAAC", "Accreditation", "Quality Assurance"],
      hostFee: 5000,
      facultyFee: 1500,
      registeredCount: 145,
      description: "Comprehensive workshop on NAAC accreditation process, criteria, and best practices for quality enhancement in higher education institutions.",
      highlights: [
        "Understanding NAAC framework and criteria",
        "Documentation and evidence collection",
        "Self-assessment report preparation",
        "Mock peer team visits",
        "Best practices and case studies",
      ],
    },
    "nba-2025": {
      title: "NBA Program Accreditation Training",
      banner: fdpBannerNBA,
      startDate: "Feb 10, 2025",
      endDate: "Feb 12, 2025",
      timing: "9:00 AM - 5:00 PM IST",
      location: "Hybrid (Bangalore & Online)",
      categories: ["NBA", "Engineering", "Quality"],
      hostFee: 6000,
      facultyFee: 1800,
      registeredCount: 98,
      description: "In-depth training on NBA accreditation for engineering programs, focusing on outcome-based education and continuous quality improvement.",
      highlights: [
        "NBA framework and tier system",
        "Program outcomes and assessment",
        "Continuous quality improvement",
        "SAR preparation and documentation",
        "Interactive sessions with NBA experts",
      ],
    },
  };

  const fdp = fdpData[id || ""] || fdpData["naac-2025"];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        <img src={fdp.banner} alt={fdp.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-xl p-8 space-y-6 border border-border">
              <div className="flex flex-wrap gap-2">
                {fdp.categories.map((category: string) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>

              <h1 className="text-4xl font-bold">{fdp.title}</h1>

              <div className="grid sm:grid-cols-2 gap-4 py-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="font-medium text-foreground">
                      {fdp.startDate} - {fdp.endDate}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground">{fdp.location}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <Users className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-xs text-muted-foreground">Registered</div>
                    <div className="font-medium text-foreground">{fdp.registeredCount} Participants</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <svg className="h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <div className="text-xs text-muted-foreground">Timing</div>
                    <div className="font-medium text-foreground">{fdp.timing}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="text-2xl font-semibold mb-4">About This Program</h2>
                <p className="text-muted-foreground leading-relaxed">{fdp.description}</p>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="text-2xl font-semibold mb-4">Key Highlights</h2>
                <ul className="space-y-3">
                  {fdp.highlights.map((highlight: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Sidebar - Registration */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 border border-border sticky top-20 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">Registration Options</h3>
                
                {/* Host College */}
                <div className="bg-secondary rounded-lg p-6 mb-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-primary" />
                    <div>
                      <h4 className="font-semibold">Host College</h4>
                      <p className="text-xs text-muted-foreground">Register your institution</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    ₹{fdp.hostFee.toLocaleString()}
                  </div>
                  <Button variant="default" size="lg" className="w-full" asChild>
                    <Link to={`/register/host/${id}`}>Register as Host</Link>
                  </Button>
                </div>

                {/* Faculty */}
                <div className="bg-secondary rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-6 w-6 text-accent" />
                    <div>
                      <h4 className="font-semibold">Faculty Member</h4>
                      <p className="text-xs text-muted-foreground">Individual registration</p>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-accent">
                    ₹{fdp.facultyFee.toLocaleString()}
                  </div>
                  <Button variant="accent" size="lg" className="w-full" asChild>
                    <Link to={`/register/faculty/${id}`}>Register as Faculty</Link>
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="font-semibold mb-3">What's Included</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Access to all sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Study materials & resources
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Certificate of completion
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Community access
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Networking opportunities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-12 border-t border-border mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">© 2025 Aashvee Tech Research & Training LLP. All rights reserved.</p>
            <p className="text-sm">Empowering education through professional development</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FDPDetail;
