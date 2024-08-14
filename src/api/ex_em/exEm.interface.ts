export interface exEm {
    date: Date;
    shipmentId: number;
    hsCode: number;
    hsCode_1: number;
    industry: string;
    product: string;
    bCountry: string;
    company: string;
    dPort: string;
    sCountry: string;
    seller: string;
    sPort: string;
    portCode: string;
    unit: string;
    qty: number;
    value: number;
    pricePerUnit: number;
    emptyField?: string; // Optional field for "__EMPTY"
}
