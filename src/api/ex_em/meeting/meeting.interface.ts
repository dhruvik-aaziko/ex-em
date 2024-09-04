// meeting.interface.ts

export interface meeting {
    title: string;
    companyName: string;
    countryName?: string;
    industry?: string;
    personName?: string;
    phoneNo?: string;
    emailID?: string;
    notStarted?: boolean;
    position?: string;
    dateTime?: Date;
    host?: string;
    location?: string;
    participants?: string[];
    status?: string;
  }
  