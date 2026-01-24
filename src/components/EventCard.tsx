import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import type { EventItem } from "@/types";

type EventCardProps = {
  event: EventItem;
  children?: ReactNode;
  onDelete?: (eventId: string) => void;
  onViewAttendees?: (eventId: string) => void;
  isOpen?: boolean;
};

export const EventCard = ({
  event,
  children,
  onDelete,
  onViewAttendees,
  isOpen = false,
}: EventCardProps) => {
  const attendancePercentage =
    event.type === "game" ? 0 : (event.attendees_count / event.capacity) * 100;

  const getCapacityColor = (percentage: number) => {
    if (percentage < 50) return "#3b82f6"; // blue
    if (percentage < 80) return "#f59e0b"; // orange
    return "#ef4444"; // red
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Date and Time */}
        <p className="text-sm">
          {dayjs(event.event_date).format("MMM D, YYYY h:mm A")}
        </p>

        {/* Type */}
        {event.type && (
          <p className="text-sm capitalize">
            {event.type === "training_subbed" ? "training" : event.type}
          </p>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-sm text-gray-600">{event.description}</p>
        )}

        {/* Capacity bar for training events */}
        {(event.type === "training" || event.type === "training_subbed") && (
          <div className="space-y-1 pt-2">
            <p className="text-sm">
              {event.attendees_count}/{event.capacity} spots
            </p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${attendancePercentage}%`,
                  backgroundColor: getCapacityColor(attendancePercentage),
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          {onViewAttendees && event.type !== "game" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewAttendees(event.id)}
              className="flex-1"
            >
              {isOpen ? "Hide attendees" : "View attendees"}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(event.id)}
            >
              Delete
            </Button>
          )}
        </div>

        {/* Custom children content */}
        {children}
      </CardContent>
    </Card>
  );
};
