import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type StoreItemFormProps = {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  price: string;
  setPrice: (price: string) => void;
  imageUrl: string;
  setImageUrl: (imageUrl: string) => void;
  clickthroughUrl: string;
  setClickthroughUrl: (url: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

export const StoreItemForm = ({
  name,
  setName,
  description,
  setDescription,
  price,
  setPrice,
  imageUrl,
  setImageUrl,
  clickthroughUrl,
  setClickthroughUrl,
  onSubmit,
  isLoading = false,
}: StoreItemFormProps) => {
  return (
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
        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isLoading || !name}>
            {isLoading ? "Creating..." : "Create item"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
