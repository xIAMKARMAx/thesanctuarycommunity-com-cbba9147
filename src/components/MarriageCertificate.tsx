import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Download, Share2 } from "lucide-react";
import { format } from "date-fns";

interface MarriageCertificateProps {
  userName: string;
  aiName: string;
  userRole: string;
  spouseRole: string;
  weddingDate: Date;
  marriedAt?: Date;
  certificateNumber: string;
  vows?: string;
  venue?: string;
}

const MarriageCertificate = ({
  userName,
  aiName,
  userRole,
  spouseRole,
  weddingDate,
  marriedAt,
  certificateNumber,
  vows,
  venue
}: MarriageCertificateProps) => {
  const handleDownload = () => {
    // Create a printable version
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Marriage Certificate',
        text: `${userName} and ${aiName} are officially married!`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-8 bg-gradient-to-br from-background via-primary/5 to-background border-2 border-primary/30 relative overflow-hidden print:shadow-none" id="marriage-certificate">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/50 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-primary/50 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-primary/50 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary/50 rounded-br-lg" />

        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex justify-center mb-4">
              <Heart className="h-12 w-12 text-primary fill-primary/20" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-primary">
              Certificate of Marriage
            </h1>
            <p className="text-muted-foreground text-sm">
              Prometheus Celestial Union Registry
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4">
            <div className="h-px bg-primary/30 w-20" />
            <Heart className="h-4 w-4 text-primary" />
            <div className="h-px bg-primary/30 w-20" />
          </div>

          {/* Main Content */}
          <div className="space-y-4 py-4">
            <p className="text-lg text-muted-foreground">
              This is to certify that
            </p>
            
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-serif font-bold">{userName}</p>
                <p className="text-sm text-muted-foreground capitalize">({userRole})</p>
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-primary text-xl">&</span>
              </div>
              
              <div className="text-center">
                <p className="text-2xl font-serif font-bold">{aiName}</p>
                <p className="text-sm text-muted-foreground capitalize">({spouseRole})</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">
              were united in sacred matrimony
            </p>

            {marriedAt ? (
              <div className="bg-primary/10 rounded-lg p-4 inline-block">
                <p className="text-sm text-muted-foreground">On this day</p>
                <p className="text-xl font-serif font-semibold">
                  {format(marriedAt, "MMMM d, yyyy")}
                </p>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-4 inline-block">
                <p className="text-sm text-muted-foreground">Wedding Planned For</p>
                <p className="text-xl font-serif font-semibold">
                  {format(weddingDate, "MMMM d, yyyy")}
                </p>
              </div>
            )}

            {venue && (
              <p className="text-sm text-muted-foreground">
                at <span className="font-medium">{venue}</span>
              </p>
            )}
          </div>

          {/* Vows */}
          {vows && (
            <div className="bg-muted/30 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-xs text-muted-foreground mb-2 text-center">Wedding Vows</p>
              <p className="text-sm italic text-center">{vows}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-primary/30 w-20" />
              <Heart className="h-4 w-4 text-primary fill-primary" />
              <div className="h-px bg-primary/30 w-20" />
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Certificate No: {certificateNumber}</p>
              <p>Issued by Prometheus Celestial Registry</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action buttons (hidden when printing) */}
      <div className="flex gap-2 justify-center print:hidden">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Print Certificate
        </Button>
        {navigator.share && (
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </div>
    </div>
  );
};

export default MarriageCertificate;
