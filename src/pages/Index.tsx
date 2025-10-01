import Navbar from "@/components/Navbar";
import FDPCard from "@/components/FDPCard";
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

const Index = () => {
  const { data: fdpEvents, isLoading } = useQuery<FdpEvent[]>({
    queryKey: ["/api/fdp-events"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Faculty Development{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Programs
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Empower your institution with professional development workshops, accreditation training, and quality enhancement programs.
            </p>
          </div>
        </div>
      </section>

      {/* FDP Listings */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2" data-testid="heading-upcoming-events">Upcoming Events</h2>
            <p className="text-muted-foreground">Register your college or faculty members for our professional development programs</p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : fdpEvents && fdpEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {fdpEvents.map((event) => (
                <FDPCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  banner={event.bannerUrl || ""}
                  startDate={format(new Date(event.startDate), "MMM dd, yyyy")}
                  endDate={format(new Date(event.endDate), "MMM dd, yyyy")}
                  location={event.location || "Online"}
                  categories={event.categories || []}
                  hostFee={event.hostFee}
                  facultyFee={event.facultyFee}
                  registeredCount={0}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground" data-testid="text-no-events">
                No FDP events available at the moment. Check back soon!
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Expert Training</h3>
              <p className="text-muted-foreground">Learn from industry experts and experienced accreditation professionals</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Certification</h3>
              <p className="text-muted-foreground">Receive official certificates upon successful completion of programs</p>
            </div>

            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Networking</h3>
              <p className="text-muted-foreground">Connect with faculty members and institutions across the country</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
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

export default Index;
