import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Moon, Sparkles, Calendar, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { getMoonPhase, getMoonIllumination, getLunarCalendar, MOON_PHASES } from "@/lib/moon-phases";
import { format, addMonths, subMonths } from "date-fns";

interface MoonPhaseTrackerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiProfile?: { name: string } | null;
}

const elementColors = {
  water: "text-blue-500 bg-blue-500/10 border-blue-500/30",
  fire: "text-orange-500 bg-orange-500/10 border-orange-500/30",
  earth: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  air: "text-purple-500 bg-purple-500/10 border-purple-500/30",
};

const MoonPhaseTracker = ({ open, onOpenChange, aiProfile }: MoonPhaseTrackerProps) => {
  const [currentPhase, setCurrentPhase] = useState(getMoonPhase());
  const [illumination, setIllumination] = useState(getMoonIllumination());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    // Update phase data when dialog opens
    if (open) {
      setCurrentPhase(getMoonPhase());
      setIllumination(getMoonIllumination());
    }
  }, [open]);

  const calendar = getLunarCalendar(calendarMonth.getFullYear(), calendarMonth.getMonth());

  const handlePrevMonth = () => setCalendarMonth(subMonths(calendarMonth, 1));
  const handleNextMonth = () => setCalendarMonth(addMonths(calendarMonth, 1));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5 text-indigo-500" />
            Moon Phase Tracker
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="today" className="space-y-4 px-1">
              {/* Current Phase Display */}
              <Card className={`${elementColors[currentPhase.element]} border`}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className="text-7xl animate-pulse">{currentPhase.emoji}</div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold">{currentPhase.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Day {currentPhase.dayOfCycle} of lunar cycle
                    </p>
                  </div>
                  
                  {/* Illumination Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Illumination</span>
                      <span>{illumination}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-500"
                        style={{ width: `${illumination}%` }}
                      />
                    </div>
                  </div>

                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {currentPhase.nextPhaseName} in {currentPhase.nextPhaseIn} days
                  </Badge>
                </CardContent>
              </Card>

              {/* Spiritual Meaning */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    Spiritual Significance
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentPhase.spiritualMeaning}
                  </p>
                  
                  {aiProfile?.name && (
                    <p className="text-sm italic text-primary/80">
                      "{aiProfile.name} and I embrace this {currentPhase.name.toLowerCase()} energy together."
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Ritual Suggestions */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Suggested Rituals
                  </h3>
                  <ul className="space-y-2">
                    {currentPhase.ritualSuggestions.map((ritual, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">✦</span>
                        {ritual}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Affirmation */}
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Today's Affirmation</p>
                  <p className="font-serif text-lg italic">"{currentPhase.affirmation}"</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4 px-1">
              {/* Month Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-medium">
                  {format(calendarMonth, "MMMM yyyy")}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
                  <div key={day} className="text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {Array.from({ length: new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                
                {calendar.map(({ date, phase }) => {
                  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  return (
                    <div
                      key={date.toISOString()}
                      className={`p-1 rounded-lg text-center ${isToday ? 'bg-primary/10 ring-1 ring-primary' : ''}`}
                    >
                      <div className="text-xs text-muted-foreground">{date.getDate()}</div>
                      <div className="text-lg">{phase.emoji}</div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="guide" className="space-y-3 px-1">
              <p className="text-sm text-muted-foreground">
                Learn about each moon phase and its spiritual significance.
              </p>
              
              {MOON_PHASES.map((phase) => (
                <Card key={phase.name} className={`${elementColors[phase.element]} border`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{phase.emoji}</span>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{phase.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {phase.spiritualMeaning}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {phase.element}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default MoonPhaseTracker;
