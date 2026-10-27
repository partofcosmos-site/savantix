/**
 * @file googleCalendarSyncService.ts
 * @description
 * Generates RFC 5545 standard iCalendar (.ics) payloads and direct Google Calendar
 * web integration URLs for Savantix attendance records, absences, exams, and institutional breaks.
 * Enables 1-tap live export or sync with Google Calendar so dates are permanently preserved.
 */

import { InstitutionalAttendanceState, AbsenceEntry } from '../types/attendance';

export class GoogleCalendarSyncService {
  /**
   * Generates a direct Google Calendar single-event web URL.
   * Useful for quickly adding an absence or exam milestone to Google Calendar with 1-tap.
   */
  public static createGoogleCalendarUrl(event: {
    title: string;
    details: string;
    startDate: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    location?: string;
  }): string {
    const startFormatted = event.startDate.replace(/-/g, '');
    let endFormatted = startFormatted;
    if (event.endDate) {
      // For all-day events in Google Calendar, end date is exclusive (day after)
      const endD = new Date(event.endDate);
      endD.setDate(endD.getDate() + 1);
      endFormatted = endD.toISOString().split('T')[0].replace(/-/g, '');
    } else {
      const startD = new Date(event.startDate);
      startD.setDate(startD.getDate() + 1);
      endFormatted = startD.toISOString().split('T')[0].replace(/-/g, '');
    }

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startFormatted}/${endFormatted}`,
      details: event.details,
      location: event.location || 'The Bandhan School Aranghata'
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  /**
   * Generates a complete RFC 5545 .ics file string containing all logged absences,
   * holidays, vacations, and exam milestones.
   * Can be imported directly into Google Calendar, Apple Calendar, or Outlook.
   */
  public static generateIcsContent(state: InstitutionalAttendanceState): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Savantix//Institutional Attendance Tracker//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Savantix Attendance & Academic Milestones',
      'X-WR-TIMEZONE:Asia/Kolkata'
    ];

    const formatAllDay = (dStr: string) => dStr.replace(/-/g, '');
    const getNextDay = (dStr: string) => {
      const d = new Date(dStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0].replace(/-/g, '');
    };

    // 1. Absences
    (state.absences || []).forEach(abs => {
      const dtStart = formatAllDay(abs.date);
      const dtEnd = getNextDay(abs.date);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${abs.id || 'abs_' + dtStart}@savantix.app`,
        `DTSTAMP:${formatAllDay(new Date().toISOString().split('T')[0])}T000000Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[Absence] ${abs.reason}`,
        `DESCRIPTION:Category: ${abs.category.toUpperCase()}\\nLab/Practical: ${abs.isPracticalDay ? 'YES' : 'NO'}\\nNotes: ${abs.notes || 'Logged in Savantix'}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      );
    });

    // 2. Exam Milestones
    (state.exams || []).forEach(exam => {
      const dtStart = formatAllDay(exam.startDate);
      const dtEnd = getNextDay(exam.endDate);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${exam.id || 'exam_' + dtStart}@savantix.app`,
        `DTSTAMP:${formatAllDay(new Date().toISOString().split('T')[0])}T000000Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[Exam] ${exam.name}`,
        `DESCRIPTION:Focus: ${exam.strategicFocus || 'CBSE Exam'}\\nSyllabus: ${exam.syllabusPercentage || 100}%`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    });

    // 3. Vacations & Extended Breaks
    (state.vacations || []).forEach(vac => {
      const dtStart = formatAllDay(vac.startDate);
      const dtEnd = getNextDay(vac.endDate);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${vac.id || 'vac_' + dtStart}@savantix.app`,
        `DTSTAMP:${formatAllDay(new Date().toISOString().split('T')[0])}T000000Z`,
        `DTSTART;VALUE=DATE:${dtStart}`,
        `DTEND;VALUE=DATE:${dtEnd}`,
        `SUMMARY:[Vacation] ${vac.name}`,
        `DESCRIPTION:${vac.description || 'Institutional vacation break'}`,
        'STATUS:CONFIRMED',
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      );
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /**
   * Triggers a browser download of the complete .ics calendar file.
   */
  public static downloadCalendarIcs(state: InstitutionalAttendanceState, filename = 'savantix-attendance-calendar.ics'): void {
    const icsData = this.generateIcsContent(state);
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
