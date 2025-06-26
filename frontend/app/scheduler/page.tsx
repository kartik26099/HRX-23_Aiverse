"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Plus, Trash2, Download, Bell, CheckCircle, Circle, CalendarDays, Settings, AlertCircle, Moon, Sun, Zap, Phone, MessageSquare } from "lucide-react"
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

// Client-only wrapper component to prevent hydration issues
function ClientOnly({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

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
    startTime: string
    endTime: string
  }
}

interface ScheduleSlot {
  date: string
  time: string
  task: Task | null
  available: boolean
}

interface ExtendedHours {
  start: number
  end: number
  sleep_start: number
  sleep_end: number
  slots: string[]
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
  const [extendedHours, setExtendedHours] = useState<ExtendedHours>({
    start: 6,
    end: 5,
    sleep_start: 22,
    sleep_end: 6,
    slots: []
  })
  const [sleepSlots, setSleepSlots] = useState<string[]>([])
  const [userPhone, setUserPhone] = useState("+918830747512")
  const [reminderPreferences, setReminderPreferences] = useState({
    reminder_timing: 15,
    reminder_style: "motivational",
    active_hours_start: 6,
    active_hours_end: 22
  })

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
  const [specificTimes, setSpecificTimes] = useState<{[key: string]: {date: string, startTime: string, endTime: string}}>({})
  const [isLoading, setIsLoading] = useState(false)
  const [useAI, setUseAI] = useState(true)
  const [remindersEnabled, setRemindersEnabled] = useState(false)
  
  // Use custom dialog state hook for better error handling
  const specificTimeDialog = useDialogState(false, { cleanupOnUnmount: true })
  const selectedTaskForTime = specificTimeDialog.data as Task | null

  const categories = ["Learning", "Project", "Practice", "Research", "Other"]
  const priorities = [
    { value: "low", label: "Low", color: "bg-gray-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-red-500" },
  ]

  // Fetch extended hours from backend on component mount
  useEffect(() => {
    const fetchExtendedHours = async () => {
      try {
        const response = await fetch("http://localhost:4008/get-time-slots")
        if (response.ok) {
          const data = await response.json()
          setExtendedHours(data.extended_hours)
          setSleepSlots(data.sleep_slots || [])
        }
      } catch (error) {
        console.error("Failed to fetch extended hours:", error)
        // Fallback to default 6 AM to 5 AM
        const defaultSlots = []
        for (let hour = 6; hour < 24; hour++) {
          defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        }
        for (let hour = 0; hour <= 5; hour++) {
          defaultSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        }
        setExtendedHours({
          start: 6,
          end: 5,
          sleep_start: 22,
          sleep_end: 6,
          slots: defaultSlots
        })
        // Default sleep slots
        const defaultSleepSlots = []
        for (let hour = 22; hour < 24; hour++) {
          defaultSleepSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        }
        for (let hour = 0; hour < 6; hour++) {
          defaultSleepSlots.push(`${hour.toString().padStart(2, '0')}:00`)
        }
        setSleepSlots(defaultSleepSlots)
      }
    }

    fetchExtendedHours()
  }, [])

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

  const setSpecificTime = (taskId: string, date: string, startTime: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    
    // Calculate end time based on task hours
    const startHour = parseInt(startTime.split(':')[0])
    const startMinute = parseInt(startTime.split(':')[1])
    const endHour = (startHour + task.hours) % 24
    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
    
    setSpecificTimes(prev => ({
      ...prev,
      [taskId]: { date, startTime, endTime }
    }))
  }

  const removeSpecificTime = (taskId: string) => {
    const newSpecificTimes = { ...specificTimes }
    delete newSpecificTimes[taskId]
    setSpecificTimes(newSpecificTimes)
  }

