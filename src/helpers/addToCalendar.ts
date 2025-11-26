import utc from "dayjs/plugin/utc";
import { EventItem } from "@/types";
import dayjs from "dayjs";

dayjs.extend(utc);

export const addToCalendar = (event: EventItem) => {
  const start = dayjs(event.event_date).utc();
  const end = start.add(1, "hour"); // default 1-hour duration

  // Google expects dates in this format: YYYYMMDDTHHmmssZ
  const formatForGoogle = (d: typeof start) =>
    d.format("YYYYMMDDTHHmmss") + "Z";

  const googleCalendarUrl =
    `https://www.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(event.title)}` +
    `&dates=${formatForGoogle(start)}/${formatForGoogle(end)}` +
    `&details=${encodeURIComponent(event.description || "")}` +
    `&sf=true&output=xml`;

  window.open(googleCalendarUrl, "_blank");
};
