export type MessageStatus = 'sent' | 'draft';

export interface ManagementMessageItem {
  id: string;
  subject: string;
  body: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SaveMessageInput {
  subject: string;
  body: string;
}

export interface MessageListResponse {
  success: true;
  message: string;
  data: ManagementMessageItem[];
}

export interface MessageMutationResponse {
  success: true;
  message: string;
  data: ManagementMessageItem;
}

export interface DeleteMessageResponse {
  success: true;
  message: string;
}

