 import { Mail } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { useNavigate } from 'react-router-dom';
 
 interface TransmissionsButtonProps {
   userId: string;
   displayName: string;
   variant?: 'profile' | 'compact';
 }
 
 export function TransmissionsButton({ userId, displayName, variant = 'profile' }: TransmissionsButtonProps) {
   const navigate = useNavigate();
 
   const handleClick = () => {
     navigate('/transmissions', { state: { recipientId: userId, recipientName: displayName } });
   };
 
   if (variant === 'compact') {
     return (
       <Button
         variant="outline"
         size="sm"
         onClick={handleClick}
         className="gap-2"
       >
         <Mail className="h-4 w-4" />
         Transmit
       </Button>
     );
   }
 
   return (
     <button
       onClick={handleClick}
       className="flex flex-col items-center gap-1 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
     >
       <span className="text-xs font-medium text-primary uppercase tracking-wider">
         Transmissions
       </span>
       <div className="p-3 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
         <Mail className="h-6 w-6 text-primary" />
       </div>
     </button>
   );
 }