

export interface Admin {
    _id: string;
    name:string;
    lastName:string;
    email: string;
    password: string;
    // department:Department;
    // adminHeadId:string;
    role:string;
    adminUserPermission:any;
    isActive:boolean;
}

export interface UpdateAdmin {
    name:string;
    lastName:string;
}