export type ClientStatus = 'lead' | 'active' | 'paused' | 'lost'

export interface Client {
  id: number
  name: string
  company_name: string
  phone: string
  email: string
  website: string
  industry: string
  notes: string
  status: ClientStatus
  active_projects_count: number
  created_at: string
  updated_at: string
}

export type ProjectType =
  | 'seo_monthly'
  | 'website_design'
  | 'ecommerce_setup'
  | 'seo_audit'
  | 'consulting'
  | 'content_marketing'

export type BillingType = 'fixed' | 'hourly' | 'retainer' | 'hybrid'

export type ProjectStatus =
  | 'backlog'
  | 'planning'
  | 'active'
  | 'review'
  | 'completed'
  | 'paused'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface ProjectFinancials {
  revenue_amount: string | null
  capacity_hours: string | null
  estimated_monthly_hours: string | null
  logged_hours: string
  variance_hours: string | null
  effective_hourly_rate: string | null
  earned_from_hours: string | null
  profitability_status: 'profitable' | 'balanced' | 'low_margin' | 'losing' | 'unknown'
}

export type DeliveryStatusValue = 'on_track' | 'at_risk' | 'behind'

export interface DeliveryStatus {
  status: DeliveryStatusValue
  progress_percent: number
  total_tasks: number
  completed_tasks: number
  due_tasks: number
  completed_due_tasks: number
}

export interface Project {
  id: number
  client: number
  client_name: string
  name: string
  website: string
  project_type: ProjectType
  billing_type: BillingType
  start_date: string | null
  end_date: string | null
  priority: Priority
  status: ProjectStatus
  description: string
  budget: string | null
  hourly_rate: string | null
  monthly_revenue_target: string | null
  estimated_monthly_hours: string | null
  search_console_site_url: string
  financials: ProjectFinancials
  delivery_status: DeliveryStatus
  created_at: string
  updated_at: string
}

export type TaskStatus = 'backlog' | 'todo' | 'doing' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type Recurrence = 'none' | 'weekly' | 'monthly'

export interface TaskCategory {
  id: number
  name: string
  group: string
  default_estimated_hours: string | null
}

export interface Task {
  id: number
  project: number
  project_name: string
  assignee: number | null
  category: number | null
  category_name: string | null
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  estimated_hours: string | null
  actual_hours: string | number
  deadline: string | null
  recurrence: Recurrence
  value_generated: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  priority_score?: number
}

export interface TimeEntry {
  id: number
  task: number
  task_title: string
  project_name: string
  date: string
  duration_hours: string
  started_at: string | null
  ended_at: string | null
  notes: string
  url: string
  created_at: string
}

export interface TimerSession {
  id: number
  task: number
  task_title: string
  started_at: string
  is_running: boolean
  accumulated_seconds: number
  last_resumed_at: string
  current_seconds: number
}

export interface CapacitySummary {
  available_hours: number
  allocated_hours: number
  consumed_hours: number
  remaining_hours: number
  is_overloaded: boolean
  overloaded_by: number
}

export interface RevenueSummary {
  fixed_and_retainer: number
  hourly: number
  total: number
}

export interface ProjectHealth {
  project_id: number
  project_name: string
  client_name: string
  completion_rate: number
  overdue_tasks: number
  health_score: number
}

export interface TodayActivityEntry {
  task_title: string
  hours: string
  notes: string
}

export interface TodayActivityProject {
  project_id: number
  project_name: string
  hours: string
  entries: TodayActivityEntry[]
}

export interface DashboardData {
  today_tasks: Task[]
  overdue_tasks: Task[]
  today_activity: TodayActivityProject[]
  today_total_hours: string
  capacity: CapacitySummary
  revenue: RevenueSummary
  project_health: ProjectHealth[]
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface TaskTemplateItem {
  id?: number
  title: string
  category: number | null
  estimated_hours: string | null
  order: number
}

export interface TaskTemplate {
  id: number
  name: string
  description: string
  project_type: ProjectType | ''
  items: TaskTemplateItem[]
}

export interface KeywordRankHistory {
  id: number
  rank: number
  checked_on: string
}

export interface Keyword {
  id: number
  project: number
  project_name: string
  keyword: string
  url: string
  current_rank: number | null
  target_rank: number | null
  rank_gap: number | null
  search_volume: number | null
  difficulty: number | null
  last_checked: string | null
  notes: string
  history: KeywordRankHistory[]
  created_at: string
  updated_at: string
}

export type UserRole =
  | 'owner'
  | 'seo_specialist'
  | 'content_writer'
  | 'developer'
  | 'designer'
  | 'client'

export interface ContentBriefHeading {
  level: string
  text: string
}

export interface ContentBrief {
  id: number
  project: number
  keyword: number | null
  target_keyword: string
  competitor_notes: string
  intent: string
  h1: string
  headings: ContentBriefHeading[]
  faq: string[]
  related_keywords: string[]
  internal_link_suggestions: string[]
  target_word_count: number | null
  cta_suggestion: string
  created_at: string
}

export interface Me {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  is_owner: boolean
  monthly_capacity_hours: string
  working_days_per_month: number
}

export interface TeamMember {
  id: number
  username: string
  password?: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  monthly_capacity_hours: string
  working_days_per_month: number
  is_active: boolean
}
