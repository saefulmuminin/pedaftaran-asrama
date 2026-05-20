import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth redirect ditangani di masing-masing layout (mahasiswa/layout.tsx & admin/layout.tsx)
// karena Firebase Auth menyimpan token di localStorage, bukan cookie
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
