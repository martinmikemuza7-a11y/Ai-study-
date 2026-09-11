/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudyCalendarEvent, StudyMethod } from '../types';

const STORAGE_KEY = 'ai_study_calendar_events';

export const DEFAULT_STUDY_EVENTS: StudyCalendarEvent[] = [];

export function getCalendarEvents(): StudyCalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: StudyCalendarEvent[] = JSON.parse(raw);
    // Purge any legacy events referencing Principles of Microeconomics or econ_101
    const cleaned = parsed.filter(
      (e) =>
        e.courseId !== 'econ_101' &&
        e.courseCode !== 'ECON-101' &&
        !e.courseName.toLowerCase().includes('microeconomics') &&
        !e.courseName.toLowerCase().includes('principles of microeconomics')
    );
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.error('Failed to parse calendar events:', e);
    return [];
  }
}

export function saveCalendarEvent(event: StudyCalendarEvent): StudyCalendarEvent[] {
  const current = getCalendarEvents();
  const existingIdx = current.findIndex((e) => e.id === event.id);
  let updated: StudyCalendarEvent[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = event;
  } else {
    updated = [event, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save event:', e);
  }
  return updated;
}

export function deleteCalendarEvent(id: string): StudyCalendarEvent[] {
  const current = getCalendarEvents();
  const updated = current.filter((e) => e.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete event:', e);
  }
  return updated;
}

export function markEventCompleted(id: string, score: number): StudyCalendarEvent[] {
  const current = getCalendarEvents();
  const updated = current.map((e) =>
    e.id === id
      ? { ...e, completed: true, completedAt: new Date().toISOString(), score }
      : e
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update event status:', e);
  }
  return updated;
}
