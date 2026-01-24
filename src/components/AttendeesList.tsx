import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Attendee = {
  user_id: string;
  name: string;
  position: string;
  registered: boolean;
  subscribed: boolean;
};

type AttendeesListProps = {
  attendees: Attendee[];
  isLoading?: boolean;
  onRemove?: (userId: string) => void;
  isSubbedEvent?: boolean;
};

export const AttendeesList = ({
  attendees,
  isLoading = false,
  onRemove,
  isSubbedEvent = false,
}: AttendeesListProps) => {
  if (isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading attendees...</p>
    );
  }

  if (attendees.length === 0) {
    return <p className="text-sm text-muted-foreground">No attendees.</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col">
        <p className="text-sm font-medium">Attendees</p>
        <div className="flex space-x-2 items-center py-1">
          <span className="bg-green-500 p-1 h-2 w-2 rounded-full" />
          <span className="text-xs">Registered</span>
          <span className="bg-red-500 p-1 h-2 w-2 rounded-full" />
          <span className="text-xs">Unregistered</span>
        </div>
        <Separator />
      </div>

      {/* Attendees list */}
      <div className="max-h-[250px] overflow-y-auto space-y-2">
        {attendees.map((attendee) => (
          <div
            key={attendee.user_id}
            className="flex items-center w-full space-y-2"
          >
            <div className="flex space-x-2 items-center justify-start flex-1 min-w-0">
              <span
                className={`flex-shrink-0 ${
                  attendee.registered ? "bg-green-500" : "bg-red-500"
                } p-1 h-2 w-2 rounded-full`}
              />
              <div className="flex space-x-1 items-center justify-start flex-wrap min-w-0">
                <span className="text-sm truncate">{attendee.name}</span>
                <span className="text-sm capitalize text-muted-foreground">
                  {attendee.position}
                </span>
              </div>
            </div>
            {onRemove && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemove(attendee.user_id)}
                className="flex-shrink-0"
              >
                {attendee.subscribed && isSubbedEvent
                  ? "Remove"
                  : "Remove & Refund"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
