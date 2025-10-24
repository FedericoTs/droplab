"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, Eye, Edit2, Loader2, Package, Store, Search, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface StoreGroup {
  id: string;
  name: string;
  description: string | null;
  store_count: number;
  created_at: string;
  updated_at: string;
}

interface StoreGroupWithStores extends StoreGroup {
  stores: Array<{
    id: string;
    store_number: string;
    name: string;
    city: string | null;
    state: string | null;
    region: string | null;
  }>;
}

interface RetailStore {
  id: string;
  store_number: string;
  name: string;
  city: string | null;
  state: string | null;
  region: string | null;
  is_active: boolean;
}

export default function StoreGroupsPage() {
  const [groups, setGroups] = useState<StoreGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddStoresDialog, setShowAddStoresDialog] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<StoreGroupWithStores | null>(null);
  const [viewingGroup, setViewingGroup] = useState<StoreGroupWithStores | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");

  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Store selection state
  const [availableStores, setAvailableStores] = useState<RetailStore[]>([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [addingStores, setAddingStores] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/store-groups");
      const result = await response.json();

      if (result.success && result.data) {
        setGroups(result.data.groups || []);
      } else {
        throw new Error(result.error || "Failed to load store groups");
      }
    } catch (error) {
      console.error("Error loading store groups:", error);
      toast.error("Failed to load store groups");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStores = async () => {
    setLoadingStores(true);
    try {
      const response = await fetch("/api/retail/stores?pageSize=1000&isActive=true");
      const result = await response.json();

      if (result.success && result.data) {
        setAvailableStores(result.data.stores || []);
      } else {
        throw new Error(result.error || "Failed to load stores");
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      toast.error("Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/store-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Store group "${newGroupName}" created`);
        setNewGroupName("");
        setNewGroupDescription("");
        setShowCreateDialog(false);
        loadGroups();
      } else {
        throw new Error(result.error || "Failed to create store group");
      }
    } catch (error) {
      console.error("Error creating store group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create store group");
    } finally {
      setCreating(false);
    }
  };

  const handleViewGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/store-groups/${groupId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setViewingGroup(result.data.group);
        setShowViewDialog(true);
      } else {
        throw new Error(result.error || "Failed to load store group");
      }
    } catch (error) {
      console.error("Error loading store group:", error);
      toast.error("Failed to load store group details");
    }
  };

  const handleEditGroup = async (group: StoreGroup) => {
    setSelectedGroup(group as StoreGroupWithStores);
    setEditGroupName(group.name);
    setEditGroupDescription(group.description || "");
    setShowEditDialog(true);
  };

  const handleUpdateGroup = async () => {
    if (!selectedGroup || !editGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`/api/store-groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editGroupName.trim(),
          description: editGroupDescription.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Store group "${editGroupName}" updated`);
        setShowEditDialog(false);
        loadGroups();
      } else {
        throw new Error(result.error || "Failed to update store group");
      }
    } catch (error) {
      console.error("Error updating store group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update store group");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroupId) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/store-groups/${deletingGroupId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Store group deleted");
        setShowDeleteDialog(false);
        setDeletingGroupId(null);
        loadGroups();
      } else {
        throw new Error(result.error || "Failed to delete store group");
      }
    } catch (error) {
      console.error("Error deleting store group:", error);
      toast.error("Failed to delete store group");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenAddStores = async (group: StoreGroup) => {
    setSelectedGroup(group as StoreGroupWithStores);
    setSelectedStoreIds(new Set());
    setStoreSearchQuery("");
    setShowAddStoresDialog(true);
    await loadAvailableStores();
  };

  const handleAddStores = async () => {
    if (!selectedGroup || selectedStoreIds.size === 0) {
      toast.error("Please select at least one store");
      return;
    }

    setAddingStores(true);
    try {
      const response = await fetch(`/api/store-groups/${selectedGroup.id}/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeIds: Array.from(selectedStoreIds),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Added ${result.data.added} stores to group`);
        setShowAddStoresDialog(false);
        setSelectedStoreIds(new Set());
        loadGroups();
      } else {
        throw new Error(result.error || "Failed to add stores");
      }
    } catch (error) {
      console.error("Error adding stores:", error);
      toast.error("Failed to add stores to group");
    } finally {
      setAddingStores(false);
    }
  };

  const toggleStoreSelection = (storeId: string) => {
    const newSelection = new Set(selectedStoreIds);
    if (newSelection.has(storeId)) {
      newSelection.delete(storeId);
    } else {
      newSelection.add(storeId);
    }
    setSelectedStoreIds(newSelection);
  };

  const filteredStores = availableStores.filter((store) => {
    const searchLower = storeSearchQuery.toLowerCase();
    return (
      store.store_number.toLowerCase().includes(searchLower) ||
      store.name.toLowerCase().includes(searchLower) ||
      (store.city && store.city.toLowerCase().includes(searchLower)) ||
      (store.state && store.state.toLowerCase().includes(searchLower))
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8" />
              Store Groups
            </h1>
            <p className="text-slate-600 mt-1">
              Save frequently-used store selections for quick reuse in orders
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Help Banner */}
      <Card className="mb-6 border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How Store Groups Work:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Create a group with a descriptive name</li>
                <li>Click "Add Stores" to select stores for the group</li>
                <li>Use the group in Orders → New Order by selecting the "Store Groups" tab</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {groups.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No Store Groups Yet
              </h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create store groups to save frequently-used store selections. Perfect for
                recurring orders to the same locations.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Group
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Groups Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{group.name}</CardTitle>
                {group.description && (
                  <CardDescription className="line-clamp-2">{group.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <Package className="h-4 w-4" />
                  <span>{group.store_count} store{group.store_count !== 1 ? "s" : ""}</span>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleOpenAddStores(group)}
                    className="w-full gap-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Stores
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGroup(group.id)}
                      className="flex-1 gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditGroup(group)}
                      className="gap-2"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingGroupId(group.id);
                        setShowDeleteDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700 gap-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Store Group</DialogTitle>
            <DialogDescription>
              Create a new group, then add stores to it
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="group-name">Group Name *</Label>
              <Input
                id="group-name"
                placeholder="e.g., Top 50 Performers, Metro Stores"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="Brief description of this group..."
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={creating} className="gap-2">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Group
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Stores Dialog */}
      <Dialog open={showAddStoresDialog} onOpenChange={setShowAddStoresDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Stores to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>
              Select stores to add to this group ({selectedStoreIds.size} selected)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by store number, name, city, or state..."
                value={storeSearchQuery}
                onChange={(e) => setStoreSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Store List */}
            {loadingStores ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredStores.length === 0 ? (
              <div className="text-center py-8 text-slate-600">
                <Store className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p>No stores found</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
                {filteredStores.map((store) => (
                  <div
                    key={store.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleStoreSelection(store.id)}
                  >
                    <Checkbox
                      checked={selectedStoreIds.has(store.id)}
                      onCheckedChange={() => toggleStoreSelection(store.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        #{store.store_number} - {store.name}
                      </p>
                      <p className="text-sm text-slate-600">
                        {store.city}, {store.state} • {store.region}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStoresDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddStores}
              disabled={addingStores || selectedStoreIds.size === 0}
              className="gap-2"
            >
              {addingStores ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Add {selectedStoreIds.size} Store{selectedStoreIds.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Group Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingGroup?.name}</DialogTitle>
            {viewingGroup?.description && (
              <DialogDescription>{viewingGroup.description}</DialogDescription>
            )}
          </DialogHeader>

          {viewingGroup && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Package className="h-4 w-4" />
                <span>
                  {viewingGroup.store_count} store{viewingGroup.store_count !== 1 ? "s" : ""} in
                  this group
                </span>
              </div>

              {viewingGroup.stores.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {viewingGroup.stores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-medium">
                          #{store.store_number} - {store.name}
                        </p>
                        <p className="text-sm text-slate-600">
                          {store.city}, {store.state} • {store.region}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-600">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p>No stores in this group yet</p>
                  <p className="text-sm mt-1">Click "Add Stores" to add stores to this group</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store Group</DialogTitle>
            <DialogDescription>Update the group name and description</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-group-name">Group Name *</Label>
              <Input
                id="edit-group-name"
                placeholder="e.g., Top 50 Performers"
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="edit-group-description">Description (Optional)</Label>
              <Textarea
                id="edit-group-description"
                placeholder="Brief description of this group..."
                value={editGroupDescription}
                onChange={(e) => setEditGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateGroup} disabled={updating} className="gap-2">
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Group"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this store group. Stores themselves will not be deleted,
              only the group. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Group"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
