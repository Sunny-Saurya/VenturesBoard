import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    await connectDB()
    
    const totalUsers = await User.countDocuments()
    const recentUsers = await User.find({})
      .select("name email username image createdAt lastLogin")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    const usersToday = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    })

    const usersThisWeek = await User.countDocuments({
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    })

    const usersThisMonth = await User.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        usersToday,
        usersThisWeek,
        usersThisMonth,
      },
      recentUsers,
    })
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user stats",
      },
      { status: 500 }
    )
  }
}
