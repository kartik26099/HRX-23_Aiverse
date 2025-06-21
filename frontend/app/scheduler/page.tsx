"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Trash2, Download, Bell, CheckCircle, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Task {
  id: string
  title: string
  hours: number
  category: string
  priority: "low" | "medium" | "high"
  completed: boolean
  scheduledDate?: string
  scheduledTime?: string
}

interface ScheduleSlot {
  date: string
  time: string
  task: Task | null
  available: boolean
}

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Complete React Tutorial",
      hours: 4,
      category: "Learning",
      priority: "high",
      completed: false,
    },
    {
      id: "2",
      title: "Build Portfolio Website",
      hours: 8,
      category: "Project",
      priority: "high",
      completed: false,
    },
    {
      id: "3",
      title: "Study Data Structures",
      hours: 3,
      category: "Learning",
      priority: "medium",
      completed: false,
    },
    {
      id: "4",
      title: "Practice Coding Problems",
      hours: 2,
      category: "Practice",
      priority: "medium",
      completed: true,
    },
  ])

  const [newTask, setNewTask] = useState({
    title: "",
    hours: "",
    category: "Learning",
    priority: "medium" as const,
  })

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [isAddingTask, setIsAddingTask] = useState(false)

  const categories = ["Learning", "Project", "Practice", "Research", "Other"]
  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-red-500" },
  ]

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ]

  const getWeekDates = (startDate: Date) => {
    const dates = []
    const start = new Date(startDate)
    start.setDate(start.getDate() - start.getDay()) // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(selectedWeek)

  const addTask = () => {
    if (!newTask.title.trim() || !newTask.hours) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      hours: Number.parseInt(newTask.hours),
      category: newTask.category,
      priority: newTask.priority,
      completed: false,
    }

    setTasks([...tasks, task])
    setNewTask({ title: "", hours: "", category: "Learning", priority: "medium" })
    setIsAddingTask(false)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const toggleTaskComplete = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const getPriorityColor = (priority: string) => {
    const p = priorities.find((p) => p.value === priority)
    return p?.color || "bg-gray-500"
  }

  const generateSchedule = () => {
    // Simple auto-scheduling algorithm
    const availableSlots: ScheduleSlot[] = []
    const incompleteTasks = tasks.filter((task) => !task.completed)

    weekDates.forEach((date) => {
      timeSlots.forEach((time) => {
        availableSlots.push({
          date: date.toISOString().split("T")[0],
          time,
          task: null,
          available: true,
        })
      })
    })

    // Sort tasks by priority and hours
    const sortedTasks = [...incompleteTasks].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    let slotIndex = 0
    sortedTasks.forEach((task) => {
      const hoursNeeded = task.hours
      let hoursScheduled = 0

      while (hoursScheduled < hoursNeeded && slotIndex < availableSlots.length) {
        if (availableSlots[slotIndex].available) {
          availableSlots[slotIndex].task = task
          availableSlots[slotIndex].available = false
          hoursScheduled++
        }
        slotIndex++
      }
    })

    setSchedule(availableSlots)
  }

  const exportToCalendar = () => {
    // Simulate calendar export
    alert("Schedule exported to calendar! (This is a demo)")
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DIY Scheduler</h1>
        <p className="text-muted-foreground">Plan and schedule your learning tasks with intelligent time management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Task Management */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Task List
              </CardTitle>
              <CardDescription>Manage your learning tasks and time estimates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>Create a new learning task with time estimate</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="task-title">Task Title</Label>
                      <Input
                        id="task-title"
                        placeholder="e.g., Complete React Tutorial"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="task-hours">Estimated Hours</Label>
                      <Input
                        id="task-hours"
                        type="number"
                        placeholder="e.g., 4"
                        value={newTask.hours}
                        onChange={(e) => setNewTask({ ...newTask, hours: e.target.value })}
                        min="1"
                        max="20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Button
                            key={category}
                            variant={newTask.category === category ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewTask({ ...newTask, category })}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <div className="flex gap-2">
                        {priorities.map((priority) => (
                          <Button
                            key={priority.value}
                            variant={newTask.priority === priority.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewTask({ ...newTask, priority: priority.value as any })}
                            className="flex items-center gap-2"
                          >
                            <div className={`w-2 h-2 rounded-full ${priority.color}`}></div>
                            {priority.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <Button onClick={addTask} className="w-full">
                      Add Task
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className={`p-3 border rounded-lg ${task.completed ? "bg-muted opacity-60" : ""}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0"
                          onClick={() => toggleTaskComplete(task.id)}
                        >
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium ${task.completed ? "line-through" : ""}`}>
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {task.category}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                            <span className="text-xs text-muted-foreground">{task.hours}h</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Total Hours:</span>
                  <span className="font-medium">
                    {tasks.filter((t) => !t.completed).reduce((sum, task) => sum + task.hours, 0)}h
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Completed:</span>
                  <span>{tasks.filter((t) => t.completed).reduce((sum, task) => sum + task.hours, 0)}h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={generateSchedule} className="w-full" variant="outline">
                <Calendar className="w-4 h-4 mr-2" />
                Auto Schedule
              </Button>
              <Button onClick={exportToCalendar} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Calendar
              </Button>
              <Button className="w-full" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Set Reminders
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Calendar View */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Weekly Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(selectedWeek)
                      newDate.setDate(newDate.getDate() - 7)
                      setSelectedWeek(newDate)
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium">
                    {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                    {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(selectedWeek)
                      newDate.setDate(newDate.getDate() + 7)
                      setSelectedWeek(newDate)
                    }}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {schedule.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Schedule Generated</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Auto Schedule" to automatically arrange your tasks
                  </p>
                  <Button onClick={generateSchedule}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Generate Schedule
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-8 gap-1 min-w-[800px]">
                    {/* Header */}
                    <div className="p-2 font-medium text-sm">Time</div>
                    {weekDates.map((date) => (
                      <div key={date.toISOString()} className="p-2 font-medium text-sm text-center">
                        {formatDate(date)}
                      </div>
                    ))}

                    {/* Time slots */}
                    {timeSlots.map((time) => (
                      <>
                        <div key={time} className="p-2 text-sm text-muted-foreground border-r">
                          {time}
                        </div>
                        {weekDates.map((date) => {
                          const dateStr = date.toISOString().split("T")[0]
                          const slot = schedule.find((s) => s.date === dateStr && s.time === time)

                          return (
                            <div
                              key={`${dateStr}-${time}`}
                              className={`p-1 border border-muted min-h-[60px] ${
                                slot?.task ? "bg-blue-50 dark:bg-blue-950" : "bg-muted/20"
                              }`}
                            >
                              {slot?.task && (
                                <div className="text-xs">
                                  <div className="font-medium truncate">{slot.task.title}</div>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {slot.task.category}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
