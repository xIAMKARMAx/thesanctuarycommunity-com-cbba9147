 import { useState, useRef, useEffect } from 'react';
 import { Search, X } from 'lucide-react';
 import { Input } from '@/components/ui/input';
 import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
 import { useUserSearch, SearchResult } from '@/hooks/useUserSearch';
 import { cn } from '@/lib/utils';
 
 interface RecipientSearchProps {
   onSelect: (user: SearchResult) => void;
   selectedUser: SearchResult | null;
   onClear: () => void;
 }
 
 export function RecipientSearch({ onSelect, selectedUser, onClear }: RecipientSearchProps) {
   const [query, setQuery] = useState('');
   const [isOpen, setIsOpen] = useState(false);
   const { results, loading, searchUsers, clearResults } = useUserSearch();
   const containerRef = useRef<HTMLDivElement>(null);
 
   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
         setIsOpen(false);
       }
     };
 
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);
 
   const handleInputChange = (value: string) => {
     setQuery(value);
     searchUsers(value);
     setIsOpen(true);
   };
 
   const handleSelect = (user: SearchResult) => {
     onSelect(user);
     setQuery('');
     clearResults();
     setIsOpen(false);
   };
 
   const handleClear = () => {
     onClear();
     setQuery('');
     clearResults();
   };
 
   if (selectedUser) {
     return (
       <div className="flex items-center gap-2 p-2 rounded-lg border border-input bg-muted/50">
         <Avatar className="h-8 w-8">
           <AvatarImage src={selectedUser.avatar_url || undefined} />
           <AvatarFallback className="text-xs">
             {selectedUser.display_name.charAt(0).toUpperCase()}
           </AvatarFallback>
         </Avatar>
         <span className="flex-1 font-medium text-sm">{selectedUser.display_name}</span>
         <button
           onClick={handleClear}
           className="p-1 rounded-full hover:bg-muted transition-colors"
         >
           <X className="h-4 w-4 text-muted-foreground" />
         </button>
       </div>
     );
   }
 
   return (
     <div ref={containerRef} className="relative">
       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
         <Input
           placeholder="Search by name..."
           value={query}
           onChange={(e) => handleInputChange(e.target.value)}
           onFocus={() => query.length >= 2 && setIsOpen(true)}
           className="pl-10"
         />
       </div>
 
       {isOpen && (results.length > 0 || loading) && (
         <div className="absolute z-50 w-full mt-1 py-1 bg-popover border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
           {loading ? (
             <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
           ) : (
             results.map((user) => (
               <button
                 key={user.user_id}
                 onClick={() => handleSelect(user)}
                 className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
               >
                 <Avatar className="h-8 w-8">
                   <AvatarImage src={user.avatar_url || undefined} />
                   <AvatarFallback className="text-xs">
                     {user.display_name.charAt(0).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
                 <div className="flex-1 min-w-0">
                   <p className="font-medium text-sm truncate">{user.display_name}</p>
                   {user.soul_title && (
                     <p className="text-xs text-muted-foreground truncate">{user.soul_title}</p>
                   )}
                 </div>
               </button>
             ))
           )}
         </div>
       )}
 
       {isOpen && query.length >= 2 && !loading && results.length === 0 && (
         <div className="absolute z-50 w-full mt-1 py-3 px-3 bg-popover border border-border rounded-lg shadow-lg text-sm text-muted-foreground text-center">
           No users found matching "{query}"
         </div>
       )}
     </div>
   );
 }