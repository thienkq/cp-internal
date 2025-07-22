"use client"

import { Card, CardContent } from "@workspace/ui/components/card"
import { useRouter } from "next/navigation"
import { Calendar, Shield, Settings, Clock, MapPin, Mail, Ban } from "lucide-react"

const settingsCards = [
  {
    id: "leave-types",
    title: "Leave types",
    description: "Add and edit leave types and specify the unit, cycle, and color code of each leave type.",
    icon: Calendar,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    route: "/admin/leave-types",
  },
  {
    id: "company-policy",
    title: "Company Policy",
    description: "Add and manage company policies, tenure rules, carryover settings and global leave configurations.",
    icon: Shield,
    iconColor: "text-pink-500",
    iconBg: "bg-pink-50",
    route: "/admin/company-policy",
  },
  {
    id: "work-schedules",
    title: "Work schedules",
    description:
      "Set working days, times and rotating shifts, so every employee can be assigned to a different work schedule.",
    icon: Clock,
    iconColor: "text-purple-500",
    iconBg: "bg-purple-50",
    route: "/admin/work-schedules",
    disabled: true,
  },
  {
    id: "balance-reset",
    title: "Balance reset",
    description: "Set the start of your calendar, and enable anniversary balance reset.",
    icon: Settings,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    route: "/admin/balance-reset",
    disabled: true,
  },
  {
    id: "locations-holidays",
    title: "Locations and holidays",
    description:
      "Add and manage location settings, time zone, date formats, location leave policy and official holidays.",
    icon: MapPin,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    route: "/admin/locations-holidays",
    disabled: true,
  },
  {
    id: "calendar-options",
    title: "Calendar options",
    description: "Define which requests employees can view in their dashboard calendar.",
    icon: Calendar,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    route: "/admin/calendar-options",
    disabled: true,
  },
  {
    id: "blockout-dates",
    title: "Blockout dates",
    description: "Add blocked dates or limit the number of allowed request on any selected dates.",
    icon: Ban,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    route: "/admin/blockout-dates",
    disabled: true,
  },
  {
    id: "email-configurations",
    title: "Email configurations",
    description: "Customize email notifications that are sent to employees and manage the emails sender.",
    icon: Mail,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-50",
    route: "/admin/email-configurations",
    disabled: true,
  },
]

export function AdminSettingsOverview() {
  const router = useRouter()

  const handleCardClick = (card: any) => {
    if (!card.disabled) {
      router.push(card.route)
    }
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Configure your leave management system</p>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCards.map((card) => {
          const IconComponent = card.icon
          return (
            <Card
              key={card.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md border-gray-200 ${
                card.disabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50"
                  : "hover:border-gray-300 bg-white hover:bg-gray-50"
              }`}
              onClick={() => handleCardClick(card)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-3 rounded-lg ${card.iconBg} flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 ${card.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{card.description}</p>
                    {card.disabled && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">4</div>
            <div className="text-sm text-gray-600">Active Leave Types</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">12</div>
            <div className="text-sm text-gray-600">Base Annual Quota</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">Jan 31</div>
            <div className="text-sm text-gray-600">Carryover Expiry</div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">5</div>
            <div className="text-sm text-gray-600">Working Days/Week</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
