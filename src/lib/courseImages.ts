/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import heroBanner from '../assets/images/study_hero_banner_1788771607191.jpg';
import physicsThumb from '../assets/images/physics_course_thumb_1788771620721.jpg';
import economicsThumb from '../assets/images/economics_course_thumb_1788771634314.jpg';
import historyThumb from '../assets/images/history_course_thumb_1788771648280.jpg';
import trophyBadge from '../assets/images/study_trophy_badge_1788771661590.jpg';
import notebookFolderArt from '../assets/images/notebook_folder_art_1788789429695.jpg';
import creativeStudyArt from '../assets/images/creative_study_art_1788789444592.jpg';
import lofi2dStudyDesk from '../assets/images/lofi_2d_study_desk_1788796657372.jpg';
import isometric2dLab from '../assets/images/isometric_2d_study_lab_1788796670648.jpg';
import creative2dLearning from '../assets/images/creative_2d_learning_art_1788796682199.jpg';

export const HERO_BANNER_IMG = heroBanner;
export const TROPHY_BADGE_IMG = trophyBadge;
export const LOFI_2D_STUDY_DESK = lofi2dStudyDesk;
export const ISOMETRIC_2D_LAB = isometric2dLab;
export const CREATIVE_2D_LEARNING = creative2dLearning;
export const NOTEBOOK_FOLDER_ART = notebookFolderArt;
export const CREATIVE_STUDY_ART = creativeStudyArt;
export const PHYSICS_THUMB = physicsThumb;
export const ECONOMICS_THUMB = economicsThumb;
export const HISTORY_THUMB = historyThumb;

export interface FolderPresetImage {
  id: string;
  name: string;
  style: string;
  url: string;
  accentColor: string;
}

export const PRESET_FOLDER_IMAGES: FolderPresetImage[] = [
  {
    id: 'lofi_desk',
    name: 'Lo-Fi Anime Study Desk',
    style: '2D Cel-Shaded Warm Illustration',
    url: lofi2dStudyDesk,
    accentColor: '#f59e0b',
  },
  {
    id: 'isometric_lab',
    name: 'Cybernetic Study Sanctuary',
    style: '2D Isometric Holographic Art',
    url: isometric2dLab,
    accentColor: '#8b5cf6',
  },
  {
    id: 'creative_learning',
    name: 'Origami Ideas & Knowledge',
    style: '2D Modern Vector Learning',
    url: creative2dLearning,
    accentColor: '#ec4899',
  },
  {
    id: 'notebook',
    name: 'Vibrant Study Workspace',
    style: '2D Atmospheric Digital Composition',
    url: notebookFolderArt,
    accentColor: '#6366f1',
  },
  {
    id: 'creative',
    name: 'Prism Library of Thought',
    style: '2D Abstract Geometric Art',
    url: creativeStudyArt,
    accentColor: '#06b6d4',
  },
  {
    id: 'science',
    name: 'Quantum & Physics Dynamics',
    style: '2D Conceptual Science Vectors',
    url: physicsThumb,
    accentColor: '#3b82f6',
  },
  {
    id: 'humanities',
    name: 'Chronicles & World History',
    style: '2D Architectural Heritage',
    url: historyThumb,
    accentColor: '#d97706',
  },
  {
    id: 'analytics',
    name: 'Systems & Data Networks',
    style: '2D Data & Network Graphs',
    url: economicsThumb,
    accentColor: '#10b981',
  },
];

export const PRESET_COURSE_IMAGES = PRESET_FOLDER_IMAGES;

export function getFolderImage(folder?: { name?: string; imageUrl?: string }): string {
  if (folder?.imageUrl) {
    return folder.imageUrl;
  }
  const text = (folder?.name || '').toLowerCase();
  if (text.includes('lofi') || text.includes('desk') || text.includes('night') || text.includes('focus') || text.includes('chill')) {
    return lofi2dStudyDesk;
  }
  if (text.includes('code') || text.includes('tech') || text.includes('cyber') || text.includes('lab') || text.includes('data')) {
    return isometric2dLab;
  }
  if (text.includes('art') || text.includes('idea') || text.includes('creative') || text.includes('design') || text.includes('write')) {
    return creative2dLearning;
  }
  if (text.includes('sci') || text.includes('phys') || text.includes('math')) {
    return physicsThumb;
  }
  if (text.includes('hist') || text.includes('law') || text.includes('lit')) {
    return historyThumb;
  }
  if (text.includes('network') || text.includes('sys') || text.includes('logic')) {
    return economicsThumb;
  }
  return lofi2dStudyDesk;
}

export const getCourseImage = getFolderImage;
