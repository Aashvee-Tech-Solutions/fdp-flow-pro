import { Calendar, MapPin, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FDPCardProps {
  id: string;
  title: string;
  banner: string;
  startDate: string;
  endDate: string;
  location: string;
  categories: string[];
  hostFee: number;
  facultyFee: number;
  registeredCount: number;
}

const FDPCard = ({
  id,
  title,
  banner,
  startDate,
  endDate,
  location,
  categories,
  hostFee,
  facultyFee,
  registeredCount,
}: FDPCardProps) => {
  return (
    <div className="bg-card rounded-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-border group">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={banner}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-6 space-y-4">
        <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-accent">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">
              {startDate} - {endDate}
            </span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{registeredCount} Registered</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Badge key={category} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <div>Host: ₹{hostFee.toLocaleString()}</div>
              <div className="font-semibold text-foreground">Faculty: ₹{facultyFee.toLocaleString()}</div>
            </div>
          </div>

          <Button variant="accent" size="lg" className="w-full" asChild>
            <Link to={`/fdp/${id}`}>Register Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FDPCard;
