export interface Park {
  id: string; // NPS parkCode or "state_<slug>"
  source: 'nps' | 'state';
  fullName: string;
  description: string;
  stateCodes: string; // comma-separated e.g. "CA,NV"
  latitude: number | null;
  longitude: number | null;
  designation: string;
  imageUrl: string | null;
  rawJson: string;
  lastSynced: number;
}

export interface Visit {
  id: number;
  parkId: string;
  visitedAt: number; // unix timestamp ms
  notes: string | null;
  rating: number | null; // 1-5
}

export interface Photo {
  id: number;
  parkId: string;
  uri: string; // file:// path in documentDirectory
  takenAt: number; // unix timestamp ms
  caption: string | null;
}

export interface ParkWithVisit extends Park {
  visit: Visit | null;
  photoCount: number;
}
