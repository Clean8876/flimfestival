"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Eye, Loader2, MoreHorizontal, Plus, Trash2, Upload, Image as ImageIcon, Edit } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/custom-toast"
import { deleteEvent, getEvent, getFullEvent, getTime, uploadEventDayImage, updateEventDayWithImage, deleteEventDayImage } from "@/services/eventsService"
import type { EventDayItem, EventItem, TimeEntry } from "@/types/eventsTypes"
import EditTimeSlotModal from "./module/popups/edit-timeslot-modal"
import DeleteTimeSlotModal from "./module/popups/delete-timeslot-modal"
import UpdateDayImageModal from "./module/popups/update-day-image-modal"
import DeleteDayImageModal from "./module/popups/delete-day-image-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function EventsMainpage() {
  const { showToast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null)
  const [days, setDays] = useState<EventDayItem[]>([])
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeEntry | null>(null)
  const [selectedDayId, setSelectedDayId] = useState("")
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)
  const [updateImageModalOpen, setUpdateImageModalOpen] = useState(false)
  const [deleteImageModalOpen, setDeleteImageModalOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<EventDayItem | null>(null)

  useEffect(() => {
    void fetchData()
  }, [])

  async function fetchData() {
    setIsLoading(true)
    try {
      const events = await getEvent()
      const first = events?.[0] ?? null
      setCurrentEvent(first ?? null)
      if (first) {
        const [full, allTimes] = await Promise.all([getFullEvent(first._id), getTime()])
        const timesByDay = (allTimes || []).filter((t) => t.event_ref === first._id).reduce<Record<string, TimeEntry[]>>((acc, t) => {
          const k = t.day_ref
          if (!acc[k]) acc[k] = []
          acc[k].push(t)
          return acc
        }, {})
        const mergedDays = (full?.days ?? []).map((d) => ({ ...d, times: timesByDay[d._id] ?? d.times ?? [] }))
        setDays(mergedDays)
      } else {
        setDays([])
      }
    } catch (err: any) {
      showToast(err?.message ?? "Failed to load events", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDays = useMemo(() => {
    if (!searchTerm) return days
    const q = searchTerm.toLowerCase()
    return days.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
  }, [days, searchTerm])

  const totalSessions = useMemo(() => days.reduce((sum, d) => sum + (d.times?.length ?? 0), 0), [days])

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return
    setIsDeleting(eventId)
    try {
      const res = await deleteEvent(eventId)
      showToast(res.message ?? "Deleted", "success")
      await fetchData()
    } catch (err: any) {
      showToast(err?.message ?? "Failed to delete event", "error")
    } finally {
      setIsDeleting(null)
    }
  }

  function handleEditTimeSlot(timeSlot: TimeEntry, dayId: string) {
    setSelectedTimeSlot(timeSlot)
    setSelectedDayId(dayId)
    setEditModalOpen(true)
  }

  function handleDeleteTimeSlot(timeSlot: TimeEntry) {
    setSelectedTimeSlot(timeSlot)
    setDeleteModalOpen(true)
  }

  function handleModalSuccess() {
    void fetchData() // Refresh data after successful operation
  }

  async function handleImageUpload(dayId: string, file: File) {
    setUploadingImage(dayId)
    try {
      await uploadEventDayImage(dayId, file)
      showToast("Image uploaded successfully", "success")
      await fetchData() // Refresh data to show new image
    } catch (err: any) {
      showToast(err?.message ?? "Failed to upload image", "error")
    } finally {
      setUploadingImage(null)
    }
  }

  function handleUpdateImage(day: EventDayItem) {
    setSelectedDay(day)
    setUpdateImageModalOpen(true)
  }

  function handleDeleteImage(day: EventDayItem) {
    setSelectedDay(day)
    setDeleteImageModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen  dark:from-slate-900 dark:to-slate-800">
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 pt-0 max-w-10xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Events Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400">Manage events, schedules, and day images</p>
        </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/dashboard/events/create">
              <Plus className="mr-2 h-4 w-4" /> Create Event
            </Link>
          </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/admin/dashboard/events/add-time">
              <Clock className="mr-2 h-4 w-4" /> Add Time Slot
            </Link>
          </Button>
            </div>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Event</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{currentEvent ? 1 : 0}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400">Active event</p>
          </CardContent>
        </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Total Days</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{currentEvent?.totalDays ?? 0}</div>
              <p className="text-xs text-green-600 dark:text-green-400">Event duration</p>
          </CardContent>
        </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Event Days</CardTitle>
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">Days</Badge>
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{days.length}</div>
              <p className="text-xs text-purple-600 dark:text-purple-400">Configured days</p>
          </CardContent>
        </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{totalSessions}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Scheduled sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Event */}
      {currentEvent && (
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-emerald-600" />
                Current Event Details
              </CardTitle>
            <CardDescription>Information about the active event</CardDescription>
          </CardHeader>
          <CardContent>
              <div className="flex flex-col gap-6 p-6 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentEvent.name}</h3>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100 w-fit">
                      Active
                    </Badge>
                </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{currentEvent.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">
                      {new Date(currentEvent.startDate).toLocaleDateString()} - {new Date(currentEvent.endDate).toLocaleDateString()}
                    </span>
                  </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span className="text-slate-700 dark:text-slate-300">{currentEvent.totalDays} days</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <span className="text-slate-500">Year:</span>
                      <span className="text-slate-700 dark:text-slate-300">{currentEvent.year}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700 rounded-md">
                      <span className="text-slate-500">Month:</span>
                      <span className="text-slate-700 dark:text-slate-300">{currentEvent.month}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isDeleting === currentEvent._id} className="hover:bg-slate-100 dark:hover:bg-slate-700">
                      {isDeleting === currentEvent._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/dashboard/events/${currentEvent._id}`} className="flex items-center">
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/dashboard/events/edit/${currentEvent._id}`} className="flex items-center">
                        Edit Event
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/admin/dashboard/events/add-time`} className="flex items-center">Add Time Slot</Link>
                    </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteEvent(currentEvent._id)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

        {/* Search Section */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-600" />
              Search Event Days
            </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
              <Label htmlFor="search" className="text-slate-700 dark:text-slate-300">Search event days</Label>
              <Input 
                id="search" 
                placeholder="Search by name or description..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2 border-slate-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400"
              />
          </div>
        </CardContent>
      </Card>

        {/* Days List */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600" />
              Event Days & Sessions
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
            {filteredDays.length} day{filteredDays.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
            {filteredDays.map((day) => (
                <div key={day._id} className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          Day {day.dayNumber}: {day.name}
                        </h3>
                        <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                          {day.times?.length ?? 0} sessions
                        </Badge>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{day.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500">
                        Created: {new Date(day.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(day._id, file)
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={uploadingImage === day._id}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={uploadingImage === day._id}
                          className="cursor-pointer border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                          {uploadingImage === day._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                                  {/* Day Image Display */}
                  {day.image && (
                    <div className="mt-4">
                      <div className="relative w-full max-w-lg">
                        <img
                          src={day.image}
                          alt={`Day ${day.dayNumber} - ${day.name}`}
                          className="w-full h-56 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-600 shadow-lg"
                        />
                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                          <ImageIcon className="h-3 w-3 inline mr-1" />
                          Day Image
                        </div>
                        <div className="absolute bottom-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleUpdateImage(day)}
                            className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 shadow-sm"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteImage(day)}
                            className="bg-red-500/90 hover:bg-red-500 shadow-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                </div>
                  )}

                                  {/* Sessions */}
                {day.times && day.times.length > 0 ? (
                    <div className="mt-6">
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Sessions ({day.times.length})
                      </h4>
                      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                      {day.times.map((t) => (
                          <div key={t._id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-3">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h5 className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</h5>
                                <Badge 
                                  variant="secondary" 
                                  className={`w-fit ${
                                    t.type === 'event' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                                    t.type === 'workshop' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                    t.type === 'panel' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                                  }`}
                                >
                                  {t.type}
                                </Badge>
                              </div>
                              {t.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.description}</p>
                              )}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                  <Clock className="h-4 w-4" />
                                  <span>{t.startTime} - {t.endTime}</span>
                                  {t.location && (
                                    <>
                                      <span>•</span>
                                      <span>{t.location}</span>
                                    </>
                                  )}
                          </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleEditTimeSlot(t, day._id)}
                                    className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    onClick={() => handleDeleteTimeSlot(t)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                            </Button>
                                </div>
                              </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                    <div className="mt-6 text-center py-8 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                      <Clock className="h-8 w-8 mx-auto mb-3 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400 mb-3">No sessions scheduled for this day</p>
                      <Button variant="outline" size="sm" asChild className="border-slate-300 dark:border-slate-600">
                      <Link href="/admin/dashboard/events/add-time">Add Time Slot</Link>
                    </Button>
                  </div>
                )}
              </div>
            ))}

            {filteredDays.length === 0 && !currentEvent && (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-400" />
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No Events Found</h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first event to get started with the festival management.</p>
                  <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Link href="/admin/dashboard/events/create">
                    <Plus className="mr-2 h-4 w-4" /> Create Event
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Modals */}
      <EditTimeSlotModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        timeSlot={selectedTimeSlot}
        dayId={selectedDayId}
        onSuccess={handleModalSuccess}
      />

      <DeleteTimeSlotModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        timeSlot={selectedTimeSlot}
        onSuccess={handleModalSuccess}
      />

      <UpdateDayImageModal
        isOpen={updateImageModalOpen}
        onClose={() => setUpdateImageModalOpen(false)}
        day={selectedDay}
        onSuccess={handleModalSuccess}
      />

      <DeleteDayImageModal
        isOpen={deleteImageModalOpen}
        onClose={() => setDeleteImageModalOpen(false)}
        day={selectedDay}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
