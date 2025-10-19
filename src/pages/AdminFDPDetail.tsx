import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  Building2, 
  Mail, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Loader2,
  ArrowLeft,
  Share2,
  BellRing,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";

const AdminFDPDetail = () => {
  const { id: fdpId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin");
    }
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab")!);
    }
  }, [navigate, searchParams]);

  const { data: fdp, isLoading: isLoadingFdp } = useQuery<any>({
    queryKey: [`/api/fdp-events/${fdpId}`],
    enabled: !!fdpId && !!localStorage.getItem("admin_token"),
  });

  const { data: hostColleges = [], isLoading: isLoadingHostColleges } = useQuery<any[]>({
    queryKey: [`/api/fdp-events/${fdpId}/host-colleges`],
    enabled: !!fdpId && !!localStorage.getItem("admin_token") && activeTab === "registrations",
  });

  const { data: facultyRegistrations = [], isLoading: isLoadingFacultyRegistrations } = useQuery<any[]>({
    queryKey: [`/api/fdp-events/${fdpId}/faculty`],
    enabled: !!fdpId && !!localStorage.getItem("admin_token") && activeTab === "registrations",
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<any>({
    queryKey: [`/api/fdp-events/${fdpId}/analytics`],
    enabled: !!fdpId && !!localStorage.getItem("admin_token") && activeTab === "overview",
  });

  const sendReminderMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/communications/send-reminders/${fdpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to send reminders");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Reminders sent to ${data.sent} participants.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to send reminders", variant: "destructive" });
    },
  });

  const shareCommunityMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/communications/share-community/${fdpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to share community link");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Community link shared with ${data.sent} participants.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to share community link", variant: "destructive" });
    },
  });

  const shareFeedbackMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/communications/share-feedback/${fdpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to share feedback link");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Feedback link shared with ${data.sent} participants.` });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to share feedback link", variant: "destructive" });
    },
  });

  const bulkGenerateCertificatesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/certificates/bulk-generate/${fdpId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to bulk generate certificates");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: `Bulk certificate generation initiated. ${data.results.filter((r:any) => r.status === 'generated').length} new certificates generated.` });
      queryClient.invalidateQueries({ queryKey: [`/api/fdp-events/${fdpId}/analytics`] });
      queryClient.invalidateQueries({ queryKey: [`/api/fdp-events/${fdpId}/faculty`] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to bulk generate certificates", variant: "destructive" });
    },
  });

  if (isLoadingFdp) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading FDP details...</p>
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
          <p className="text-muted-foreground mb-8">The FDP event you are looking for does not exist.</p>
          <Button onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const allRegistrations = [
    ...hostColleges.map(hc => ({
      id: hc.id,
      name: hc.collegeName,
      type: "Host College",
      email: hc.email,
      phone: hc.phone,
      status: hc.paymentStatus === "completed" ? "Confirmed" : "Pending",
      registeredAt: hc.registeredAt,
    })),
    ...facultyRegistrations.map(fr => ({
      id: fr.id,
      name: fr.name,
      type: "Faculty",
      email: fr.email,
      phone: fr.phone,
      institution: fr.institution,
      status: fr.paymentStatus === "completed" ? "Confirmed" : "Pending",
      registeredAt: fr.registeredAt,
      certificateGenerated: fr.certificateGenerated,
      certificateUrl: fr.certificateUrl,
    }))
  ].sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="outline" onClick={() => navigate("/admin/dashboard")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{fdp.title}</h1>
          <p className="text-muted-foreground">Manage details, registrations, and communications for this FDP</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setSearchParams({ tab: value });
        }}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
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
              <h2 className="text-2xl font-semibold mb-4">FDP Details</h2>
              <div className="grid md:grid-cols-2 gap-4 text-muted-foreground">
                <div>
                  <p><strong>Category:</strong> {fdp.category}</p>
                  <p><strong>Start Date:</strong> {format(new Date(fdp.startDate), "MMM dd, yyyy HH:mm")}</p>
                  <p><strong>End Date:</strong> {format(new Date(fdp.endDate), "MMM dd, yyyy HH:mm")}</p>
                  <p><strong>Host Fee:</strong> ₹{fdp.hostFee}</p>
                  <p><strong>Faculty Fee:</strong> ₹{fdp.facultyFee}</p>
                </div>
                <div>
                  <p><strong>Max Participants:</strong> {fdp.maxParticipants || "N/A"}</p>
                  <p><strong>Status:</strong> {fdp.status}</p>
                  <p><strong>Joining Link:</strong> {fdp.joiningLink ? <a href={fdp.joiningLink} target="_blank" className="text-primary underline">View</a> : "N/A"}</p>
                  <p><strong>WhatsApp Group:</strong> {fdp.whatsappGroupLink ? <a href={fdp.whatsappGroupLink} target="_blank" className="text-primary underline">Join</a> : "N/A"}</p>
                  <p><strong>Feedback Form:</strong> {fdp.feedbackFormLink ? <a href={fdp.feedbackFormLink} target="_blank" className="text-primary underline">View</a> : "N/A"}</p>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Description:</h3>
                <p className="text-muted-foreground">{fdp.description}</p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Analytics</h2>
              {isLoadingAnalytics ? (
                <div className="text-center py-4">
                  <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading analytics...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Faculty</p>
                      <p className="text-xl font-bold">{analytics.totalFaculty}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Host Colleges</p>
                      <p className="text-xl font-bold">{analytics.totalHostColleges}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-xl font-bold">₹{analytics.totalRevenue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Certificates Generated</p>
                      <p className="text-xl font-bold">{analytics.certificatesGenerated}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Registrations Tab */}
          <TabsContent value="registrations" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">All Registrations</h2>
              
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
                    <p>No registrations for this FDP yet.</p>
                  </div>
                ) : (
                  allRegistrations.map((reg, index) => (
                    <div key={index} className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{reg.name}</h3>
                          <p className="text-sm text-muted-foreground">{reg.type}</p>
                          {reg.institution && <p className="text-xs text-muted-foreground">{reg.institution}</p>}
                          <p className="text-xs text-muted-foreground">Email: {reg.email} | Phone: {reg.phone}</p>
                          <p className="text-xs text-muted-foreground">Registered: {format(new Date(reg.registeredAt), "MMM dd, yyyy HH:mm")}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            reg.status === "Confirmed" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                          }`}>
                            {reg.status}
                          </span>
                          {reg.type === "Faculty" && reg.certificateGenerated && reg.certificateUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={reg.certificateUrl} target="_blank" rel="noopener noreferrer">
                                View Certificate
                              </a>
                            </Button>
                          )}
                          <Button variant="outline" size="sm">Details</Button>
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
              <h2 className="text-2xl font-semibold mb-6">Send Communications & Certificates</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BellRing className="h-5 w-5 text-primary" />
                      Send Reminders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send a reminder email and WhatsApp message to all confirmed participants for this FDP.
                    </p>
                    <Button 
                      onClick={() => sendReminderMutation.mutate()} 
                      disabled={sendReminderMutation.isPending} 
                      className="w-full"
                    >
                      {sendReminderMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
                      Send Reminders
                    </Button>
                  </CardContent>
                </Card>

                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-accent" />
                      Share Community Link
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share the FDP's community group link via email and WhatsApp to all confirmed participants.
                    </p>
                    <Button 
                      onClick={() => shareCommunityMutation.mutate()} 
                      disabled={shareCommunityMutation.isPending || !fdp.communityLink} 
                      className="w-full"
                      variant="accent"
                    >
                      {shareCommunityMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                      Share Community Link
                    </Button>
                    {!fdp.communityLink && <p className="text-xs text-red-500 mt-2">No community link set for this FDP.</p>}
                  </CardContent>
                </Card>

                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Share Feedback Form
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Send the feedback form link via email and WhatsApp to all confirmed participants.
                    </p>
                    <Button 
                      onClick={() => shareFeedbackMutation.mutate()} 
                      disabled={shareFeedbackMutation.isPending || !fdp.feedbackFormLink} 
                      className="w-full"
                    >
                      {shareFeedbackMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                      Share Feedback Form
                    </Button>
                    {!fdp.feedbackFormLink && <p className="text-xs text-red-500 mt-2">No feedback form link set for this FDP.</p>}
                  </CardContent>
                </Card>

                <Card className="p-4">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      Bulk Generate Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Generate and send certificates to all eligible participants who have completed feedback.
                    </p>
                    <Button 
                      onClick={() => bulkGenerateCertificatesMutation.mutate()} 
                      disabled={bulkGenerateCertificatesMutation.isPending} 
                      className="w-full"
                      variant="accent"
                    >
                      {bulkGenerateCertificatesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                      Generate Certificates
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminFDPDetail;