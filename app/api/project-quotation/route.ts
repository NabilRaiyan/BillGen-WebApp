import { NextResponse } from "next/server";

export async function GET(){
    const quotations = [
        { id: 1, qname: 'Project Quotation System', status: 'In Progress' },
        { id: 2, qname: 'Client Onboarding Portal', status: 'Completed' },
        { id: 3, qname: 'Marketing Website Redesign', status: 'Pending' },


    ];
    return NextResponse.json(quotations);
}