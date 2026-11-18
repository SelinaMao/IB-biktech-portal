export type NotificationCategory = "ALL" | "TRANSACTION" | "ALERT" | "ANNOUNCEMENT";

export interface NotificationItem {
  id: string;
  category: "TRANSACTION" | "ALERT" | "ANNOUNCEMENT";
  title: string;
  description: string;
  time: string;
  avatar: string;
  avatarBg?: string;
  avatarColor?: string;
  read: boolean;
  link?: string;
}
