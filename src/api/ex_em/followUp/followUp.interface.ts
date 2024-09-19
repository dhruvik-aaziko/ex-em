
    export interface followUp {
    name: string;
    companyName: string;
    position: string;
    callType: string;
    outgoingStatus: string;
    dateTime: Date;
    agent: string;
    subject: string;
    callResult: string;
    notes: Note[];
}

export interface Note {
    text?: string;
    video?: string[];
    photo?: string[];
    audio?: string[];
    documents?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}
