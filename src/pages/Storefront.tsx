import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "react-toastify";
import alienBg from "@/assets/images/ufo.jpg";
import ConfirmationModal from "@/components/ui/modal";
import { Link1Icon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StoreItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url?: string;
  clickthrough_url?: string;
};

const Storefront = () => {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [clickthroughUrl, setClickthroughUrl] = useState("");

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState<() => void>(
    () => {}
  );

  useEffect(() => {
    document.title = "Store | My Platform";
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("store_items").select("*");
    if (error) {
      toast.error("Failed to load store items");
      console.error(error);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const createItem = async () => {
    if (!name) {
      toast.error("Name is required");
      return;
    }

    setCreating(true);

    const { data, error } = await supabase
      .from("store_items")
      .insert([
        {
          name,
          description,
          price,
          image_url: imageUrl,
          clickthrough_url: clickthroughUrl,
        },
      ])
      .select()
      .single();

    setCreating(false);

    if (error) {
      toast.error("Failed to create item");
      console.error(error);
    } else {
      setItems([data, ...items]);
      toast.success("Item created!");
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      setClickthroughUrl("");
    }
  };

  const confirmDelete = (item: StoreItem) => {
    setConfirmModalTitle("Delete Store Item");
    setConfirmModalMessage(`Are you sure you want to delete "${item.name}"?`);
    setConfirmModalAction(() => () => deleteItem(item.id));
    setConfirmModalOpen(true);
  };

  const deleteItem = async (id: string) => {
    setConfirmModalOpen(false);
    const { error } = await supabase.from("store_items").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete item");
      console.error(error);
    } else {
      setItems(items.filter((item) => item.id !== id));
      toast.success("Item deleted!");
    }
  };

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto sm:ml-[96px] transition-all duration-300">
      <div
        className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${alienBg})` }}
      />

      <section className="relative z-10 container mx-auto px-6 pt-12 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white drop-shadow">Store</h1>
        </header>

        <Separator />

        {/* Admin create form */}
        {isAdmin && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                name="title"
                id="title"
                placeholder="Title"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                name="imageUrl"
                id="imageUrl"
                placeholder="Image URL"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Input
                name="description"
                id="description"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                name="price"
                id="price"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
              <Input
                name="url"
                id="url"
                placeholder="Link"
                value={clickthroughUrl}
                onChange={(e) => setClickthroughUrl(e.target.value)}
              />
              <div className="flex flex-col items-end justify-end w-full">
                <Button onClick={createItem} disabled={creating}>
                  {creating ? "Creating..." : "Create item"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Store items grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-60 w-full rounded-md" />
            ))
          ) : items.length === 0 ? (
            <p>No items.</p>
          ) : (
            items.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden relative rounded-[25px] bg-white"
              >
                {/* Image */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}

                {/* Content */}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6">
                    <p className="font-medium text-gray-800">£{item.price}</p>
                    <div className="flex space-x-2 justify-end">
                      {/* Admin actions */}
                      {isAdmin && (
                        <Button
                          onClick={() => confirmDelete(item)}
                          variant="danger"
                        >
                          Delete
                        </Button>
                      )}
                      {item.clickthrough_url && (
                        <a
                          href={item.clickthrough_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          <Button
                            variant="primary"
                            className="flex space-x-2 items-center justify-centerx"
                          >
                            Visit
                            <OpenInNewWindowIcon />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        {/* Confirmation modal */}
        <ConfirmationModal
          open={confirmModalOpen}
          title={confirmModalTitle}
          message={confirmModalMessage}
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={confirmModalAction}
          onCancel={() => setConfirmModalOpen(false)}
        />
      </section>
    </main>
  );
};

export default Storefront;
