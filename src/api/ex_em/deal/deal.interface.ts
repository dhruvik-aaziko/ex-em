export interface deals {
    dealOwner: string;
    dealName: string;
    accountName: string;
    type:  string;
    nextStep: string;
    leadSource: string;
    contactName: string;
    amount: number;
    closingDate: Date;
    stage: Date;
    probability: number; // should be between 0 and 100
    expectedRevenue: number;
    campaignSource?: string; 
    assignedTo: string;
    description?: string; 
    notes: Notes[]

}

export interface Notes {
    text: string;
    video: string[];
    photo: string[];
    audio: string[];
    documents: string[];
}