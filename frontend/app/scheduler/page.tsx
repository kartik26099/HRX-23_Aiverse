"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Trash2, Download, Bell, CheckCircle, Circle, CalendarDays, Settings } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorBoundary } from "@/components/error-boundary"
import { useDialogState } from "@/hooks/use-dialog-state"
import React from "react"

interface Task {
  id: string
  title: string
  hours: number
  category: string
  priority: "low" | "medium" | "high"
  completed: boolean
  assigned_date: string
  scheduledDate?: string
  scheduledTime?: string
  specificTime?: {
    date: string
    time: string
  }
}

interface ScheduleSlot {
  date: string
  time: string
  task: Task | null
  available: boolean
}

export default function SchedulerPage() {
  return (
    <ErrorBoundary>
      <SchedulerContent />
    </ErrorBoundary>
  )
}

function SchedulerContent() {
  const [tasks, setTasks] = useState<Task[]>([])

  const [newTask, setNewTask] = useState({
    title: "",
    hours: "",
    category: "Learning",
    priority: "medium" as const,
    assigned_date: new Date().toISOString().split('T')[0],
  })

  const [schedule, setSchedule] = useState<ScheduleSlot[]>([])
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [specificTimes, setSpecificTimes] = useState<{[key: string]: {date: string, time: string}}>({})
  
  // Use custom dialog state hook for better error handling
  const specificTimeDialog = useDialogState(false, { cleanupOnUnmount: true })
  const selectedTaskForTime = specificTimeDialog.data as Task | null

  const categories = ["Learning", "Project", "Practice", "Research", "Other"]
  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-red-500" },
  ]

  const timeSlots = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
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
    if (!newTask.title.trim() || !newTask.hours || !newTask.assigned_date) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      hours: Number.parseInt(newTask.hours),
      category: newTask.category,
      priority: newTask.priority,
      completed: false,
      assigned_date: newTask.assigned_date,
    }

    setTasks([...tasks, task])
    setNewTask({ 
      title: "", 
      hours: "", 
      category: "Learning", 
      priority: "medium",
      assigned_date: new Date().toISOString().split('T')[0],
    })
    setIsAddingTask(false)
  }

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id))
    // Remove specific time if it exists
    const newSpecificTimes = { ...specificTimes }
    delete newSpecificTimes[id]
    setSpecificTimes(newSpecificTimes)
    
    // Close dialog if the deleted task was selected
    if (selectedTaskForTime?.id === id) {
      specificTimeDialog.close()
    }
  }

  const toggleTaskComplete = (id: string) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
  }

  const getPriorityColor = (priority: string) => {
    const p = priorities.find((p) => p.value === priority)
    return p?.color || "bg-gray-500"
  }

  const setSpecificTime = (taskId: string, date: string, time: string) => {
    setSpecificTimes(prev => ({
      ...prev,
      [taskId]: { date, time }
    }))
    specificTimeDialog.close()
  }

  const removeSpecificTime = (taskId: string) => {
    const newSpecificTimes = { ...specificTimes }
    delete newSpecificTimes[taskId]
    setSpecificTimes(newSpecificTimes)
  }

  const closeSpecificTimeDialog = useCallback(() => {
    specificTimeDialog.close()
  }, [specificTimeDialog])

  // Clean up dialog state when tasks are deleted
  useEffect(() => {
    if (selectedTaskForTime && !tasks.find(task => task.id === selectedTaskForTime.id)) {
      closeSpecificTimeDialog()
    }
  }, [tasks, selectedTaskForTime, closeSpecificTimeDialog])

  // Prevent dialog from opening if task doesn't exist
  const openSpecificTimeDialog = useCallback((task: Task) => {
    if (tasks.find(t => t.id === task.id)) {
      specificTimeDialog.open(task)
    }
  }, [tasks, specificTimeDialog])

  const saveSpecificTime = () => {
    if (selectedTaskForTime) {
      setSpecificTimes(prev => ({
        ...prev,
        [selectedTaskForTime.id]: {
          date: selectedTaskForTime.assigned_date,
          time: specificTimes[selectedTaskForTime.id]?.time || "09:00"
        }
      }))
    }
    specificTimeDialog.close()
  }

  const generateSchedule = async () => {
    const incompleteTasks = tasks.filter((task) => !task.completed);
    if (incompleteTasks.length === 0) {
      alert("No incomplete tasks to schedule!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5002/generate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          tasks: incompleteTasks,
          use_ai: false, // Use rule-based scheduling by default
          specific_times: specificTimes
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate schedule from backend");
      }

      const result = await response.json();
      console.log("Schedule generated:", result);

      // The backend now returns a structured response
      const generatedSchedule = result.schedule;
      const method = result.method;
      const totalTasks = result.total_tasks;
      const totalHours = result.total_hours;

      // Convert the backend schedule format to our frontend format
      const formattedSchedule = generatedSchedule.map((item: any) => ({
        date: item.date,
        time: item.time,
        task: {
          id: Date.now().toString() + Math.random(), // Create a temporary ID
          title: item.task_title,
          hours: item.hours || 1, // Use the hours from backend or default to 1
          category: item.category || "Scheduled",
          priority: item.priority || "medium",
          completed: false,
          assigned_date: item.date,
          specificTime: item.is_specific_time ? { date: item.date, time: item.time } : undefined
        },
        available: false,
      }));

      // Create a full schedule view with available slots
      const fullSchedule: ScheduleSlot[] = [];
      weekDates.forEach((date) => {
        timeSlots.forEach((time) => {
          const scheduledItem = formattedSchedule.find(
            (item: any) =>
              item.date === date.toISOString().split("T")[0] && item.time === time
          );
          if (scheduledItem) {
            fullSchedule.push({
              date: date.toISOString().split("T")[0],
              time: scheduledItem.time,
              task: scheduledItem.task,
              available: false,
            });
          } else {
            fullSchedule.push({
              date: date.toISOString().split("T")[0],
              time: time,
              task: null,
              available: true,
            });
          }
        });
      });

      setSchedule(fullSchedule);
      
      // Show success message with method used
      const specificTimeCount = result.specific_times_count || 0;
      alert(`Schedule generated successfully using ${method} method!\nTotal tasks: ${totalTasks}\nTotal hours: ${totalHours}\nSpecific time preferences: ${specificTimeCount}`);
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("There was an error generating the schedule. Please check the console.");
    }
  };

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
                    <DialogDescription>Create a new learning task with time estimate and assigned date</DialogDescription>
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
                      <Label htmlFor="task-date">Assigned Date</Label>
                      <Input
                        id="task-date"
                        type="date"
                        value={newTask.assigned_date}
                        onChange={(e) => setNewTask({ ...newTask, assigned_date: e.target.value })}
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
                          <div className="flex items-center gap-1 mt-1">
                            <CalendarDays className="w-3 h-3 text-gray-600" />
                            <span className="text-xs text-gray-600">
                              {new Date(task.assigned_date).toLocaleDateString()}
                            </span>
                          </div>
                          {specificTimes[task.id] && (
                            <div className="flex items-center gap-1 mt-1">
                              <CalendarDays className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600">
                                Fixed: {specificTimes[task.id].time}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0"
                                onClick={() => removeSpecificTime(task.id)}
                              >
                                <Trash2 className="w-2 h-2" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!task.completed && !specificTimes[task.id] && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={() => openSpecificTimeDialog(task)}
                            title="Set specific time"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
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
              <Button onClick={generateSchedule} className="w-full">
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
                      <React.Fragment key={time}>
                        <div className="p-2 text-sm text-muted-foreground border-r">
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
                                  {slot.task.specificTime && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <CalendarDays className="w-2 h-2 text-blue-600" />
                                      <span className="text-xs text-blue-600">Fixed</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Specific Time Dialog */}
      {specificTimeDialog.isOpen && selectedTaskForTime && (
        <Dialog open={specificTimeDialog.isOpen} onOpenChange={(open) => {
          if (!open) {
            closeSpecificTimeDialog()
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Specific Time for Task</DialogTitle>
              <DialogDescription>
                Choose a specific time for "{selectedTaskForTime.title}" on {selectedTaskForTime.assigned_date}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Time</Label>
                <Select
                  value={specificTimes[selectedTaskForTime.id]?.time || "09:00"}
                  onValueChange={(value) => {
                    setSpecificTimes(prev => ({
                      ...prev,
                      [selectedTaskForTime.id]: {
                        date: selectedTaskForTime.assigned_date,
                        time: value
                      }
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={saveSpecificTime}
                  className="flex-1"
                >
                  Set Time
                </Button>
                <Button
                  variant="outline"
                  onClick={closeSpecificTimeDialog}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
