import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Building2, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface FdpEvent {
  id: string;
  title: string;
  description: string;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  categories: string[] | null;
  hostFee: number;
  facultyFee: number;
  whatsappGroupLink: string | null;
}

const FDPDetail = () => {
  const { id } = useParams();

  const { data: fdp, isLoading } = useQuery<FdpEvent>({
    queryKey: [`/api/fdp-events/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!fdp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">FDP Event Not Found</h1>
          <p className="text-muted-foreground mb-8">The event you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative h-96 overflow-hidden">
        {fdp.bannerUrl ? (
          <img src={fdp.bannerUrl} alt={fdp.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-xl p-8 space-y-6 border border-border">
              <div className="flex flex-wrap gap-2">
                {fdp.categories && fdp.categories.length > 0 ? (
                  fdp.categories.map((category: string) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))
                ) : null}
              </div>

              <h1 className="text-4xl font-bold" data-testid="heading-fdp-title">{fdp.title}</h1>

              <div className="grid sm:grid-cols-2 gap-4 py-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-xs text-muted-foreground">Date</div>
                    <div className="font-medium text-foreground" data-testid="text-dates">
                      {format(new Date(fdp.startDate), "MMM dd, yyyy")} - {format(new Date(fdp.endDate), "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-accent" />
                  <div>
                    <div className="text-xs text-muted-foreground">Location</div>
                    <div className="font-medium text-foreground" data-testid="text-location">{fdp.location || "Online"}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <h2 className="text-2xl font-semibold mb-4">About This Program</h2>
                <p className="text-muted-foreground leading-relaxed">{fdp.description}</p>
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
