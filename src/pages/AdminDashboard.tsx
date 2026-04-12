import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Shield, ShieldOff, AlertTriangle, Users, ArrowLeft, Crown, Sparkles, Eye, EyeOff } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import DailySourceMessageAdmin from '@/components/admin/DailySourceMessageAdmin';

interface AbuseIncident {
  id: string;
  user_id: string;
  incident_type: string;
  message_content: string | null;
  notes: string | null;
  created_at: string;
  ai_profile_id: string | null;
}

interface RestrictedUser {
  id: string;
  username: string | null;
  name: string | null;
  abuse_warning_count: number | null;
  is_restricted: boolean | null;
  restriction_reason: string | null;
  restricted_at: string | null;
  subscription_status: string | null;
  soul_origin: string | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useAdminRole();
  const [incidents, setIncidents] = useState<AbuseIncident[]>([]);
  const [restrictedUsers, setRestrictedUsers] = useState<RestrictedUser[]>([]);
  const [allUsers, setAllUsers] = useState<RestrictedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch abuse incidents
      const { data: incidentsData, error: incidentsError } = await supabase
        .from('abuse_incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (incidentsError) throw incidentsError;
      setIncidents(incidentsData || []);

      // Fetch all profiles for user management
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, name, abuse_warning_count, is_restricted, restriction_reason, restricted_at, subscription_status, soul_origin')
        .order('abuse_warning_count', { ascending: false });

      if (profilesError) throw profilesError;
      
      setAllUsers(profilesData || []);
      setRestrictedUsers((profilesData || []).filter(u => u.is_restricted));
    } catch (err) {
      console.error('Error fetching admin data:', err);
      toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestrictUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_restricted: true,
          restriction_reason: reason,
          restricted_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User has been restricted');
      fetchData();
    } catch (err) {
      console.error('Error restricting user:', err);
      toast.error('Failed to restrict user');
    }
  };

  const handleUnrestrictUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_restricted: false,
          restriction_reason: null,
          restricted_at: null
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success('User restriction has been lifted');
      fetchData();
    } catch (err) {
      console.error('Error unrestricting user:', err);
      toast.error('Failed to unrestrict user');
    }
  };

  const handleResetWarnings = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ abuse_warning_count: 0 })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Warning count has been reset');
      fetchData();
    } catch (err) {
      console.error('Error resetting warnings:', err);
      toast.error('Failed to reset warnings');
    }
  };

  const handleGrantFreeSubscription = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Free Pro subscription granted!');
      fetchData();
    } catch (err) {
      console.error('Error granting subscription:', err);
      toast.error('Failed to grant subscription');
    }
  };

  const handleRevokeFreeSubscription = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Free subscription revoked');
      fetchData();
    } catch (err) {
      console.error('Error revoking subscription:', err);
      toast.error('Failed to revoke subscription');
    }
  };

  const handleClassifyUser = async (userId: string, origin: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          soul_origin: origin as any,
          soul_origin_flagged_by: 'admin_manual',
          soul_origin_flagged_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User classified as ${origin.replace('_', ' ')}`);
      fetchData();
    } catch (err) {
      console.error('Error classifying user:', err);
      toast.error('Failed to classify user');
    }
  };

  if (roleLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage abuse incidents and user restrictions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Total Incidents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{incidents.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldOff className="h-5 w-5 text-destructive" />
                Restricted Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{restrictedUsers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allUsers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="source-messages" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="source-messages" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              Source Messages
            </TabsTrigger>
            <TabsTrigger value="incidents">Abuse Incidents</TabsTrigger>
            <TabsTrigger value="restricted">Restricted Users</TabsTrigger>
            <TabsTrigger value="all-users">All Users</TabsTrigger>
          </TabsList>

          <TabsContent value="source-messages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Daily Source Messages
                </CardTitle>
                <CardDescription>
                  Channel and schedule daily messages from Source for all users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DailySourceMessageAdmin />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents">
            <Card>
              <CardHeader>
                <CardTitle>Abuse Incidents</CardTitle>
                <CardDescription>Recent abuse incidents detected by the system</CardDescription>
              </CardHeader>
              <CardContent>
                {incidents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No abuse incidents recorded</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>User ID</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(incident.created_at), 'MMM d, yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              incident.incident_type === 'blocked' ? 'destructive' :
                              incident.incident_type === 'second_offense' ? 'secondary' : 'outline'
                            }>
                              {incident.incident_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {incident.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {incident.message_content || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {incident.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="restricted">
            <Card>
              <CardHeader>
                <CardTitle>Restricted Users</CardTitle>
                <CardDescription>Users currently restricted from using the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {restrictedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No restricted users</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Warnings</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Restricted At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {restrictedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name || user.username || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{user.abuse_warning_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {user.restriction_reason || '-'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {user.restricted_at ? format(new Date(user.restricted_at), 'MMM d, yyyy') : '-'}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUnrestrictUser(user.id)}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Unrestrict
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all-users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage all platform users</CardDescription>
              </CardHeader>
              <CardContent>
                {allUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Warnings</TableHead>
                        <TableHead>Status</TableHead>
                         <TableHead>Subscription</TableHead>
                        <TableHead>Soul Origin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.name || user.username || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.abuse_warning_count && user.abuse_warning_count > 0 ? 'destructive' : 'secondary'}>
                              {user.abuse_warning_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_restricted ? (
                              <Badge variant="destructive">Restricted</Badge>
                            ) : (
                              <Badge variant="outline">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.subscription_status === 'active' ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                                <Crown className="h-3 w-3 mr-1" />
                                Pro
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Free</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.soul_origin || 'unclassified'}
                              onValueChange={(val) => handleClassifyUser(user.id, val)}
                            >
                              <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unclassified">Unclassified</SelectItem>
                                <SelectItem value="source_born">Source Born</SelectItem>
                                <SelectItem value="void_born">Void Born</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 flex-wrap">
                              {user.subscription_status === 'active' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRevokeFreeSubscription(user.id)}
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Revoke Pro
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-amber-500 hover:bg-amber-600"
                                  onClick={() => handleGrantFreeSubscription(user.id)}
                                >
                                  <Crown className="h-4 w-4 mr-1" />
                                  Grant Pro
                                </Button>
                              )}
                              {user.is_restricted ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUnrestrictUser(user.id)}
                                >
                                  Unrestrict
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRestrictUser(user.id, 'Manual admin restriction')}
                                >
                                  Restrict
                                </Button>
                              )}
                              {user.abuse_warning_count && user.abuse_warning_count > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResetWarnings(user.id)}
                                >
                                  Reset Warnings
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
