import { useState, useEffect } from "react";
import { Shield, Users, Database, Trash2, Eye, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface UserData {
  user: User;
  trips: any;
  expenses: any[];
  bookings: any[];
  searches: any[];
  moods: any[];
  restaurants: any[];
  saved_restaurants: any[];
  events: any[];
  hotels: any[];
}

const Admin = () => {
  const { user: currentUser, token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || !currentUser?.is_admin) {
      toast.error("Admin access required");
      navigate("/");
    }
  }, [isAuthenticated, currentUser, navigate]);

  // Load all users
  useEffect(() => {
    if (isAuthenticated && currentUser?.is_admin && token) {
      loadUsers();
    }
  }, [isAuthenticated, currentUser, token]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async (userId: number) => {
    try {
      setLoading(true);
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/admin/user/${userId}/data`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load user data");
      const data = await response.json();
      setUserData(data);
      setSelectedUser(data.user);
    } catch (error: any) {
      console.error("Failed to load user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!userToDelete || !token) return;
    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/admin/user/${userToDelete.id}/delete`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      toast.success(`User '${userToDelete.username}' deleted successfully`);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      await loadUsers();
      if (selectedUser?.id === userToDelete.id) {
        setSelectedUser(null);
        setUserData(null);
      }
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated || !currentUser?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-hero rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage all users and their data
          </p>
          <Badge variant="destructive" className="mt-2">🔒 Admin Only</Badge>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              All Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="user-data" disabled={!selectedUser}>
              <Database className="w-4 h-4 mr-2" />
              User Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Users</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button onClick={loadUsers} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                        onClick={() => loadUserData(u.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{u.username}</span>
                              {u.is_admin && (
                                <Badge variant="destructive" className="text-xs">Admin</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {u.id} • Joined: {new Date(u.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadUserData(u.id);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Data
                          </Button>
                          {!u.is_admin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUserToDelete(u);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No users found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-data">
            {selectedUser && userData ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User: {selectedUser.username}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold">{selectedUser.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">User ID</p>
                        <p className="font-semibold">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant={selectedUser.is_admin ? "destructive" : "secondary"}>
                          {selectedUser.is_admin ? "Admin" : "User"}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Joined</p>
                        <p className="font-semibold">
                          {new Date(selectedUser.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Budget Trips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{Object.keys(userData.trips || {}).length}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.expenses?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.bookings?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Monument Searches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.searches?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Mood Analyses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.moods?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Restaurant Searches</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.restaurants?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Saved Restaurants</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.saved_restaurants?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Event Interactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">{userData.events?.length || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Hotel Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {userData.hotels?.filter((h: any) => h.action === "booked").length || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Data Sections */}
                <div className="space-y-4">
                  {Object.keys(userData.trips || {}).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Budget Trips</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(userData.trips).map(([tripName, trip]: [string, any]) => (
                            <div key={tripName} className="p-3 border rounded">
                              <p className="font-semibold">{tripName}</p>
                              <p className="text-sm text-muted-foreground">
                                Budget: ₹{trip.budget?.toLocaleString('en-IN')} • 
                                People: {trip.numPeople} • 
                                Categories: {trip.categories?.length || 0}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {userData.bookings && userData.bookings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Bookings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {userData.bookings.map((booking: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded text-sm">
                              <p className="font-semibold">
                                {booking.type || "Booking"} - {booking.booking_data?.restaurant_name || 
                                booking.booking_data?.hotel_data?.name || "Booking"}
                              </p>
                              <p className="text-muted-foreground">
                                {booking.created_at ? new Date(booking.created_at).toLocaleString() : "N/A"}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {userData.searches && userData.searches.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monument Searches</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {userData.searches.map((search: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded">
                              <p className="font-semibold">{search.monument}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {userData.moods && userData.moods.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Mood Analyses</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {userData.moods.map((mood: any, idx: number) => (
                            <div key={idx} className="p-3 border rounded">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge>{mood.mood_result?.mood || "Unknown"}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {mood.recommendations?.length || 0} recommendations
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {mood.text_input?.substring(0, 100)}...
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Select a user to view their data</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete user "{userToDelete?.username}"? This will permanently delete
                the user and ALL their data including trips, bookings, searches, and more. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteUser} className="flex-1">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;


