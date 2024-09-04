export interface calls {
    name: string;
    company: string;
    position: string;
    callType: string;
    callStatus: string;
    scheduledAt: Date;
    callDuration: number; // Duration in seconds
    subject: string;
    voiceRecording?: string; // Optional field
    callPurpose: string;
    callResult: string;
    description?: string; // Optional field
}


