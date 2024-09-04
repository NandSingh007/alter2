export interface Comment {
  id: string;
  text: string;
  userName: string;
  userProfile: string;
  createdAt: Date | { toDate: () => Date };
  reactions: string[];
  replies?: Comment[];
}
