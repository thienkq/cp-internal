"use client";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { 
  Edit, 
  Trash2, 
  Briefcase, 
  Calendar, 
  Plus, 
  Search, 
  Users, 
  Crown,
  Clock,
  MapPin
} from "lucide-react";
import UserAssignmentForm from "./user-assignment-form";
import { useState as useReactState } from "react";
import { assignmentRoleOptions } from "@/components/users/user-constants";
import { LoadingSpinner } from "../common/loading-spinner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@workspace/ui/components/alert-dialog";

// Get role color and icon
const getRoleInfo = (role: string, isLead: boolean) => {
  if (isLead) {
    return { 
      color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white", 
      icon: Crown,
      label: "Project Lead"
    };
  }
  
  switch (role) {
    case "developer":
      return { 
        color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white", 
        icon: Users,
        label: "Developer"
      };
    case "designer":
      return { 
        color: "bg-gradient-to-r from-pink-500 to-pink-600 text-white", 
        icon: Users,
        label: "Designer"
      };
    case "qa":
      return { 
        color: "bg-gradient-to-r from-green-500 to-green-600 text-white", 
        icon: Users,
        label: "QA Engineer"
      };
    default:
      return { 
        color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white", 
        icon: Users,
        label: assignmentRoleOptions.find(o => o.value === role)?.label || role
      };
  }
};

export default function MyAssignmentList({
  userId,
  initialAssignments,
  allProjects,
}: {
  userId: string;
  initialAssignments: any[];
  allProjects: { id: string; name: string }[];
}) {
  const [assignments, setAssignments] = useState<any[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>(allProjects);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useReactState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useReactState(false);

  // Filter and search logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a: any) => {
      return !search || a.project?.name?.toLowerCase().includes(search.toLowerCase());
    });
  }, [assignments, search]);

  // Add or edit assignment
  const handleSave = async (values: any, id?: string) => {
    setEditLoading(true);
    const supabase = createBrowserClient();
    // Always send null for end_date if blank
    // Remove 'project' field if present
    const { project, ...rest } = values;
    const valuesToSave = {
      ...rest,
      end_date: values.end_date ? values.end_date : null,
    };
    let error;
    if (id) {
      // Edit
      ({ error } = await supabase
        .from("project_assignments")
        .update(valuesToSave)
        .eq("id", id));
      setAddMode(false); // Close add form if editing
    } else {
      // Add
      ({ error } = await supabase
        .from("project_assignments")
        .insert([{ ...valuesToSave, user_id: userId }])
      );
      setEditId(null); // Close edit form if adding
    }
    setEditLoading(false);
    setAddMode(false);
    setEditId(null);
    if (!error) {
      // Refresh assignments
      const { data } = await supabase
        .from("project_assignments")
        .select("*, project:project_id(id, name)")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false });
      setAssignments(data || []);
    } else {
      alert("Failed to save assignment: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("project_assignments").delete().eq("id", id);
    setDeleteLoading(false);
    setDeleteId(null);
    if (!error) {
      // Refresh assignments
      const { data } = await supabase
        .from("project_assignments")
        .select("*, project:project_id(id, name)")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false });
      setAssignments(data || []);
    } else {
      alert("Failed to delete assignment: " + error.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (error) return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <Briefcase className="h-5 w-5" />
          <span className="font-medium">{error}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Project Assignments</h1>
          <p className="text-gray-600 mt-1">Manage your current and past project assignments</p>
        </div>
        <Button
          onClick={() => {
            setEditId(null); // Close edit form if open
            setAddMode(true); // Open add form
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      {addMode && !editId && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Add New Assignment</CardTitle>
          </CardHeader>
          <CardContent>
            <UserAssignmentForm
              projects={projects}
              onSave={vals => handleSave(vals)}
              onCancel={() => setAddMode(false)}
              loading={editLoading}
            />
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredAssignments.length === 0 && !addMode ? (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Briefcase className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {search ? "No assignments found" : "No project assignments yet"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {search 
                ? `No assignments match "${search}". Try a different search term.`
                : "You haven't been assigned to any projects yet. Add your first assignment to get started!"
              }
            </p>
            {!search && (
              <Button 
                onClick={() => setAddMode(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Assignment
              </Button>
            )}
            {search && (
              <Button 
                variant="outline"
                onClick={() => setSearch("")}
              >
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Assignment Cards */
        <div className="space-y-4">
          {filteredAssignments.map(a => {
            const roleInfo = getRoleInfo(a.role, a.is_lead);
            const RoleIcon = roleInfo.icon;
            
            return editId === a.id ? (
              <Card key={a.id} className="border-orange-200 bg-orange-50/50">
                <CardHeader>
                  <CardTitle className="text-orange-900">Edit Assignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserAssignmentForm
                    initial={a}
                    projects={projects}
                    onSave={vals => handleSave(vals, a.id)}
                    onCancel={() => setEditId(null)}
                    loading={editLoading}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card key={a.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      {/* Project Header */}
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-blue-100">
                          <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Project</p>
                              <h3 className="text-xl font-bold text-gray-900">{a.project?.name}</h3>
                            </div>
                          </div>
                          
                          {/* Status Badges */}
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className={roleInfo.color}>
                              <RoleIcon className="h-3 w-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                            <Badge 
                              variant={a.status === 'active' ? 'default' : 'secondary'}
                              className={a.status === 'active' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                              }
                            >
                              <div className={`w-2 h-2 rounded-full mr-2 ${a.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                              {a.status === 'active' ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Assignment Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-100">
                            <Users className="h-4 w-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Position</p>
                            <p className="font-medium text-gray-900 capitalize">
                              {assignmentRoleOptions.find(o => o.value === a.role)?.label || a.role}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-100">
                            <Calendar className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Duration</p>
                            <p className="font-medium text-gray-900">
                              {a.start_date} → {a.end_date || 'Present'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex lg:flex-col gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { setEditId(a.id); setAddMode(false); }}
                        className="flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <AlertDialog open={deleteId === a.id} onOpenChange={(open) => {
                        if (!open) setDeleteId(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteId(a.id)}
                            disabled={deleteLoading}
                            className="flex items-center gap-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this assignment? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteId && handleDelete(deleteId)} 
                              disabled={deleteLoading}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deleteLoading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 