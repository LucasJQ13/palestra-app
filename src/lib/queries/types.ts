export type PublicQueryStatus = 'nueva' | 'leida' | 'respondida' | 'archivada';

export type PublicQueryDestination = 'comunidad' | 'diocesano' | 'nacional' | 'otro';

export type PublicQueryRecord = {
  id: string;
  sender_user_id: string | null;
  sender_name: string;
  sender_contact: string | null;
  message: string;
  destination_type: PublicQueryDestination;
  destination_name: string;
  origin: string;
  community_id: string | null;
  community_name: string | null;
  province: string | null;
  target_user_id: string | null;
  target_user_name: string | null;
  status: PublicQueryStatus;
  response: string | null;
  created_at: string;
  read_at: string | null;
  responded_at: string | null;
  archived_at: string | null;
};
