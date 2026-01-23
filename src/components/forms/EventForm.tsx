import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventFormProps = {
  title: string;
  setTitle: (title: string) => void;
  description: string;
  setDescription: (description: string) => void;
  date: string;
  setDate: (date: string) => void;
  type: string;
  setType: (type: string) => void;
  capacity?: number;
  setCapacity?: (capacity: number) => void;
  onSubmit: () => void;
  isLoading?: boolean;
};

type FormFieldProps = {
  label: string;
  htmlFor: string;
  placeholder?: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  type?: string;
  min?: string;
  as?: "input" | "select";
  options?: { value: string; label: string }[];
};

export const EventForm = ({
  title,
  setTitle,
  description,
  setDescription,
  date,
  setDate,
  type,
  setType,
  capacity,
  setCapacity,
  onSubmit,
  isLoading = false,
}: EventFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Event</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <FormField
          label="Title"
          htmlFor="title"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <FormField
          label="Type"
          htmlFor="type"
          as="select"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={[
            { value: "training", label: "Training" },
            { value: "game", label: "Game" },
          ]}
        />

        <FormField
          label="Description"
          htmlFor="description"
          placeholder="(Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <FormField
          label="Date"
          htmlFor="date"
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        {type === "training" && capacity !== undefined && setCapacity && (
          <FormField
            label="Capacity"
            htmlFor="capacity"
            type="number"
            min="0"
            value={capacity.toString()}
            onChange={(e) => setCapacity(parseInt(e.target.value || "0"))}
          />
        )}

        <div className="flex justify-end">
          <Button onClick={onSubmit} disabled={isLoading || !title || !date}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const FormField = ({
  label,
  htmlFor,
  placeholder,
  value,
  onChange,
  type = "text",
  min,
  as = "input",
  options,
}: FormFieldProps) => {
  return (
    <div className="flex flex-col items-start gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {as === "select" ? (
        <select
          name={htmlFor}
          id={htmlFor}
          className="flex h-10 w-full rounded-[7px] border border-gray-300 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          value={value}
          onChange={onChange}
        >
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <Input
          name={htmlFor}
          id={htmlFor}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          min={min}
        />
      )}
    </div>
  );
};
