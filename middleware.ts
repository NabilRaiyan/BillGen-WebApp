// Middleware completely disabled for now
// We'll use client-side route protection instead

import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Let all requests pass through
  return NextResponse.next();
}

export const config = {
  matcher: []  // Empty matcher - middleware won't run on any routes
};