import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import CreateFDPDialog from "@/components/CreateFDPDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  Mail,
  TrendingUp,
  DollarSign,
  LogOut,
  Eye
} from "lucide-react";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch FDP events
  const { data: events = [], isLoading: isLoadingEvents } = useQuery<any[]>({
    queryKey: ["/api/fdp-events"],
    enabled: !!localStorage.getItem("admin_token"),
  });

  // Fetch Host Colleges
  const { data: hostColleges = [], isLoading: isLoadingHostColleges } = useQuery<any[]>({
    queryKey: ["/api/host-colleges"], // Assuming a route to fetch all host colleges for admin overview
    enabled: !!localStorage.getItem("admin_token") && activeTab === "registrations",
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/host-colleges-all", { // New route needed for all host colleges
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch host colleges");
      return response.json();
    }
  });

  // Fetch Faculty Registrations
  const { data: facultyRegistrations = [], isLoading: isLoadingFacultyRegistrations } = useQuery<any[]>({
    queryKey: ["/api/faculty-registrations-all"], // New route needed for all faculty registrations
    enabled: !!localStorage.getItem("admin_token") && activeTab === "registrations",
    queryFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/faculty-registrations-all", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch faculty registrations");
      return response.json();
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_email");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/admin");
  };

  // Placeholder stats - these would ideally come from an analytics API
  const totalFDPs = events.length;
  const totalHostColleges = hostColleges.length;
  const totalFaculty = facultyRegistrations.length;
  const totalRegistrations = totalHostColleges + totalFaculty; // Simple sum, actual logic might be more complex
  const totalRevenue = "₹" + (events.reduce((sum, event) => sum + (parseFloat(event.hostFee) || 0) + (parseFloat(event.facultyFee) || 0), 0)).toLocaleString(); // This is a very rough estimate, actual revenue should come from payments table

  const stats = [
    {
      title: "Total FDPs",
      value: totalFDPs.toString(),
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Registrations",
      value: totalRegistrations.toString(),
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Host Colleges",
      value: totalHostColleges.toString(),
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Estimated Revenue",
      value: totalRevenue,
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  const allRegistrations = [
    ...hostColleges.map(hc => ({
      id: hc.id,
      name: hc.collegeName,
      type: "Host College",
      event: events.find(e => e.id === hc.fdpId)?.title || "N/A",
      status: hc.paymentStatus === "completed" ? "Confirmed" : "Pending",
      email: hc.email,
      phone: hc.phone,
      fdpId: hc.fdpId,
    })),
    ...facultyRegistrations.map(fr => ({
      id: fr.id,
      name: fr.name,
      type: "Faculty",
      college: fr.institution,
      event: events.find(e => e.id === fr.fdpId)?.title || "N/A",
      status: fr.paymentStatus === "completed" ? "Confirmed" : "Pending",
      email: fr.email,
      phone: fr.phone,
      fdpId: fr.fdpId,
    }))
  ].sort((a, b) => new Date(b.registeredAt || 0).getTime() - new Date(a.registeredAt || 0).getTime()); // Assuming registeredAt exists

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage FDP events, registrations, and communications</p>
          </div>
          <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="registrations" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Registrations</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Communications</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {allRegistrations.slice(0, 5).map((reg, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">
                        {reg.type === "Host College" ? `New host college registration: ${reg.name} for ${reg.event}` : `New faculty registration: ${reg.name} for ${reg.event}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{format(new Date(reg.registeredAt || new Date()), "MMM dd, yyyy HH:mm")}</p>
                    </div>
                  </div>
                ))}
                {allRegistrations.length === 0 && (
                  <p className="text-center text-muted-foreground">No recent registrations.</p>
                )}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upcoming FDPs</h3>
                <div className="space-y-3">
                  {isLoadingEvents ? (
                    <p className="text-muted-foreground">Loading upcoming events...</p>
                  ) : events.filter((e: any) => new Date(e.startDate) > new Date()).length > 0 ? (
                    events.filter((e: any) => new Date(e.startDate) > new Date()).map((event: any) => (
                      <div key={event.id} className="flex justify-between items-center">
                        <span>{event.title}</span>
                        <span className="text-sm text-muted-foreground">{format(new Date(event.startDate), "MMM dd, yyyy")}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No upcoming FDPs.</p>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <CreateFDPDialog />
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/communications">
                      <Mail className="h-4 w-4 mr-2" />
                      Send Bulk Communication
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Reports
                  </Button>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Manage FDP Events</h2>
                <CreateFDPDialog />
              </div>

              <div className="space-y-4">
                {isLoadingEvents ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                    <p>Loading FDP events...</p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No FDP events created yet</p>
                    <p className="text-sm">Create your first event to get started</p>
                  </div>
                ) : (
                  <>
                    {events.map((event: any) => (
                      <div key={event.id} className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold mb-1">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(event.startDate), "MMM dd, yyyy")} - {format(new Date(event.endDate), "MMM dd, yyyy")}
                          </p>
                          <p className="text-sm text-accent mt-1">{event.category} • ₹{event.facultyFee} per faculty</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/fdp/${event.id}`} data-testid={`button-view-fdp-${event.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Registration Management</h2>
              
              <div className="mb-4">
                <Input placeholder="Search registrations..." />
              </div>

              <div className="space-y-4">
                {(isLoadingHostColleges || isLoadingFacultyRegistrations) ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin opacity-50" />
                    <p>Loading registrations...</p>
                  </div>
                ) : allRegistrations.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No registrations found yet.</p>
                  </div>
                ) : (
                  allRegistrations.map((reg, index) => (
                    <div key={index} className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{reg.name}</h3>
                          <p className="text-sm text-muted-foreground">{reg.type} • {reg.event}</p>
                          {reg.college && <p className="text-xs text-muted-foreground">{reg.college}</p>}
                          <p className="text-xs text-muted-foreground">Email: {reg.email} | Phone: {reg.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            reg.status === "Confirmed" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          }`}>
                            {reg.status}
                          </span>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/fdp/${reg.fdpId}?tab=registrations&regId=${reg.id}`}>
                              Details
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Send Communication</h2>
              
              <p className="text-muted-foreground mb-4">
                Select an FDP event to send targeted communications (reminders, community links, feedback forms) to its participants.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="selectFdpForComm">Select FDP Event</Label>
                  <select 
                    id="selectFdpForComm"
                    className="w-full px-3 py-2 rounded-md bg-secondary border border-border"
                    onChange={(e) => navigate(`/admin/fdp/${e.target.value}?tab=communications`)}
                  >
                    <option value="">-- Select an FDP --</option>
                    {events.map((event: any) => (
                      <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                  </select>
                </div>
                <p className="text-muted-foreground text-sm">
                  You can manage specific communications for an FDP on its detail page.
                </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;