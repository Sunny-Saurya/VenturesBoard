import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    await connectDB()
    
    const users = await User.find({})
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 }
    )
  }
}
