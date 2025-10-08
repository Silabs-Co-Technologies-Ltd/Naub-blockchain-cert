import { NextResponse } from "next/server"
import { database } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    const isValid = await database.verifyAdmin(username, password)

    if (isValid) {
      return NextResponse.json({ success: true, message: "Login successful" })
    } else {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
