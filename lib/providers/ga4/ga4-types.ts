export interface GA4Config {
  propertyId: string;
  serviceAccountKey: string; // JSON string
}

export interface GA4TrafficPeriod {
  users: number;
  sessions: number;
  usersChange?: number;
  sessionsChange?: number;
}

export interface GA4TrafficData {
  today: GA4TrafficPeriod;
  thisWeek: GA4TrafficPeriod;
  thisMonth: GA4TrafficPeriod;
}
