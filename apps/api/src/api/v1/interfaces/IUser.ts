export interface IUser {
  id_user?: string;

  str_username: string;
  str_email?: string | null;
  str_password?: string | null;
  bl_admin?: boolean;
  date_creation?: Date | null;
}