  const clearAllSpecificTimes = () => {
    setSpecificTimes({})
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
      const currentTimeData = specificTimes[selectedTaskForTime.id];
      console.log("DEBUG: saveSpecificTime - selectedTaskForTime:", selectedTaskForTime);
      console.log("DEBUG: saveSpecificTime - currentTimeData:", currentTimeData);
      
      if (currentTimeData && currentTimeData.startTime) {
        // Use the existing startTime and endTime from the dialog
        const newTimeData = {
          date: selectedTaskForTime.assigned_date,
          startTime: currentTimeData.startTime,
          endTime: currentTimeData.endTime
        };
        console.log("DEBUG: saveSpecificTime - using existing data:", newTimeData);
        setSpecificTimes(prev => ({
          ...prev,
          [selectedTaskForTime.id]: newTimeData
        }))
      } else {
        // Fallback to default time
        const defaultTimeData = {
          date: selectedTaskForTime.assigned_date,
          startTime: "06:00",
          endTime: `${(6 + selectedTaskForTime.hours) % 24}:00`
        };
        console.log("DEBUG: saveSpecificTime - using default data:", defaultTimeData);
        setSpecificTimes(prev => ({
          ...prev,
          [selectedTaskForTime.id]: defaultTimeData
        }))
      }
    }
    specificTimeDialog.close()
  }

  const testReminder = async () => {
    if (!userPhone) {
      alert("Please enter your phone number first!")
      return
    }

    try {
      const response = await fetch("http://localhost:4008/reminders/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          user_phone: userPhone,
          message: "🧪 Test reminder from DIY Scheduler!"
        }),
      });

      const result = await response.json()

      if (response.ok) {
        alert(`✅ Test reminder scheduled!\n📱 Check your phone in 1 minute\n📞 Formatted number: ${result.formatted_phone}\n🆔 Reminder ID: ${result.reminder_id}`)
      } else {
        // Handle validation errors
        if (result.error && result.help) {
          alert(`❌ ${result.error}\n\n💡 ${result.help}`)
        } else {
          alert(`❌ Failed to send test reminder: ${result.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error("Error sending test reminder:", error)
      alert("❌ Error sending test reminder. Please check your connection and try again.")
    }
  }

  const generateSchedule = async () => {
    const incompleteTasks = tasks.filter((task) => !task.completed);
    if (incompleteTasks.length === 0) {
      alert("No incomplete tasks to schedule!");
      return;
    }

    console.log("DEBUG: Frontend specificTimes:", specificTimes);
    console.log("DEBUG: Frontend incompleteTasks:", incompleteTasks);

    setIsLoading(true);
    try {
      const requestBody = { 
        tasks: incompleteTasks,
        use_ai: useAI, // Use AI-powered scheduling
        specific_times: specificTimes,
        user_phone: remindersEnabled ? userPhone : undefined
      };
      
      console.log("DEBUG: Sending request body:", requestBody);
      
      const response = await fetch("http://localhost:4008/generate-schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
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
      const scheduledHours = result.scheduled_hours;
      const availableHours = result.available_hours;
      const remindersScheduled = result.reminders_scheduled || 0;

      // Convert the backend schedule format to our frontend format
      const formattedSchedule = generatedSchedule.map((item: any) => ({
        date: item.date,
        time: item.time,
        task: {
          id: item.task_id || Date.now().toString() + Math.random(),
          title: item.task_title,
          hours: item.hours || 1,
          category: item.category || "Scheduled",
          priority: item.priority || "medium",
          completed: false,
          assigned_date: item.date,
          specificTime: item.is_specific_time ? { 
            date: item.date, 
            startTime: item.start_time || item.time,
            endTime: item.end_time || item.time
          } : undefined
        },
        available: false,
      }));

      // Create a full schedule view with available slots (6 AM to 5 AM)
      const fullSchedule: ScheduleSlot[] = [];
      weekDates.forEach((date) => {
        extendedHours.slots.forEach((time) => {
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
      let message = `Schedule generated successfully using ${method} method!\nTotal tasks: ${totalTasks}\nTotal hours: ${totalHours}\nScheduled hours: ${scheduledHours}\nAvailable hours: ${availableHours}\nSpecific time preferences: ${specificTimeCount}`;
      
      if (remindersEnabled && remindersScheduled > 0) {
        message += `\n📱 SMS reminders scheduled: ${remindersScheduled}`;
      }
      
      alert(message);
    } catch (error) {
      console.error("Error generating schedule:", error);
      alert("There was an error generating the schedule. Please check the console.");
    } finally {
      setIsLoading(false);
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

  const formatTime = (time: string) => {
    if (!time) return "N/A"
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const isSleepTime = (time: string) => {
    return sleepSlots.includes(time)
  }

  const getTimeSlotClass = (time: string, hasTask: boolean, isSpecificTime: boolean) => {
    if (isSleepTime(time)) {
      return "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
    }
    if (hasTask) {
      return isSpecificTime ? "bg-blue-100 dark:bg-blue-900" : "bg-green-50 dark:bg-green-950"
    }
    return "bg-muted/20"
  }

  return (
    <div className="container py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">DIY Scheduler</h1>
        <p className="text-muted-foreground">Plan and schedule your learning tasks with AI-powered intelligent time management (6 AM - 5 AM)</p>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Sun className="w-4 h-4" />
            <span>6 AM - 5 AM (23 hours)</span>
          </div>
          <div className="flex items-center gap-1">
            <Moon className="w-4 h-4" />
            <span>Sleep: 10 PM - 6 AM</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>AI-Powered Scheduling</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>SMS Reminders</span>
          </div>
        </div>
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
                              <AlertCircle className="w-3 h-3 text-blue-600" />
                              <span className="text-xs text-blue-600 font-medium">
                                Fixed: {formatTime(specificTimes[task.id]?.startTime || '')}-{formatTime(specificTimes[task.id]?.endTime || '')}
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
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fixed Times:</span>
                  <span>{Object.keys(specificTimes).length}</span>
                </div>
                {Object.keys(specificTimes).length > 0 && (
                  <div className="flex justify-center mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSpecificTimes}
                      className="text-xs"
                    >
                      Clear All Fixed Times
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reminder Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                SMS Reminders
              </CardTitle>
              <CardDescription>Configure AI-powered SMS reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-number">Phone Number (E.164 Format)</Label>
                <div className="flex gap-2">
                  <ClientOnly fallback={<div className="flex-1 h-10 bg-muted rounded-md animate-pulse" />}>
                    <Input
                      id="phone-number"
                      placeholder="+91XXXXXXXXXX (10 digits after +91)"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      suppressHydrationWarning={true}
                    />
                  </ClientOnly>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={testReminder}
                    disabled={!userPhone}
                    title="Test reminder"
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Default: +91 (India). Use E.164 format: +[country code][number]<br/>
                  Examples: +918830745678 (India), +1234567890 (US)
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <ClientOnly fallback={<div className="w-4 h-4 bg-muted rounded animate-pulse" />}>
                  <input
                    type="checkbox"
                    id="enable-reminders"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="rounded"
                    suppressHydrationWarning={true}
                  />
                </ClientOnly>
                <Label htmlFor="enable-reminders" className="text-sm">Enable SMS Reminders</Label>
              </div>
              
              {remindersEnabled && (
                <div className="space-y-2">
                  <Label>Reminder Timing</Label>
                  <Select
                    value={reminderPreferences.reminder_timing.toString()}
                    onValueChange={(value) => setReminderPreferences(prev => ({
                      ...prev,
                      reminder_timing: parseInt(value)
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes before</SelectItem>
                      <SelectItem value="10">10 minutes before</SelectItem>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <ClientOnly fallback={<div className="w-4 h-4 bg-muted rounded animate-pulse" />}>
                  <input
                    type="checkbox"
                    id="use-ai"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="rounded"
                    suppressHydrationWarning={true}
                  />
                </ClientOnly>
                <Label htmlFor="use-ai" className="text-sm">Use AI-Powered Scheduling</Label>
              </div>
              <Button onClick={generateSchedule} className="w-full" disabled={isLoading}>
                <Zap className="w-4 h-4 mr-2" />
                {isLoading ? "Generating..." : "Generate Schedule"}
              </Button>
              <Button onClick={exportToCalendar} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Calendar
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
                  Weekly Schedule (6 AM - 5 AM)
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
                    Click "Generate Schedule" to automatically arrange your tasks with AI-powered intelligence
                  </p>
                  <Button onClick={generateSchedule} disabled={isLoading}>
                    <Zap className="w-4 h-4 mr-2" />
                    {isLoading ? "Generating..." : "Generate Schedule"}
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

                    {/* Time slots (6 AM to 5 AM) */}
                    {extendedHours.slots.map((time) => (
                      <React.Fragment key={time}>
                        <div className={`p-2 text-sm border-r ${isSleepTime(time) ? 'text-gray-500 bg-gray-50 dark:bg-gray-800' : 'text-muted-foreground'}`}>
                          <div className="flex items-center gap-1">
                            {isSleepTime(time) && <Moon className="w-3 h-3" />}
                            {formatTime(time)}
                          </div>
                        </div>
                        {weekDates.map((date) => {
                          const dateStr = date.toISOString().split("T")[0]
                          const slot = schedule.find((s) => s.date === dateStr && s.time === time)

                          return (
                            <div
                              key={`${dateStr}-${time}`}
                              className={`p-1 border border-muted min-h-[60px] ${getTimeSlotClass(time, !!slot?.task, !!slot?.task?.specificTime)}`}
                            >
                              {slot?.task && (
                                <div className="text-xs">
                                  <div className="font-medium truncate">{slot.task.title}</div>
                                  <Badge variant="secondary" className="text-xs mt-1">
                                    {slot.task.category}
                                  </Badge>
                                  {slot.task.specificTime && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <AlertCircle className="w-2 h-2 text-blue-600" />
                                      <span className="text-xs text-blue-600 font-medium">
                                        {formatTime(slot.task.specificTime?.startTime || '')}-{formatTime(slot.task.specificTime?.endTime || '')}
                                      </span>
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
                Choose a specific start time for "{selectedTaskForTime?.title}" on {selectedTaskForTime?.assigned_date}
                <br />
                <span className="text-sm text-muted-foreground">
                  Duration: {selectedTaskForTime?.hours} hour{selectedTaskForTime?.hours && selectedTaskForTime.hours > 1 ? 's' : ''}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Start Time (Extended Hours: 6 AM - 5 AM)</Label>
                <Select
                  value={specificTimes[selectedTaskForTime?.id || '']?.startTime || "06:00"}
                  onValueChange={(value) => {
                    if (!selectedTaskForTime) return
                    const task = selectedTaskForTime
                    const startHour = parseInt(value.split(':')[0])
                    const startMinute = parseInt(value.split(':')[1])
                    const endHour = (startHour + task.hours) % 24
                    const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`
                    
                    setSpecificTimes(prev => ({
                      ...prev,
                      [selectedTaskForTime.id]: {
                        date: selectedTaskForTime.assigned_date,
                        startTime: value,
                        endTime: endTime
                      }
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {extendedHours.slots.map((time) => (
                      <SelectItem key={time} value={time}>
                        <div className="flex items-center gap-2">
                          {isSleepTime(time) && <Moon className="w-3 h-3" />}
                          {formatTime(time)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {specificTimes[selectedTaskForTime?.id || '']?.startTime && (
                <div className="space-y-2">
                  <Label>End Time (Calculated)</Label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatTime(specificTimes[selectedTaskForTime?.id || '']?.startTime || '')} - {formatTime(specificTimes[selectedTaskForTime?.id || '']?.endTime || '')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({selectedTaskForTime?.hours} hour{selectedTaskForTime?.hours && selectedTaskForTime.hours > 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>This task will be scheduled at the exact time you specify, regardless of other scheduling rules.</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={saveSpecificTime}
                  className="flex-1"
                >
                  Set Fixed Time
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
