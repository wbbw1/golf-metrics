/**
 * Attio Provider Type Definitions
 */

/**
 * Attio API Configuration
 */
export interface AttioConfig {
  apiKey: string;
  objectSlug?: string; // e.g., "deals", "opportunities" - defaults to "deals"
}

/**
 * Pipeline stages in order
 */
export enum PipelineStage {
  CHASING = 'Chasing',
  SCHEDULING = 'Scheduling',
  INTRO_CALL = 'Intro call',
  DEMO = 'Demo',
  EVALUATION = 'Evaluation',
  SIGNING = 'Signing',
  PILOT = 'Pilot',
  WON = 'Won',
  Q1_FOLLOWUP = '26Q1 Follow-up',
}

/**
 * Attio Record ID structure
 */
export interface AttioRecordId {
  workspace_id: string;
  object_id: string;
  record_id: string;
}

/**
 * Attio Actor (user who performed action)
 */
export interface AttioActor {
  type: string;
  id: string;
}

/**
 * Attio Attribute Value
 */
export interface AttioAttributeValue {
  active_from: string;
  active_until: string | null;
  created_by_actor: AttioActor;
  attribute_type: string;
  value: any;
}

/**
 * Attio Record from API
 */
export interface AttioRecord {
  id: AttioRecordId;
  created_at: string;
  web_url: string;
  values: {
    [attributeSlug: string]: AttioAttributeValue[];
  };
}

/**
 * Attio API Response
 */
export interface AttioRawData {
  data: AttioRecord[];
}

/**
 * Parsed Deal from Attio
 */
export interface AttioDeal {
  recordId: string;
  companyName: string;
  stage: PipelineStage;
  dealValue: number | null;
  createdAt: Date;
  stageChangedAt: Date;
  daysInStage: number;
  webUrl: string;
}
