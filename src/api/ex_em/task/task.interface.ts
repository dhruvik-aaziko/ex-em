export interface tasks {
    userAdminId: String;
    taskOwner: String;
    companyName: String;
    subject: String;
    dueDate: Date;
    relatedTo: String;
    status: String;
    assign: String;
    repeat: String;
    priority: String;
    reminder: Date;
    notes: Notes[]

}

export interface Notes {
    text: string;
    video: string[];
    photo: string[];
    audio: string[];
    documents: string[];
}