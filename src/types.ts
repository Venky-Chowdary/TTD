export type Gender = 'Male' | 'Female' | 'Other';

export type IdType = 'Aadhaar' | 'PAN' | 'Passport' | 'Voter ID' | 'Driving License' | 'Other';

export interface Pilgrim {
  id: string;
  name: string;
  age: string;
  gender: Gender;
  mobile: string;
  idType: IdType;
  idNumber: string;
  relation: string;
  note: string;
  docUrl?: string;
}

export interface BookingEvent {
  id: string;
  title: string;
  datetime: string;
  url: string;
  note: string;
}
