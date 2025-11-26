import { EventItem } from "@/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export const downloadICS = (event: EventItem) => {
  const start = dayjs(event.event_date).utc();
  const end = start.add(1, "hour");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pentyrch Aliens//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${event.id}@pentyrchaliens.co.uk`,
    `DTSTAMP:${dayjs().utc().format("YYYYMMDDTHHmmss")}Z`,
    `DTSTART:${start.format("YYYYMMDDTHHmmss")}Z`,
    `DTEND:${end.format("YYYYMMDDTHHmmss")}Z`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/\s+/g, "_")}.ics`;
  link.click();

  URL.revokeObjectURL(url);
};
