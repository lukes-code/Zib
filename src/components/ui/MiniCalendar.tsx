import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import dayjs from "dayjs";
import { EventItem } from "@/types";

interface FullWidthCalendarProps {
  events: EventItem[];
  joinedEventIds: string[]; // IDs of events the user is going to
}

const FullWidthCalendar: React.FC<FullWidthCalendarProps> = ({
  events,
  joinedEventIds,
}) => {
  const joinedDates = new Set(
    events
      .filter((ev) => joinedEventIds?.includes(ev.id))
      .map((ev) => dayjs(ev.event_date).format("YYYY-MM-DD"))
  );

  const otherDates = new Set(
    events
      .filter((ev) => !joinedEventIds?.includes(ev.id))
      .map((ev) => dayjs(ev.event_date).format("YYYY-MM-DD"))
  );

  return (
    <div className="bg-white flex items-center justify-center rounded-[25px] w-full p-4">
      <DayPicker
        mode="single"
        selected={undefined}
        modifiers={{
          joined: (date) => joinedDates.has(dayjs(date).format("YYYY-MM-DD")),
          other: (date) => otherDates.has(dayjs(date).format("YYYY-MM-DD")),
        }}
        modifiersClassNames={{
          joined: "bg-green-500 text-white rounded-full",
          other: "bg-gray-300 text-white rounded-full",
        }}
        fromMonth={new Date()}
        styles={{
          caption: {
            textAlign: "left",
            display: "flex",
            justifyContent: "left",
          },
          table: { width: "100%", margin: "0 auto" },
          head_row: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" },
          row: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)" },
          day: { textAlign: "center" },
        }}
      />
    </div>
  );
};

export default FullWidthCalendar;
