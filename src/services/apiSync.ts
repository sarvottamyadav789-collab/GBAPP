import { PlatformItem, CarouselSlide } from '../types.ts';

export interface SyncStatus {
  platformsVersion: number;
  carouselVersion: number;
}

/**
 * Fetch all platforms from the high-speed backend server.
 * Never blocked by Firebase read quotas.
 */
export async function fetchPlatformsApi(): Promise<PlatformItem[] | null> {
  try {
    const res = await fetch('/api/platforms', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.platforms)) {
      return data.platforms;
    }
    return null;
  } catch (err) {
    console.warn('Backend fetchPlatformsApi notice:', err);
    return null;
  }
}

/**
 * Save or update platform on the backend server.
 * Instantly broadcasts to all users.
 */
export async function savePlatformApi(platform: PlatformItem): Promise<boolean> {
  try {
    const res = await fetch('/api/platforms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ platform }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend savePlatformApi notice:', err);
    return false;
  }
}

/**
 * Delete a platform on the backend server.
 */
export async function deletePlatformApi(platformId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/platforms/${encodeURIComponent(platformId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend deletePlatformApi notice:', err);
    return false;
  }
}

/**
 * Fetch all carousel slides from the backend server.
 */
export async function fetchCarouselApi(): Promise<CarouselSlide[] | null> {
  try {
    const res = await fetch('/api/carousel', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.slides)) {
      return data.slides;
    }
    return null;
  } catch (err) {
    console.warn('Backend fetchCarouselApi notice:', err);
    return null;
  }
}

/**
 * Save or update carousel slide on backend server.
 */
export async function saveCarouselApi(slide: CarouselSlide): Promise<boolean> {
  try {
    const res = await fetch('/api/carousel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slide }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend saveCarouselApi notice:', err);
    return false;
  }
}

/**
 * Delete a carousel slide on backend server.
 */
export async function deleteCarouselApi(slideId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/carousel/${encodeURIComponent(slideId)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch (err) {
    console.warn('Backend deleteCarouselApi notice:', err);
    return false;
  }
}

/**
 * Check real-time version status (< 50 bytes request).
 * Used for live multi-user instant updates without polling heavy data.
 */
export async function fetchSyncStatusApi(): Promise<SyncStatus | null> {
  try {
    const res = await fetch('/api/sync-status', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
