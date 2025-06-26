"use client"

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, CheckCircle, Play, Target, Zap, Code, Cpu, Sparkles, Package, Users, Brain, Eye, AlertCircle } from "lucide-react"

// Map of icon name to actual component
const iconMap: Record<string, JSX.Element> = {
  Calendar: <Calendar className="h-4 w-4" />,
  Clock: <Clock className="h-4 w-4" />,
  CheckCircle: <CheckCircle className="h-4 w-4" />,
  Play: <Play className="h-4 w-4" />,
  Target: <Target className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Code: <Code className="h-4 w-4" />,
  Cpu: <Cpu className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Package: <Package className="h-4 w-4" />,
  Users: <Users className="h-4 w-4" />,
  Brain: <Brain className="h-4 w-4" />,
  Eye: <Eye className="h-4 w-4" />,
  AlertCircle: <AlertCircle className="h-4 w-4" />,
};

interface TimelineStep {
  time?: string;
  title: string;
  description: string;
  icon: keyof typeof iconMap;
  color?: 'primary' | 'secondary' | 'grey' | 'default' | 'success' | 'warning' | 'info';
  variant?: 'outlined' | 'filled';
  milestone?: boolean;
  duration?: string;
}

interface Props {
  data: TimelineStep[];
  title?: string;
  description?: string;
}

const getColorClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'bg-blue-500 text-white';
    case 'secondary':
      return 'bg-purple-500 text-white';
    case 'success':
      return 'bg-green-500 text-white';
    case 'warning':
      return 'bg-amber-500 text-white';
    case 'info':
      return 'bg-cyan-500 text-white';
    case 'grey':
    default:
      return 'bg-slate-500 text-white';
  }
};

const getBorderColorClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'border-blue-200 dark:border-blue-800';
    case 'secondary':
      return 'border-purple-200 dark:border-purple-800';
    case 'success':
      return 'border-green-200 dark:border-green-800';
    case 'warning':
      return 'border-amber-200 dark:border-amber-800';
    case 'info':
      return 'border-cyan-200 dark:border-cyan-800';
    case 'grey':
    default:
      return 'border-slate-200 dark:border-slate-700';
  }
};

const getBackgroundColorClasses = (color: string) => {
  switch (color) {
    case 'primary':
      return 'bg-blue-50 dark:bg-blue-900/20';
    case 'secondary':
      return 'bg-purple-50 dark:bg-purple-900/20';
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-900/20';
    case 'info':
      return 'bg-cyan-50 dark:bg-cyan-900/20';
    case 'grey':
    default:
      return 'bg-slate-50 dark:bg-slate-700';
  }
};

const ProjectTimeline: React.FC<Props> = ({ data, title = "Project Workflow", description = "Your project workflow steps" }) => {
  return (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <CardHeader className="border-b border-slate-200 dark:border-slate-700 pb-4">
        <CardTitle className="flex items-center space-x-3 text-slate-800 dark:text-slate-200">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <span>{title}</span>
        </CardTitle>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {description}
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-600"></div>
          
          <div className="space-y-6">
            {data.map((step, index) => (
              <div key={index} className="relative flex items-start space-x-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex-shrink-0 w-12 h-12 rounded-full ${getColorClasses(step.color || 'grey')} flex items-center justify-center shadow-lg`}>
                  {iconMap[step.icon]}
                </div>
                
                {/* Content */}
                <div className={`flex-1 ${getBackgroundColorClasses(step.color || 'grey')} rounded-xl p-5 border ${getBorderColorClasses(step.color || 'grey')} shadow-sm`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                          {step.title}
                        </h3>
                        {step.milestone && (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                            Milestone
                          </Badge>
                        )}
                      </div>
                      
                      {step.time && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <Clock className="h-3 w-3" />
                          <span className="font-medium">{step.time}</span>
                        </div>
                      )}
                      
                      {step.duration && (
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400 mb-3">
                          <Calendar className="h-3 w-3" />
                          <span>{step.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTimeline; 