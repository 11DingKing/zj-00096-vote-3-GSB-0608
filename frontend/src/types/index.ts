export enum Role {
  ADMIN = 'admin',
  CREATOR = 'creator',
  VOTER = 'voter',
}

export enum PollType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  RANKING = 'ranking',
  RATING = 'rating',
  WEIGHTED = 'weighted',
}

export enum PollStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ENDED = 'ended',
  ARCHIVED = 'archived',
}

export enum NotificationType {
  POLL_STARTED = 'poll_started',
  POLL_ENDED = 'poll_ended',
  NEW_COMMENT = 'new_comment',
  COMMENT_LIKED = 'comment_liked',
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: Role;
  weight: number;
}

export interface Option {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface Poll {
  id: number;
  title: string;
  description?: string;
  type: PollType;
  options: Option[];
  startTime?: string;
  endTime?: string;
  isAnonymous: boolean;
  isPublic: boolean;
  maxVotesPerUser: number;
  status: PollStatus;
  creator: { id: number; name: string };
  createdAt: string;
}

export interface VoteOptionDto {
  optionId: number;
  rankValue?: number;
  ratingValue?: number;
}

export interface ResultItem {
  optionId: number;
  optionName: string;
  count: number;
  percentage: number;
  weightedScore?: number;
  avgRating?: number;
  bordaScore?: number;
  rank: number;
}

export interface PollResults {
  pollId: number;
  pollTitle: string;
  pollType: PollType;
  totalVotes: number;
  results: ResultItem[];
}

export interface Template {
  id: number;
  name: string;
  description: string;
  type: PollType;
  defaultOptions: string[];
  isAnonymous: boolean;
  isPublic: boolean;
}

export interface Comment {
  id: number;
  content: string;
  likeCount: number;
  user: { id: number; name: string };
  createdAt: string;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Notification {
  id: number;
  type: NotificationType;
  content: string;
  isRead: boolean;
  relatedId?: number;
  createdAt: string;
}
