import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Building2, 
  FileText, 
  Mail,
  TrendingUp,
  DollarSign
} from "lucide-react";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    {
      title: "Total FDPs",
      value: "8",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Registrations",
      value: "243",
      icon: Users,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Host Colleges",
      value: "45",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Revenue",
      value: "₹4.2L",
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage FDP events, registrations, and communications</p>
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
                {[
                  { type: "registration", text: "New faculty registration for NAAC Workshop", time: "5 min ago" },
                  { type: "payment", text: "Payment received from ABC Engineering College", time: "1 hour ago" },
                  { type: "registration", text: "Host college registered for NBA Training", time: "2 hours ago" },
                  { type: "feedback", text: "5 new feedback submissions received", time: "3 hours ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.text}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upcoming FDPs</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>NAAC Accreditation Workshop</span>
                    <span className="text-sm text-muted-foreground">Jan 15, 2025</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>NBA Program Training</span>
                    <span className="text-sm text-muted-foreground">Feb 10, 2025</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Create New FDP
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Bulk Email
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
                <Button variant="accent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Create New FDP
                </Button>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "NAAC Accreditation Workshop 2025",
                    date: "Jan 15-17, 2025",
                    registered: 145,
                    status: "Active",
                  },
                  {
                    title: "NBA Program Accreditation Training",
                    date: "Feb 10-12, 2025",
                    registered: 98,
                    status: "Active",
                  },
                ].map((event, index) => (
                  <div key={index} className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">{event.date}</p>
                      <p className="text-sm text-accent mt-1">{event.registered} registrations</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">View Details</Button>
                    </div>
                  </div>
                ))}
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
                {[
                  { name: "Dr. Rajesh Kumar", type: "Faculty", college: "ABC Engineering", event: "NAAC Workshop", status: "Confirmed" },
                  { name: "XYZ Institute of Tech", type: "Host", college: "-", event: "NBA Training", status: "Pending" },
                  { name: "Prof. Priya Sharma", type: "Faculty", college: "DEF College", event: "NAAC Workshop", status: "Confirmed" },
                ].map((reg, index) => (
                  <div key={index} className="bg-secondary/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{reg.name}</h3>
                        <p className="text-sm text-muted-foreground">{reg.type} • {reg.event}</p>
                        {reg.college !== "-" && <p className="text-xs text-muted-foreground">{reg.college}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          reg.status === "Confirmed" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                        }`}>
                          {reg.status}
                        </span>
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications" className="mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-6">Send Communication</h2>
              
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Recipients</Label>
                  <select className="w-full px-3 py-2 rounded-md bg-secondary border border-border">
                    <option>All Registered Participants</option>
                    <option>Host Colleges Only</option>
                    <option>Faculty Members Only</option>
                    <option>Specific FDP Participants</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input placeholder="Email subject" />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea placeholder="Enter your message..." rows={6} />
                </div>

                <div className="flex gap-4">
                  <Button variant="accent">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline">
                    Send WhatsApp
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
